// server/db.js
// Single shared connection (sync, low cognitive load).
const path = require('path');
const Database = require('better-sqlite3');
const dbPath = path.join(__dirname, '..', '..', '..', 'site.db');
const db = new Database(dbPath, { fileMustExist: true });
db.pragma('foreign_keys = ON');
module.exports = db;
