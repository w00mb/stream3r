// server/db.js
// Single shared connection (sync, low cognitive load).
const Database = require('better-sqlite3');
const db = new Database('site.db', { fileMustExist: true });
db.pragma('foreign_keys = ON');
module.exports = db;
