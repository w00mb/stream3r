const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const initSqlJs = require('sql.js');
const { setupApp } = require('../../../backend/app');

describe('Admin Routes Integration Tests', () => {
  let app;
  let db;

  // We use beforeEach to get a fresh, clean database for every single test
  beforeEach(async () => {
    const wasmPath = path.join(__dirname, '..\/db\/sql-wasm.wasm');
    const wasmBinary = await fs.readFile(wasmPath);
    const SQL = await initSqlJs({ wasmBinary });
    db = new SQL.Database();

    const schemaPath = path.join(__dirname, '..', '..', '..', 'backend', 'db', 'schema.sql');
    let schema = await fs.readFile(schemaPath, 'utf8');
    // In a real scenario, we might not need a default hashed password for all tests,
    // but for simplicity, we'll keep the schema logic consistent.
    const populatedSchema = schema.replace('REPLACE_WITH_ARGON2ID_HASH', 'test_hash');
    db.exec(populatedSchema);

    // Seed data required for admin tests
    db.run("INSERT INTO profile(id, name, bio, image_url) VALUES (1, 'Test Profile', 'Test Bio', 'test.jpg');");
    db.run("INSERT INTO users(id, username, password_hash, role) VALUES (1, 'testuser', 'test_hash', 'admin');");

    app = await setupApp(db);
  });

  afterEach(() => {
    db.close();
  });

  describe('POST /admin/settings', () => {
    test('should save site settings correctly', async () => {
      await request(app)
        .post('/admin/settings')
        .send({ site_settings: { color: { '--accent': '#ff0000' } } })
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Saved ✓');
        });

      const result = db.exec("SELECT value FROM site_settings WHERE key = 'color.--accent'");
      expect(result[0].values[0][0]).toBe('#ff0000');
    });
  });

  describe('POST /admin/profile', () => {
    test('should update the profile correctly', async () => {
      await request(app)
        .post('/admin/profile')
        .send({ profile: { name: 'New Name', bio: 'New Bio', image_url: 'new.jpg' } })
        .expect(200);

      const profile = db.exec("SELECT * FROM profile WHERE id = 1")[0].values[0];
      expect(profile[1]).toBe('New Name');
      expect(profile[2]).toBe('New Bio');
    });
  });

  describe('POST /admin/posts', () => {
    test('should create a new post', async () => {
      await request(app)
        .post('/admin/posts')
        .send({ post: { content: 'This is a test post' } })
        .expect(200);

      const result = db.exec("SELECT content FROM posts WHERE content = 'This is a test post'");
      expect(result[0].values.length).toBe(1);
    });
  });

  describe('GET /partials/admin/posts-list', () => {
    test('should return a list of posts', async () => {
      // Seed the database for this test
      db.run("INSERT INTO posts (user_id, content) VALUES (?, ?), (?, ?)", [1, 'Post 1', 1, 'Post 2']);

      await request(app)
        .get('/partials/admin/posts-list')
        .expect(200)
        .expect(res => {
          expect(res.text).toContain('Post 1');
          expect(res.text).toContain('Post 2');
        });
    });
  });

  describe('POST /admin/events/bulk', () => {
    test('should bulk insert events', async () => {
      const events = [
        { date: '2025-10-01', title: 'Event 1' }
      ];

      await request(app)
        .post('/admin/events/bulk')
        .send({ events: events })
        .expect(200);

      const result = db.exec("SELECT * FROM events");
      expect(result[0].values.length).toBe(1);
      expect(result[0].values[0][2]).toBe('Event 1'); // Check the newly inserted event
    });
  });
});