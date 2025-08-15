// server/routes-auth.js
const express = require('express');
const router = express.Router();
const db = require('./db');
const argon2 = require('argon2');
const crypto = require('crypto');

router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);

  if (!user) {
    return res.status(401).send('<div class="auth-inline color-fg-danger">Invalid credentials</div>');
  }

  try {
    if (await argon2.verify(user.password_hash, password)) {
      const token = crypto.randomBytes(32).toString('hex');
      const expires = new Date();
      expires.setHours(expires.getHours() + 24);

      db.prepare('INSERT INTO sessions (user_id, token, expires_at) VALUES (?, ?, ?)').run(user.id, token, expires.toISOString());

      res.cookie('session_token', token, { httpOnly: true, secure: process.env.NODE_ENV === 'production', expires });
      res.send(`
        <div id="auth-slot" class="d-flex flex-items-center gap-2">
          <span class="text-bold">Welcome, ${user.username}</span>
          <form hx-post="/logout" hx-target="#auth-slot" hx-swap="outerHTML">
            <button class="Button Button--invisible size-small" type="submit">Logout</button>
          </form>
        </div>
      `);
    } else {
      res.status(401).send('<div class="auth-inline color-fg-danger">Invalid credentials</div>');
    }
  } catch (err) {
    console.error(err);
    res.status(500).send('<div class="auth-inline color-fg-danger">Server error</div>');
  }
});

router.post('/logout', (req, res) => {
  const token = req.cookies.session_token;
  if (token) {
    db.prepare('DELETE FROM sessions WHERE token = ?').run(token);
  }
  res.clearCookie('session_token');
  res.send(`
    <div id="auth-slot">
      <form class="auth-inline d-flex flex-items-center gap-2"
            hx-post="/login"
            hx-target="#auth-slot"
            hx-swap="outerHTML">
        <input class="FormControl input size-small" name="username" placeholder="Username" required>
        <input class="FormControl input size-small" type="password" name="password" placeholder="Password" required>
        <button class="Button Button--primary size-small" type="submit">Login</button>
      </form>
    </div>
  `);
});

module.exports = router;
