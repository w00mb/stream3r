-- Your Project Name — schema v2
-- Focus: Auth + advanced SQLite features for analytics and templating readiness.

PRAGMA foreign_keys = ON;
PRAGMA journal_mode = WAL;
PRAGMA synchronous = NORMAL;
PRAGMA temp_store = MEMORY;

-- Optional versioning (for your migration tooling)
PRAGMA application_id = 710215; -- arbitrary non-zero
PRAGMA user_version = 2; -- bump when schema changes



-- =========================
-- Site-level settings
-- =========================

CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
) STRICT;

CREATE TABLE IF NOT EXISTS site_branding (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  header_title TEXT NOT NULL,
  header_align TEXT NOT NULL CHECK (header_align IN ('flex-start','center','flex-end')),
  footer_text TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
) STRICT;

CREATE TABLE IF NOT EXISTS nav_links (
  id INTEGER PRIMARY KEY,
  area TEXT NOT NULL CHECK (area IN ('header','footer')),
  label TEXT NOT NULL,
  href TEXT NOT NULL,
  style TEXT NOT NULL DEFAULT 'link' CHECK (style IN ('link','button')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
) STRICT;
CREATE INDEX IF NOT EXISTS idx_nav_links_area_pos ON nav_links(area, position);
CREATE UNIQUE INDEX IF NOT EXISTS ux_nav_links_area_position ON nav_links(area, position);

CREATE TABLE IF NOT EXISTS section_order (
  position INTEGER PRIMARY KEY,
  section TEXT NOT NULL UNIQUE CHECK (section IN ('profile','events','feed'))
) WITHOUT ROWID, STRICT;

-- =========================
-- Profile and social links
-- =========================

CREATE TABLE IF NOT EXISTS profile (
  id INTEGER PRIMARY KEY,
  name TEXT NOT NULL,
  bio TEXT NOT NULL,
  image_url TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP)
) STRICT;

CREATE TABLE IF NOT EXISTS social_links (
  id INTEGER PRIMARY KEY,
  profile_id INTEGER NOT NULL REFERENCES profile(id) ON DELETE CASCADE,
  platform TEXT NOT NULL CHECK (platform IN ('twitter','instagram','linkedin','website','custom')),
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  style TEXT NOT NULL DEFAULT 'brand' CHECK (style IN ('brand','neutral')),
  position INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  custom_icon_url TEXT,
  use_custom_icon INTEGER NOT NULL DEFAULT 0 CHECK (use_custom_icon IN (0,1))
) STRICT;
CREATE INDEX IF NOT EXISTS idx_social_links_profile_pos ON social_links(profile_id, position);

-- =========================
-- Events / calendar
-- =========================

CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY,
  date_iso TEXT NOT NULL CHECK (length(date_iso)=10 AND substr(date_iso,5,1)='-' AND substr(date_iso,8,1)='-'),
  title TEXT NOT NULL,
  location TEXT,
  time_text TEXT,
  link TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  UNIQUE(date_iso, title) ON CONFLICT REPLACE
) STRICT;
CREATE INDEX IF NOT EXISTS idx_events_date ON events(date_iso);

-- =========================
-- Posts (Feed)
-- =========================
CREATE TABLE IF NOT EXISTS posts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT
) STRICT;

-- =========================
-- Auth
-- =========================

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL,
  email TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'admin' CHECK (role IN ('admin','editor','viewer')),
  is_active INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  updated_at TEXT
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at TEXT,
  user_agent TEXT,
  ip_addr TEXT
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user_expires ON sessions(user_id, expires_at);

CREATE TABLE IF NOT EXISTS password_resets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (CURRENT_TIMESTAMP),
  expires_at TEXT NOT NULL
) STRICT;
CREATE UNIQUE INDEX IF NOT EXISTS ux_password_resets_token ON password_resets(token);

-- =========================
-- Metrics
-- =========================

CREATE TABLE IF NOT EXISTS metrics_daily (
  day TEXT PRIMARY KEY,
  pageviews INTEGER NOT NULL DEFAULT 0,
  uniques INTEGER NOT NULL DEFAULT 0,
  interactions_count INTEGER NOT NULL DEFAULT 0,
  dwell_ms_sum INTEGER NOT NULL DEFAULT 0,
  interactions_json TEXT CHECK (interactions_json IS NULL OR json_valid(interactions_json))
) WITHOUT ROWID, STRICT;

CREATE TABLE IF NOT EXISTS metrics_uniques (
  day TEXT NOT NULL,
  user_hash TEXT NOT NULL,
  PRIMARY KEY (day, user_hash)
) WITHOUT ROWID, STRICT;

CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY,
  ts_iso TEXT NOT NULL,
  day TEXT GENERATED ALWAYS AS (substr(ts_iso, 1, 10)) VIRTUAL,
  user_hash TEXT,
  action TEXT NOT NULL,
  dwell_ms INTEGER DEFAULT 0 CHECK (dwell_ms >= 0),
  path TEXT,
  referrer TEXT,
  detail_json TEXT CHECK (detail_json IS NULL OR json_valid(detail_json))
) STRICT;
CREATE INDEX IF NOT EXISTS idx_interactions_day ON interactions(day);
CREATE INDEX IF NOT EXISTS idx_interactions_action ON interactions(action);

