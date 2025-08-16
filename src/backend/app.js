const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { getDb, saveDb } = require('./db');
const onFinished = require('on-finished');

const publicRoutes = require('./features/public/public.routes');
const adminRoutes = require('./features/admin/admin.routes');
const authRoutes = require('./features/auth/auth.routes');

const PORT = process.env.PORT || 3000;

async function setupApp(dbInstance) {
  const app = express();
  const db = dbInstance || await getDb();

  // Middleware
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());

  // Middleware to attach db to req
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Middleware to save db on write operations
  /* app.use((req, res, next) => {
    onFinished(res, async () => {
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        try {
          await saveDb();
          console.log('Database saved successfully.');
        } catch (err) {
          console.error('Failed to save database:', err);
        }
      }
    });
    next();
  }); */

  // Static files
  app.use('/public', express.static(path.join(__dirname, '..', '..', 'public')));
  app.use('/styles.css', (req, res) => res.sendFile(path.join(__dirname, '..', '..', 'public', 'css', 'styles.css')));

  // Routes
  app.use('/', publicRoutes);
  app.use('/', adminRoutes);
  app.use('/', authRoutes);

  // Root handlers for index and admin pages
  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', '..', 'src', 'frontend', 'main', 'index.html'));
  });

  app.get('/admin', (req, res) => {
    if (!req.cookies.session_token) {
      return res.redirect('/');
    }
    const stmt = db.prepare('SELECT * FROM sessions WHERE token = ?');
    stmt.bind([req.cookies.session_token]);
    let session = null;
    if (stmt.step()) {
        session = stmt.getAsObject();
    }
    stmt.free();

    if (!session) {
      return res.redirect('/');
    }
    res.sendFile(path.join(__dirname, '..', '..', 'src', 'frontend', 'admin', 'index.html'));
  });

  return app;
}

async function startServer() {
  const app = await setupApp();
  // Start server
  app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
      console.error("Failed to start server:", err);
      process.exit(1);
  });
}

module.exports = { setupApp };