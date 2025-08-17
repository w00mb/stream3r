// server/init-db.js
const fs = require('fs').promises;
const path = require('path');
const initSqlJs = require('sql.js');
const argon2 = require('argon2');

const dbFile = path.join(__dirname, '..', '..', '..', 'site.db');
const schemaFile = path.join(__dirname, 'schema.sql');

async function init() {
  try {
    await fs.access(dbFile);
    console.log('Database already exists. Skipping initialization.');
    return;
  } catch (e) {
    // Database does not exist, proceed with creation.
  }

  console.log('Creating new database...');
  
  try {
    const [SQL, schema] = await Promise.all([
      initSqlJs({ locateFile: file => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file) }),
      fs.readFile(schemaFile, 'utf8')
    ]);

    const db = new SQL.Database();

    // Hash the default admin password
    const password = 'admin'; // This should be stored securely
    const hash = await argon2.hash(password);
    const populatedSchema = schema.replace('REPLACE_WITH_ARGON2ID_HASH', hash);

    console.log('Executing schema...');
    db.exec(populatedSchema);
    
    const data = db.export();
    await fs.writeFile(dbFile, data);

    console.log('Database initialized successfully.');
    db.close();
  } catch (err) {
    console.error('Error initializing database:', err);
    // Attempt to clean up the created db file on error
    try {
      await fs.unlink(dbFile);
    } catch (cleanupErr) {
      // Ignore cleanup error
    }
    throw err;
  }
}

init().catch(err => {
  console.error(err);
  process.exit(1);
});