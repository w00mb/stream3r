// server/init-db.js
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const argon2 = require('argon2');

const dbFile = path.join(__dirname, '..', '..', '..', 'site.db');
const schemaFile = path.join(__dirname, 'schema.sql');

async function init() {
  const dbExists = fs.existsSync(dbFile);
  if (dbExists) {
    console.log('Database already exists. Skipping initialization.');
    return;
  }

  console.log('Creating new database...');
  const db = new Database(dbFile);

  try {
    let schema = fs.readFileSync(schemaFile, 'utf8');

    // Hash the default admin password
    const password = 'admin'; // This should be stored securely, e.g., in an environment variable
    const hash = await argon2.hash(password);
    schema = schema.replace('REPLACE_WITH_ARGON2ID_HASH', hash);

    console.log('Executing schema...');
    db.exec(schema);
    console.log('Database initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    // Clean up the created db file on error
    fs.unlinkSync(dbFile);
    throw err;
  } finally {
    db.close();
  }
}

init().catch(err => {
  console.error(err);
  process.exit(1);
});
