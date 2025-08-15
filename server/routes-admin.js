// server/routes-admin.js
// Admin partials + mutations (minimal today; expand as you wire each tab).
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();
const db = require('./db');

const readPartial = name => fs.readFileSync(path.join(__dirname, '..', 'partials', 'admin', name), 'utf8');

// Tab partials (lazy-loaded)
router.get('/partials/admin/tab-design', (req, res) => {
  res.type('html').send(readPartial('tab-design.html'));
});
router.get('/partials/admin/tab-bio', (req, res) => {
  res.type('html').send(readPartial('tab-bio.html'));
});
router.get('/partials/admin/tab-calender', (req, res) => {
  res.type('html').send(readPartial('tab-calender.html'));
});
router.get('/partials/admin/tab-metrics', (req, res) => {
  res.type('html').send(readPartial('tab-metrics.html'));
});

// Save site settings (tokens/layout)
// Expects nested names like site_settings[color][--accent] in the form.
router.post('/admin/settings', express.urlencoded({ extended: true }), (req, res) => {
  const upsert = db.prepare(`
    INSERT INTO site_settings(key, value) VALUES(?,?)
    ON CONFLICT(key) DO UPDATE SET value=excluded.value
  `);
  const t = db.transaction(body => {
    const groups = body.site_settings || {};
    for (const [group, obj] of Object.entries(groups)) {
      for (const [k, v] of Object.entries(obj)) upsert.run(`${group}.${k}`, v);
    }
    if (body.layout_mode) upsert.run('layout.mode', body.layout_mode);
  });
  t(req.body);
  res.type('html').send(`<span class="color-fg-muted">Saved ✓</span>`);
});

// Bulk save events (simple upserts)
router.post('/admin/events/bulk', express.urlencoded({ extended: true }), (req, res) => {
  const rows = req.body.events || [];
  const stmt = db.prepare(`
    INSERT INTO events(date_iso, title, location, time_text, link)
    VALUES(@date, @title, @location, @time_text, @link)
    ON CONFLICT(date_iso, title) DO UPDATE SET
      location=excluded.location,
      time_text=excluded.time_text,
      link=excluded.link
  `);
  const t = db.transaction(values => {
    (Array.isArray(values) ? values : []).forEach(r => {
      stmt.run({
        date: r.date || null,
        title: r.title || '',
        location: r.location || null,
        time_text: r.time || r.time_text || null,
        link: r.link || null
      });
    });
  });
  t(rows);
  res.type('html').send(`<span class="color-fg-muted">Events saved ✓</span>`);
});

module.exports = router;
