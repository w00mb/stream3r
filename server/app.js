// server/app.js
const express = require('express');
const cookieParser = require('cookie-parser');
const path = require('path');
const db = require('./db');

const publicRoutes = require('./routes-public');
const adminRoutes = require('./routes-admin');
const authRoutes = require('./routes-auth');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static files
app.use('/public', express.static(path.join(__dirname, '..', 'public')));
app.use('/styles.css', (req, res) => res.sendFile(path.join(__dirname, '..', 'styles.css')));

// Routes
app.use('/', publicRoutes);
app.use('/', adminRoutes);
app.use('/', authRoutes);

// Root handlers for index and admin pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'index.html'));
});

app.get('/admin', (req, res) => {
  // Basic auth check
  console.log('Admin route hit');
  console.log('Session token from cookie:', req.cookies.session_token);
  if (!req.cookies.session_token) {
    return res.redirect('/');
  }
  const session = db.prepare('SELECT * FROM sessions WHERE token = ?').get(req.cookies.session_token);
  console.log('Session from DB:', session);
  if (!session) {
    return res.redirect('/');
  }
  res.sendFile(path.join(__dirname, '..', 'admin.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