CREATE TRIGGER IF NOT EXISTS trg_interactions_ins_pageviews
AFTER INSERT ON interactions
WHEN NEW.action='pageview'
BEGIN
  INSERT INTO metrics_daily(day, pageviews) VALUES (NEW.day, 1)
  ON CONFLICT(day) DO UPDATE SET pageviews = pageviews + 1;
END;

CREATE TRIGGER IF NOT EXISTS trg_interactions_ins_counts
AFTER INSERT ON interactions
BEGIN
  INSERT INTO metrics_daily(day, interactions_count, dwell_ms_sum)
  VALUES (NEW.day, 1, COALESCE(NEW.dwell_ms,0))
  ON CONFLICT(day) DO UPDATE SET
    interactions_count = interactions_count + 1,
    dwell_ms_sum = dwell_ms_sum + COALESCE(NEW.dwell_ms,0);
END;

CREATE TRIGGER IF NOT EXISTS trg_interactions_ins_uniques
AFTER INSERT ON interactions
WHEN NEW.user_hash IS NOT NULL
BEGIN
  INSERT OR IGNORE INTO metrics_uniques(day, user_hash)
  VALUES (NEW.day, NEW.user_hash);

  INSERT INTO metrics_daily(day, uniques)
  SELECT NEW.day, 1
  WHERE (SELECT changes()) > 0
  ON CONFLICT(day) DO UPDATE SET uniques = uniques + 1;
END;

-- =========================
-- Timestamp maintenance (SQLite-compatible)
-- =========================

DROP TRIGGER IF EXISTS trg_site_branding_updated;
CREATE TRIGGER trg_site_branding_updated
AFTER UPDATE ON site_branding
FOR EACH ROW
BEGIN
  UPDATE site_branding
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

DROP TRIGGER IF EXISTS trg_nav_links_updated;
CREATE TRIGGER trg_nav_links_updated
AFTER UPDATE ON nav_links
FOR EACH ROW
BEGIN
  UPDATE nav_links
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

DROP TRIGGER IF EXISTS trg_profile_updated;
CREATE TRIGGER trg_profile_updated
AFTER UPDATE ON profile
FOR EACH ROW
BEGIN
  UPDATE profile
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

DROP TRIGGER IF EXISTS trg_social_links_updated;
CREATE TRIGGER trg_social_links_updated
AFTER UPDATE ON social_links
FOR EACH ROW
BEGIN
  UPDATE social_links
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

DROP TRIGGER IF EXISTS trg_events_updated;
CREATE TRIGGER trg_events_updated
AFTER UPDATE ON events
FOR EACH ROW
BEGIN
  UPDATE events
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

DROP TRIGGER IF EXISTS trg_users_touch;
CREATE TRIGGER trg_users_touch
AFTER UPDATE ON users
FOR EACH ROW
BEGIN
  UPDATE users
  SET updated_at = CURRENT_TIMESTAMP
  WHERE id = OLD.id;
END;

-- =========================
-- Views for templating (reduce application logic)
-- =========================

-- Aggregate tokens into a single JSON object for easy hydration
CREATE VIEW IF NOT EXISTS v_site_tokens AS
SELECT json_group_object(key, value) AS tokens_json FROM site_settings;

-- Header nav in render order
CREATE VIEW IF NOT EXISTS v_nav_header AS
SELECT label, href, style, position
FROM nav_links
WHERE area='header'
ORDER BY position;

-- Footer nav in render order
CREATE VIEW IF NOT EXISTS v_nav_footer AS
SELECT label, href, style, position
FROM nav_links
WHERE area='footer'
ORDER BY position;

-- Section order as rows (position, section)
CREATE VIEW IF NOT EXISTS v_sections AS
SELECT position, section
FROM section_order
ORDER BY position;

-- Profile with socials as JSON array (handy for one‑shot template hydration)
CREATE VIEW IF NOT EXISTS v_profile AS
SELECT
  p.id,
  p.name,
  p.bio,
  p.image_url,
  json_group_array(
    json_object(
      'platform', s.platform,
      'label', s.label,
      'url', s.url,
      'style', s.style,
      'position', s.position,
      'custom_icon_url', s.custom_icon_url,
      'use_custom_icon', s.use_custom_icon
    )
  ) FILTER (WHERE s.id IS NOT NULL) AS socials_json
FROM profile p
LEFT JOIN social_links s ON s.profile_id = p.id
GROUP BY p.id;

-- Upcoming events (next 30 days) with ISO date parts
CREATE VIEW IF NOT EXISTS v_events_upcoming AS
SELECT
  e.id,
  e.date_iso,
  substr(e.date_iso, 9, 2) AS day_num,
  upper(substr(e.date_iso, 6, 2)) AS month_num,
  e.title,
  e.location,
  e.time_text,
  e.link
FROM events e
WHERE e.date_iso >= substr(datetime('now','localtime'),1,10)
  AND e.date_iso <= substr(date('now','localtime','+30 day'),1,10)
ORDER BY e.date_iso;

-- Metrics daily with computed average dwell (no need to store)
CREATE VIEW IF NOT EXISTS v_metrics_daily AS
SELECT
  day,
  pageviews,
  uniques,
  interactions_count,
  dwell_ms_sum,
  CASE
    WHEN interactions_count > 0
    THEN CAST(dwell_ms_sum AS REAL) / interactions_count
    ELSE 0
  END AS dwell_ms_avg
FROM metrics_daily;


