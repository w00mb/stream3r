// server/routes-public.js
const express = require('express');
const router = express.Router();
const db = require('../db');

// Tokens → CSS variables in a <style> block (hydrated from v_site_tokens)
router.get('/partials/tokens', (req, res) => {
  const row = db.prepare('SELECT tokens_json FROM v_site_tokens').get() || { tokens_json: '{}' };
  const tokens = JSON.parse(row.tokens_json || '{}');

  // Map your KV naming to CSS vars you use in styles.css
  const mapKey = k => k
    .replace(/^color\./, '--color-')
    .replace(/^spacing\./, '--')
    .replace(/^layout\./, '--');

  const lines = Object.entries(tokens).map(([k, v]) => `  ${mapKey(k)}: ${v};`);
  res.type('html').send(`<style>:root{\n${lines.join('\n')}\n}</style>`);
});

// Profile card → from v_profile
router.get('/partials/profile', (req, res) => {
  const p = db.prepare('SELECT id,name,bio,image_url,socials_json FROM v_profile').get();
  if (!p) return res.type('html').send(`<div class="p-3 color-fg-muted">No profile configured.</div>`);
  const socials = p.socials_json ? JSON.parse(p.socials_json).sort((a,b)=>a.position-b.position) : [];
  res.type('html').send(`
    <div class="Card profile-card d-flex">
      <div class="profile-media"><img src="${p.image_url}" alt="Profile portrait"></div>
      <div class="profile-body">
        <h2 class="f2 text-semibold">${p.name}</h2>
        <p class="color-fg-muted">${p.bio}</p>
        <nav class="social-links d-flex flex-wrap gap-2">
          ${socials.map(s => {
            const iconHtml = s.use_custom_icon && s.custom_icon_url
              ? `<img src="${s.custom_icon_url}" alt="${s.label}" style="width: 24px; height: 24px;" />`
              : s.label;
            return `<a class="Button Button--invisible" href="${s.url || '#'}">${iconHtml}</a>`;
          }).join('')}
        </nav>
      </div>
    </div>`);
});

// Events list → from v_events_upcoming
router.get('/partials/events', (req, res) => {
  const rows = db.prepare('SELECT * FROM v_events_upcoming').all();
  res.type('html').send(`
    <header class="d-flex flex-justify-between flex-items-center">
      <h3 class="f4 text-semibold m-0">Upcoming</h3>
      <div class="d-flex gap-1">
        <button class="Button Button--invisible size-small" disabled>‹</button>
        <button class="Button Button--invisible size-small" disabled>›</button>
      </div>
    </header>
    <ul class="event-list">
      ${rows.map(r=>`
        <li class="event">
          <div class="event-date">
            <span class="event-day">${r.day_num}</span>
            <span class="event-month">${r.month_num}</span>
          </div>
          <div class="event-info">
            <span class="event-title">${r.title}</span>
            <span class="event-meta color-fg-muted">${r.location||''}${r.time_text ? ' • ' + r.time_text : ''}</span>
          </div>
          ${r.link ? `<a class="Button Button--invisible" href="${r.link}">Details</a>` : ''}
        </li>`).join('')}
    </ul>`);
});

// Feed from posts table
router.get('/partials/feed', (req, res) => {
  const posts = db.prepare('SELECT * FROM posts ORDER BY created_at DESC').all();
  res.type('html').send(`
    ${posts.map(post => `
      <article class="post">
        <a class="avatar" href="#"><img src="https://i.pravatar.cc/64?img=5" alt="Avatar" /></a>
        <div class="post-body">
          <div class="post-header">
            <div class="identity"><span class="name text-semibold">Admin</span><span class="handle color-fg-muted">@admin</span></div>
            <time class="timestamp color-fg-muted">${new Date(post.created_at).toLocaleString()}</time>
          </div>
          <div class="post-content">
            <p>${post.content}</p>
            ${post.image_url ? `<img src="${post.image_url}" alt="Post image" style="max-width: 100%; height: auto; display: block; margin-top: 10px;" />` : ''}
          </div>
        </div>
      </article>
    `).join('')}
  `);
});


module.exports = router;
