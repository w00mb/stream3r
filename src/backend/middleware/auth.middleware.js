// src/backend/middleware/auth.middleware.js
const authenticateAdmin = (req, res, next) => {
  const db = req.db;
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
  next(); // User is authenticated, proceed to the next middleware/route handler
};

module.exports = { authenticateAdmin };