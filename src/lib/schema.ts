export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS cities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE
);
CREATE TABLE IF NOT EXISTS sports (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  phone TEXT NOT NULL UNIQUE,
  name TEXT,
  email TEXT,
  city_id INTEGER REFERENCES cities(id),
  role TEXT NOT NULL DEFAULT 'player',      -- player | partner | admin
  karma INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT UNIQUE,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS otps (
  phone TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS venues (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  city_id INTEGER NOT NULL REFERENCES cities(id),
  area TEXT NOT NULL,
  address TEXT NOT NULL,
  lat REAL, lng REAL,
  description TEXT NOT NULL DEFAULT '',
  amenities TEXT NOT NULL DEFAULT '[]',     -- JSON array of strings
  open_hour INTEGER NOT NULL DEFAULT 6,
  close_hour INTEGER NOT NULL DEFAULT 23,
  rating REAL NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  free_cancel_hours INTEGER NOT NULL DEFAULT 24,
  cancel_fee_pct INTEGER NOT NULL DEFAULT 10,
  owner_user_id INTEGER REFERENCES users(id),
  theme TEXT NOT NULL DEFAULT 'emerald',
  is_active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS venue_sports (
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  sport_id INTEGER NOT NULL REFERENCES sports(id),
  PRIMARY KEY (venue_id, sport_id)
);
CREATE TABLE IF NOT EXISTS courts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  sport_id INTEGER NOT NULL REFERENCES sports(id),
  name TEXT NOT NULL,
  is_active INTEGER NOT NULL DEFAULT 1
);
CREATE TABLE IF NOT EXISTS pricing_rules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  day_type TEXT NOT NULL,                  -- weekday | weekend
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  price INTEGER NOT NULL                   -- INR per hour
);
CREATE TABLE IF NOT EXISTS blocked_slots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  court_id INTEGER NOT NULL REFERENCES courts(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Blocked by venue'
);
CREATE TABLE IF NOT EXISTS bookings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  venue_id INTEGER NOT NULL REFERENCES venues(id),
  court_id INTEGER NOT NULL REFERENCES courts(id),
  sport_id INTEGER NOT NULL REFERENCES sports(id),
  date TEXT NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  base_amount INTEGER NOT NULL,
  convenience_fee INTEGER NOT NULL,
  karma_redeemed INTEGER NOT NULL DEFAULT 0,
  total_amount INTEGER NOT NULL,
  payment_method TEXT NOT NULL DEFAULT 'upi',
  status TEXT NOT NULL DEFAULT 'confirmed', -- confirmed | cancelled
  refund_amount INTEGER,
  cancelled_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_bookings_court_date ON bookings(court_id, date);
CREATE INDEX IF NOT EXISTS idx_bookings_user ON bookings(user_id);
CREATE TABLE IF NOT EXISTS games (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  host_user_id INTEGER NOT NULL REFERENCES users(id),
  sport_id INTEGER NOT NULL REFERENCES sports(id),
  city_id INTEGER NOT NULL REFERENCES cities(id),
  venue_id INTEGER REFERENCES venues(id),
  location_text TEXT NOT NULL,
  date TEXT NOT NULL,
  start_hour INTEGER NOT NULL,
  end_hour INTEGER NOT NULL,
  max_players INTEGER NOT NULL,
  price_per_player INTEGER NOT NULL DEFAULT 0,
  skill_level TEXT NOT NULL DEFAULT 'any', -- any | beginner | intermediate | advanced
  description TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'open',      -- open | full | cancelled | completed
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS game_players (
  game_id INTEGER NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'requested', -- requested | accepted | rejected | left
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (game_id, user_id)
);
CREATE TABLE IF NOT EXISTS karma_ledger (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id),
  delta INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS user_skills (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  sport_id INTEGER NOT NULL REFERENCES sports(id),
  level TEXT NOT NULL,
  PRIMARY KEY (user_id, sport_id)
);
CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  venue_id INTEGER NOT NULL REFERENCES venues(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  comment TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE TABLE IF NOT EXISTS coaches (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  sport_id INTEGER NOT NULL REFERENCES sports(id),
  city_id INTEGER NOT NULL REFERENCES cities(id),
  area TEXT NOT NULL,
  experience_years INTEGER NOT NULL,
  price_per_session INTEGER NOT NULL,
  rating REAL NOT NULL DEFAULT 4.5,
  bio TEXT NOT NULL DEFAULT ''
);
CREATE TABLE IF NOT EXISTS enquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  coach_id INTEGER NOT NULL REFERENCES coaches(id),
  user_id INTEGER NOT NULL REFERENCES users(id),
  message TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);
`;
