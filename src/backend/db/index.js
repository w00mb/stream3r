const fs = require('fs').promises;
const path = require('path');
const initSqlJs = require('sql.js');

let dbPath = path.join(__dirname, '..', '..', '..', 'site.db');
let dbInstance = null;

// For testing purposes, allow changing the DB path
function setDbPath(newPath) {
  dbPath = newPath;
  dbInstance = null; // Reset instance when path changes
}

async function getDb() {
  if (dbInstance) {
    return dbInstance;
  }

  try {
    const [SQL, fileBuffer] = await Promise.all([
      initSqlJs({ locateFile: file => `../../node_modules/sql.js/dist/${file}` }),
      fs.readFile(dbPath)
    ]);
    dbInstance = new SQL.Database(fileBuffer);
    // Enable foreign key support
    dbInstance.exec('PRAGMA foreign_keys = ON;');
    return dbInstance;
  } catch (error) {
    console.error("Failed to initialize database:", error);
    throw error;
  }
}

async function saveDb() {
  if (!dbInstance) {
    throw new Error("Database not initialized. Cannot save.");
  }
  const data = dbInstance.export();
  await fs.writeFile(dbPath, data);
}

module.exports = { getDb, saveDb, setDbPath };
