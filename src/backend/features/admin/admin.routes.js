// server/routes-admin.js
const fs = require('fs');
const path = require('path');
const express = require('express');
const router = express.Router();

const readPartial = name => fs.readFileSync(path.join(__dirname, '..', '..', 'frontend', 'admin', 'partials', name), 'utf8');

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
router.post('/admin/settings', express.urlencoded({ extended: true }), (req, res) => {
  const db = req.db;
  try {
    db.exec('BEGIN TRANSACTION');
    const upsert = db.prepare(`
      INSERT INTO site_settings(key, value) VALUES(?,?)
      ON CONFLICT(key) DO UPDATE SET value=excluded.value
    `);
    const groups = req.body.site_settings || {};
    for (const [group, obj] of Object.entries(groups)) {
      for (const [k, v] of Object.entries(obj)) upsert.run([`${group}.${k}`, v]);
    }
    if (req.body.layout_mode) upsert.run(['layout.mode', req.body.layout_mode]);
    upsert.free();
    db.exec('COMMIT');
    res.type('html').send(`<span class="color-fg-muted">Saved ✓</span>`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error saving settings:', err);
    res.status(500).send('<span class="color-fg-danger">Error saving settings</span>');
  }
});

// Save profile and social links
router.post('/admin/profile', express.urlencoded({ extended: true }), (req, res) => {
  const db = req.db;
  try {
    const profileData = req.body.profile || {};
    const socialLinksData = req.body.social_links || [];

    db.exec('BEGIN TRANSACTION');
    
    db.run('UPDATE profile SET name = ?, bio = ?, image_url = ? WHERE id = 1', 
      [profileData.name, profileData.bio, profileData.image_url]
    );

    db.run('DELETE FROM social_links WHERE profile_id = 1');

    const insertSocialLink = db.prepare(`
      INSERT INTO social_links (profile_id, platform, label, url, style, position, custom_icon_url, use_custom_icon)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    socialLinksData.forEach((link, index) => {
      insertSocialLink.run([
        1, // Assuming profile_id is always 1
        link.platform,
        link.label,
        link.url,
        link.style,
        index + 1, // Position
        link.custom_icon_url || null,
        parseInt(link.use_custom_icon)
      ]);
    });
    insertSocialLink.free();
    db.exec('COMMIT');

    res.type('html').send(`<span class="color-fg-muted">Profile saved ✓</span>`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error saving profile:', err);
    res.status(500).send('<span class="color-fg-danger">Error saving profile</span>');
  }
});

// Create new post
router.post('/admin/posts', express.urlencoded({ extended: true }), (req, res) => {
  const db = req.db;
  const postData = req.body.post || {};
  const userId = 1; // Assume user_id 1 for now

  db.run('INSERT INTO posts (user_id, content, image_url) VALUES (?, ?, ?)', 
    [userId, postData.content, postData.image_url || null]
  );

  res.type('html').send(`<span class="color-fg-muted">Post created ✓</span>`);
});

// List existing posts for admin panel
router.get('/partials/admin/posts-list', (req, res) => {
  const db = req.db;
  const stmt = db.prepare('SELECT * FROM posts ORDER BY created_at DESC');
  const posts = [];
  while(stmt.step()) {
    posts.push(stmt.getAsObject());
  }
  stmt.free();

  res.type('html').send(`
    <ul class="list-group">
      ${posts.map(post => `
        <li class="list-group-item d-flex flex-column gap-1 p-2 border-bottom">
          <div class="text-bold">${post.content}</div>
          ${post.image_url ? `<img src="${post.image_url}" alt="Post image" style="max-width: 100px; height: auto;" />` : ''}
          <small class="color-fg-muted">Posted on ${new Date(post.created_at).toLocaleString()}</small>
        </li>
      `).join('')}
    </ul>
  `);
});

// Bulk save events (simple upserts)
router.post('/admin/events/bulk', express.urlencoded({ extended: true }), (req, res) => {
  const db = req.db;
  const rows = req.body.events || [];
  
  try {
    db.exec('BEGIN TRANSACTION');
    const stmt = db.prepare(`
      INSERT INTO events(date_iso, title, location, time_text, link)
      VALUES(@date, @title, @location, @time_text, @link)
      ON CONFLICT(date_iso, title) DO UPDATE SET
        location=excluded.location,
        time_text=excluded.time_text,
        link=excluded.link
    `);
    (Array.isArray(rows) ? rows : []).forEach(r => {
      stmt.run({
        '@date': r.date || null,
        '@title': r.title || '',
        '@location': r.location || null,
        '@time_text': r.time || r.time_text || null,
        '@link': r.link || null
      });
    });
    stmt.free();
    db.exec('COMMIT');
    res.type('html').send(`<span class="color-fg-muted">Events saved ✓</span>`);
  } catch (err) {
    db.exec('ROLLBACK');
    console.error('Error saving events:', err);
    res.status(500).send('<span class="color-fg-danger">Error saving events</span>');
  }
});

module.exports = router;