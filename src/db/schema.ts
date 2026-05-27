import type Database from 'better-sqlite3';

export function migrateAll(db: Database.Database): void {
  db.exec(`
    -- Users / RBAC
    CREATE TABLE IF NOT EXISTS users (
      id         TEXT PRIMARY KEY,
      username   TEXT NOT NULL UNIQUE,
      email      TEXT,
      role       TEXT NOT NULL DEFAULT 'user',
      created_at TEXT NOT NULL
    );

    -- Watches (owned by users; seeded from watches.yaml on first run)
    CREATE TABLE IF NOT EXISTS watches (
      id              TEXT PRIMARY KEY,
      user_id         TEXT NOT NULL REFERENCES users(id),
      name            TEXT NOT NULL,
      status          TEXT NOT NULL DEFAULT 'active',
      config_json     TEXT NOT NULL,
      created_at      TEXT NOT NULL,
      last_checked_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_watches_user   ON watches(user_id);
    CREATE INDEX IF NOT EXISTS idx_watches_status ON watches(status);

    -- Watch runs (one row per evaluateWatch() call)
    CREATE TABLE IF NOT EXISTS watch_runs (
      id             TEXT PRIMARY KEY,
      watch_id       TEXT NOT NULL REFERENCES watches(id),
      started_at     TEXT NOT NULL,
      finished_at    TEXT,
      status         TEXT NOT NULL DEFAULT 'running',
      matches_found  INTEGER NOT NULL DEFAULT 0,
      error_message  TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_runs_watch ON watch_runs(watch_id);

    -- Per-run structured log entries
    CREATE TABLE IF NOT EXISTS watch_run_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      run_id     TEXT NOT NULL REFERENCES watch_runs(id),
      level      TEXT NOT NULL,
      message    TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_run_logs_run ON watch_run_logs(run_id);

    -- Facility catalog (previously owned by FacilityRegistry)
    CREATE TABLE IF NOT EXISTS facilities (
      id                  TEXT PRIMARY KEY,
      source_id           TEXT NOT NULL,
      source_facility_id  TEXT NOT NULL,
      name                TEXT NOT NULL,
      lat                 REAL NOT NULL,
      lng                 REAL NOT NULL,
      type                TEXT NOT NULL,
      amenities           TEXT NOT NULL DEFAULT '[]',
      total_sites         INTEGER NOT NULL DEFAULT 0,
      max_vehicle_length  INTEGER NOT NULL DEFAULT 0,
      hookup_types        TEXT NOT NULL DEFAULT '[]',
      region              TEXT NOT NULL DEFAULT '',
      last_synced         TEXT NOT NULL,
      UNIQUE(source_id, source_facility_id)
    );
    CREATE INDEX IF NOT EXISTS idx_facilities_source   ON facilities(source_id);
    CREATE INDEX IF NOT EXISTS idx_facilities_location ON facilities(lat, lng);

    -- Match deduplication store (previously owned by MatchStore)
    CREATE TABLE IF NOT EXISTS matches (
      id               TEXT PRIMARY KEY,
      watch_id         TEXT NOT NULL,
      facility_id      TEXT NOT NULL,
      facility_name    TEXT NOT NULL,
      site_id          TEXT NOT NULL,
      site_name        TEXT NOT NULL,
      available_dates  TEXT NOT NULL,
      price_per_night  REAL NOT NULL DEFAULT 0,
      booking_url      TEXT NOT NULL,
      source           TEXT NOT NULL,
      detected_at      TEXT NOT NULL,
      status           TEXT NOT NULL DEFAULT 'new'
    );
    CREATE INDEX IF NOT EXISTS idx_matches_watch ON matches(watch_id);
    CREATE INDEX IF NOT EXISTS idx_matches_dedup ON matches(watch_id, facility_id, site_id, available_dates);
  `);
}
