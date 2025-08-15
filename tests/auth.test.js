const express = require('express');
const request = require('supertest'); // Supertest for testing HTTP requests
const argon2 = require('argon2');
const db = require('../server/db'); // The actual db module, will be mocked
const authRoutes = require('../server/routes-auth'); // The module to test

// Mock the db module
jest.mock('../server/db', () => ({
  prepare: jest.fn().mockReturnThis(),
  get: jest.fn(),
  run: jest.fn(),
  transaction: jest.fn(cb => cb()), // Mock transaction to just execute the callback
}));

// Mock argon2
jest.mock('argon2', () => ({
  verify: jest.fn(),
  hash: jest.fn(), // Also mock hash in case it's used elsewhere
}));

jest.mock('crypto', () => {
  const originalCrypto = jest.requireActual('crypto');
  return {
    ...originalCrypto,
    randomBytes: jest.fn(() => ({
      toString: jest.fn(() => 'mocked_session_token'),
    })),
  };
});

// Create a simple Express app to test the routes
const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(require('cookie-parser')()); // Use cookie-parser middleware
app.use('/', authRoutes);

describe('Auth Routes', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('POST /login', () => {
    test('should return 200 and set cookie on successful login', async () => {
      // Mock db.get to return a user
      db.prepare.mockReturnThis();
      db.get.mockReturnValueOnce({ id: 1, username: 'testuser', password_hash: 'hashed_password' });

      // Mock argon2.verify to return true
      argon2.verify.mockResolvedValueOnce(true);

      const res = await request(app)
        .post('/login')
        .send('username=testuser&password=password123');

      expect(res.statusCode).toEqual(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('session_token=mocked_session_token');
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?');
      expect(db.get).toHaveBeenCalledWith('testuser');
      expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'password123');
      expect(db.prepare).toHaveBeenCalledWith('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)');
      expect(db.run).toHaveBeenCalledWith(1, 'mocked_session_token', expect.any(String));
    });

    test('should return 401 on invalid credentials (user not found)', async () => {
      // Mock db.get to return undefined (user not found)
      db.prepare.mockReturnThis();
      db.get.mockReturnValueOnce(undefined);

      const res = await request(app)
        .post('/login')
        .send('username=nonexistent&password=password123');

      expect(res.statusCode).toEqual(401);
      expect(res.text).toContain('Invalid credentials');
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?');
      expect(db.get).toHaveBeenCalledWith('nonexistent');
      expect(argon2.verify).not.toHaveBeenCalled(); // Should not call verify if user not found
      expect(db.run).not.toHaveBeenCalled(); // Should not insert session
    });

    test('should return 401 on invalid credentials (incorrect password)', async () => {
      // Mock db.get to return a user
      db.prepare.mockReturnThis();
      db.get.mockReturnValueOnce({ id: 1, username: 'testuser', password_hash: 'hashed_password' });

      // Mock argon2.verify to return false
      argon2.verify.mockResolvedValueOnce(false);

      const res = await request(app)
        .post('/login')
        .send('username=testuser&password=wrongpassword');

      expect(res.statusCode).toEqual(401);
      expect(res.text).toContain('Invalid credentials');
      expect(db.prepare).toHaveBeenCalledWith('SELECT * FROM users WHERE username = ?');
      expect(db.get).toHaveBeenCalledWith('testuser');
      expect(argon2.verify).toHaveBeenCalledWith('hashed_password', 'wrongpassword');
      expect(db.run).not.toHaveBeenCalled(); // Should not insert session
    });

    test('should return 500 on server error during login', async () => {
      // Mock argon2.verify to throw an error
      argon2.verify.mockRejectedValueOnce(new Error('Argon2 error'));

      // Mock db.get to return a user
      db.prepare.mockReturnThis();
      db.get.mockReturnValueOnce({ id: 1, username: 'testuser', password_hash: 'hashed_password' });

      const res = await request(app)
        .post('/login')
        .send('username=testuser&password=password123');

      expect(res.statusCode).toEqual(500);
      expect(res.text).toContain('Server error');
    });
  });

  describe('POST /logout', () => {
    test('should clear cookie and delete session on successful logout', async () => {
      // Simulate a cookie being present
      const res = await request(app)
        .post('/logout')
        .set('Cookie', ['session_token=existing_session_token']);

      expect(res.statusCode).toEqual(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('session_token=;'); // Check for cleared cookie
      expect(db.prepare).toHaveBeenCalledWith('DELETE FROM sessions WHERE token = ?');
      expect(db.run).toHaveBeenCalledWith('existing_session_token');
    });

    test('should clear cookie even if session token is not found in db', async () => {
      // Simulate a cookie being present, but db.run does nothing
      db.run.mockReturnValueOnce({ changes: 0 }); // Simulate no rows affected

      const res = await request(app)
        .post('/logout')
        .set('Cookie', ['session_token=nonexistent_session_token']);

      expect(res.statusCode).toEqual(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('session_token=;');
      expect(db.prepare).toHaveBeenCalledWith('DELETE FROM sessions WHERE token = ?');
      expect(db.run).toHaveBeenCalledWith('nonexistent_session_token');
    });

    test('should do nothing if no session cookie is present', async () => {
      const res = await request(app)
        .post('/logout');

      expect(res.statusCode).toEqual(200);
      expect(res.headers['set-cookie']).toBeUndefined(); // No set-cookie header
      expect(db.prepare).not.toHaveBeenCalled();
      expect(db.run).not.toHaveBeenCalled();
    });
  });
});