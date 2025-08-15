const path = require('path');
const fs = require('fs');
const Database = require('better-sqlite3');

describe('Database Connection', () => {
  let db;
  const dbPath = path.join(__dirname, 'test.db');

  beforeAll(() => {
    // Clean up any previous test.db file
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
    // Create a new database connection for testing
    db = new Database(dbPath);
  });

  afterAll(() => {
    // Close the database connection and delete the test.db file
    db.close();
    if (fs.existsSync(dbPath)) {
      fs.unlinkSync(dbPath);
    }
  });

  test('should connect to the database and set foreign keys pragma', () => {
    // Verify that the foreign_keys pragma is set to ON
    const result = db.prepare('PRAGMA foreign_keys').get();
    expect(result.foreign_keys).toBe(1);
  });

  test('should be able to execute a simple query', () => {
    db.exec('CREATE TABLE test_table (id INTEGER PRIMARY KEY, name TEXT)');
    db.prepare('INSERT INTO test_table (name) VALUES (?)').run('Test Name');
    const row = db.prepare('SELECT * FROM test_table WHERE name = ?').get('Test Name');
    expect(row).toBeDefined();
    expect(row.name).toBe('Test Name');
  });
});