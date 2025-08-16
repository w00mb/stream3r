const request = require('supertest');
const fs = require('fs').promises;
const path = require('path');
const initSqlJs = require('sql.js');
const argon2 = require('argon2');
const { setupApp } = require('../../../backend/app');

describe('Auth Routes Integration Tests', () => {
  let app;
  let db;

  beforeAll(async () => {
    // Initialize a real in-memory sql.js database
    const wasmPath = path.join(__dirname, '..\/db\/sql-wasm.wasm');
    const wasmBinary = await fs.readFile(wasmPath);
    const SQL = await initSqlJs({ wasmBinary });
    db = new SQL.Database();

    // Read and prepare the schema
    const schemaPath = path.join(__dirname, '..', '..', '..', 'backend', 'db', 'schema.sql');
    let schema = await fs.readFile(schemaPath, 'utf8');
    const testPassword = 'admin';
    const hash = await argon2.hash(testPassword);
    const populatedSchema = schema.replace('REPLACE_WITH_ARGON2ID_HASH', hash);
    
    // Execute the schema to create tables
    db.exec(populatedSchema);

    // Seed the admin user for login tests
    db.run('INSERT INTO users(username, password_hash, role) VALUES (?, ?, ?)', ['admin', hash, 'admin']);

    // Get the configured app instance with our in-memory db
    app = await setupApp(db);
  });

  afterAll(() => {
    db.close();
  });

  describe('POST /login', () => {
    test('should return 200 and set cookie on successful login', async () => {
      const res = await request(app)
        .post('/login')
        .send('username=admin&password=admin'); // The default user from schema.sql

      expect(res.statusCode).toEqual(200);
      expect(res.headers['set-cookie']).toBeDefined();
      expect(res.headers['set-cookie'][0]).toContain('session_token');

      // Verify that a session was actually created in the database
      const sessionRes = db.exec("SELECT * FROM sessions WHERE user_id = 1");
      expect(sessionRes[0].values.length).toBe(1);
    });

    test('should return 401 on incorrect password', async () => {
      const res = await request(app)
        .post('/login')
        .send('username=admin&password=wrongpassword');

      expect(res.statusCode).toEqual(401);
      expect(res.text).toContain('Invalid credentials');
    });

    test('should return 401 for non-existent user', async () => {
      const res = await request(app)
        .post('/login')
        .send('username=nouser&password=password');

      expect(res.statusCode).toEqual(401);
      expect(res.text).toContain('Invalid credentials');
    });
  });

  describe('POST /logout', () => {
    test('should clear cookie and delete session on successful logout', async () => {
      // Ensure a clean slate for sessions before inserting
      db.exec('DELETE FROM sessions;');

      // Manually insert a session to be deleted
      const testToken = 'test_session_token';
      db.run('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)', [1, testToken, new Date().toISOString()]);

      // Verify it was inserted
      let sessionRes = db.exec("SELECT * FROM sessions");
      expect(sessionRes[0].values.length).toBe(1);

      // Now, log out
      const logoutRes = await request(app)
        .post('/logout')
        .set('Cookie', [`session_token=${testToken}`]);

      expect(logoutRes.statusCode).toEqual(200);
      expect(logoutRes.headers['set-cookie'][0]).toContain('session_token=;');

      // Verify the session was deleted from the database
      sessionRes = db.exec("SELECT * FROM sessions");
      expect(sessionRes.length).toBe(0); // No results should be found
    });
  });
});