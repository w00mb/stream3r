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
router.get('/partials/admin/tab-feed', (req, res) => {
  res.type('html').send(readPartial('tab-feed.html'));
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

// Save profile and social links
router.post('/admin/profile', express.urlencoded({ extended: true }), (req, res) => {
  const profileData = req.body.profile || {};
  const socialLinksData = req.body.social_links || [];

  db.transaction(() => {
    // Update profile
    db.prepare(`
      UPDATE profile
      SET name = ?, bio = ?, image_url = ?
      WHERE id = 1
    `).run(profileData.name, profileData.bio, profileData.image_url);

    // Delete existing social links for profile 1
    db.prepare('DELETE FROM social_links WHERE profile_id = 1').run();

    // Insert new social links
    const insertSocialLink = db.prepare(`
      INSERT INTO social_links (profile_id, platform, label, url, style, position, custom_icon_url, use_custom_icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    socialLinksData.forEach((link, index) => {
      insertSocialLink.run(
        1, // Assuming profile_id is always 1 for now
        link.platform,
        link.label,
        link.url,
        link.style,
        index + 1, // Position
        link.custom_icon_url || null,
        link.use_custom_icon ? 1 : 0
      );
    });
  })(); // Immediately invoke the transaction

  res.type('html').send(`<span class="color-fg-muted">Profile saved ✓</span>`);
});

// Create new post
router.post('/admin/posts', express.urlencoded({ extended: true }), (req, res) => {
  const postData = req.body.post || {};
  // For now, assume user_id 1. In a real app, this would come from session/auth.
  const userId = 1;

  db.prepare(`
    INSERT INTO posts (user_id, content, image_url)
    VALUES (?, ?, ?)
  `).run(userId, postData.content, postData.image_url || null);

  res.type('html').send(`<span class="color-fg-muted">Post created ✓</span>`);
});

// List existing posts for admin panel
router.get('/partials/admin/posts-list', (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  res.type('html').send(
    `<ul class=\"list-group\">\n      ${posts.map(post => `\n        <li class=\"list-group-item d-flex flex-column gap-1 p-2 border-bottom\">\n          <div class=\"text-bold\">${post.content}</div>\n          ${post.image_url ? `<img src=\"${\npost.image_url}\" alt=\"Post image\" style=\"max-width: 100px; height: auto;\" />` : ''}\n          <small class=\"color-fg-muted\">Posted on ${\nnew Date(post.created_at).toLocaleString()}\n</small>\n        </li>\n      `).join('')}\n    </ul>`
  );
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
