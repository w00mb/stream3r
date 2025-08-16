const express = require('express');
const request = require('supertest');
const db = require('../server/db');
const adminRoutes = require('../server/routes-admin');

// Mock the db module
jest.mock('../server/db', () => ({
  prepare: jest.fn().mockReturnThis(),
  run: jest.fn(),
  get: jest.fn(),
  all: jest.fn(),
  transaction: jest.fn(cb => {
    return (args) => {
      cb(args);
    };
  }), // Mock transaction to just execute the callback
}));

// Create a simple Express app to test the routes
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use('/', adminRoutes);

describe('Admin Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /admin/settings', () => {
    test('should save site settings and return success message', async () => {
      const res = await request(app)
        .post('/admin/settings')
        .send({
          site_settings: {
            color: { '--accent': '#ff0000' },
            layout: { mode: 'stack' }
          },
          layout_mode: 'stack' // This is also sent by the form
        });

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('Saved ✓');
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO site_settings'));
      expect(db.run).toHaveBeenCalledWith('color.--accent', '#ff0000');
      expect(db.run).toHaveBeenCalledWith('layout.mode', 'stack');
    });
  });

  describe('POST /admin/profile', () => {
    test('should save profile and social links and return success message', async () => {
      const res = await request(app)
        .post('/admin/profile')
        .send({
          profile: {
            name: 'Test User',
            bio: 'Test Bio',
            image_url: 'http://example.com/image.jpg'
          },
          social_links: [
            { platform: 'twitter', label: 'Twitter', url: 'http://twitter.com', style: 'brand', custom_icon_url: null, use_custom_icon: '0' },
            { platform: 'custom', label: 'My Site', url: 'http://mysite.com', style: 'neutral', custom_icon_url: 'http://example.com/icon.png', use_custom_icon: '1' }
          ]
        });

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('Profile saved ✓');
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('UPDATE profile'));
      expect(db.run).toHaveBeenCalledWith('Test User', 'Test Bio', 'http://example.com/image.jpg');
      expect(db.prepare).toHaveBeenCalledWith('DELETE FROM social_links WHERE profile_id = 1');
      expect(db.run).toHaveBeenCalledWith(); // For the delete
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO social_links'));
      expect(db.run).toHaveBeenCalledWith(1, 'twitter', 'Twitter', 'http://twitter.com', 'brand', 1, null, 0);
      expect(db.run).toHaveBeenCalledWith(1, 'custom', 'My Site', 'http://mysite.com', 'neutral', 2, 'http://example.com/icon.png', 1);
    });
  });

  describe('POST /admin/posts', () => {
    test('should create a new post and return success message', async () => {
      const res = await request(app)
        .post('/admin/posts')
        .send({
          post: {
            content: 'New test post',
            image_url: 'http://example.com/post_image.jpg'
          }
        });

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('Post created ✓');
      expect(db.prepare).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO posts'));
      expect(db.run).toHaveBeenCalledWith(1, 'New test post', 'http://example.com/post_image.jpg');
    });
  });

  describe('GET /partials/admin/posts-list', () => {
    test('should return a list of posts', async () => {
      db.all.mockReturnValueOnce([
        { id: 1, user_id: 1, content: 'Post 1', image_url: null, created_at: '2025-01-01T10:00:00Z' },
        { id: 2, user_id: 1, content: 'Post 2', image_url: 'http://example.com/img2.jpg', created_at: '2025-01-02T10:00:00Z' }
      ]);

      const res = await request(app)
        .get('/partials/admin/posts-list');

      expect(res.statusCode).toEqual(200);
      expect(res.text).toContain('Post 1');
      expect(res.text).toContain('Post 2');
      expect(res.text).toContain('Post image'); // For image_url
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM posts ORDER BY created_at DESC');
      expect(db.all).toHaveBeenCalled();
    });

    test('should return empty list if no posts', async () => {
      db.all.mockReturnValueOnce([]);

      const res = await request(app)
        .get('/partials/admin/posts-list');

      expect(res.statusCode).toEqual(200);
      expect(res.text).not.toContain('list-group-item'); // No list items
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM posts ORDER BY created_at DESC');
      expect(db.all).toHaveBeenCalled();
    });
  });
});