const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const { getDb, saveDb } = require('./db');
const onFinished = require('on-finished');
const helmet = require('helmet'); // Added helmet

const publicRoutes = require('./features/public/public.routes');
const adminRoutes = require('./features/admin/admin.routes');
const authRoutes = require('./features/auth/auth.routes');
const { port } = require('./config');

async function setupApp(dbInstance) {
  const app = express();
  const db = dbInstance || await getDb();

  // Middleware
  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(helmet()); // Use Helmet for security headers

  // Middleware to attach db to req
  app.use((req, res, next) => {
    req.db = db;
    next();
  });

  // Middleware to save db on write operations
  app.use((req, res, next) => {
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
  });

  // Static files
  app.use('/public', express.static(path.join(__dirname, '..', '..', 'public')));

  // Routes
  app.use('/', publicRoutes);
  app.use('/', adminRoutes);
  app.use('/', authRoutes);

  

  // Global Error Handler
  app.use((err, req, res, next) => {
    console.error(err.stack); // Log the error stack for debugging
    res.status(500).send('Internal Server Error'); // Send a generic error response
  });

  return app;
}

async function startServer() {
  const app = await setupApp();
  // Start server
  app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

if (require.main === module) {
  startServer().catch(err => {
      console.error("Failed to start server:", err);
      process.exit(1);
  });
}

module.exports = { setupApp };