import type Database from 'better-sqlite3';
import type { Watch } from '../domain/types.js';

interface WatchRow {
  id: string;
  user_id: string;
  name: string;
  status: string;
  config_json: string;
  created_at: string;
  last_checked_at: string | null;
}

export class WatchStore {
  constructor(private db: Database.Database) {}

  getById(id: string): Watch | null {
    const row = this.db.prepare('SELECT * FROM watches WHERE id = ?').get(id) as WatchRow | undefined
    return row ? this.rowToWatch(row) : null
  }

  getUserId(watchId: string): string | null {
    const row = this.db.prepare('SELECT user_id FROM watches WHERE id = ?').get(watchId) as { user_id: string } | undefined
    return row?.user_id ?? null
  }

  upsert(watch: Watch, userId: string): void {
    const configJson = JSON.stringify({
      target: watch.target,
      dates: watch.dates,
      site: watch.site,
      notifications: watch.notifications,
    });
    this.db.prepare(`
      INSERT INTO watches (id, user_id, name, status, config_json, created_at, last_checked_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        name            = excluded.name,
        status          = excluded.status,
        config_json     = excluded.config_json,
        last_checked_at = excluded.last_checked_at
    `).run(
      watch.id,
      userId,
      watch.name,
      watch.status,
      configJson,
      watch.createdAt.toISOString(),
      watch.lastCheckedAt?.toISOString() ?? null,
    );
  }

  getAll(userId?: string): Watch[] {
    const rows = userId
      ? this.db.prepare('SELECT * FROM watches WHERE user_id = ? ORDER BY created_at').all(userId) as WatchRow[]
      : this.db.prepare('SELECT * FROM watches ORDER BY created_at').all() as WatchRow[];
    return rows.map(r => this.rowToWatch(r));
  }

  getActive(userId?: string): Watch[] {
    const rows = userId
      ? this.db.prepare("SELECT * FROM watches WHERE user_id = ? AND status = 'active' ORDER BY created_at").all(userId) as WatchRow[]
      : this.db.prepare("SELECT * FROM watches WHERE status = 'active' ORDER BY created_at").all() as WatchRow[];
    return rows.map(r => this.rowToWatch(r));
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) as n FROM watches').get() as { n: number };
    return row.n;
  }

  updateLastChecked(watchId: string, at: Date): void {
    this.db.prepare('UPDATE watches SET last_checked_at = ? WHERE id = ?')
      .run(at.toISOString(), watchId);
  }

  private rowToWatch(row: WatchRow): Watch {
    const config = JSON.parse(row.config_json);
    return {
      id: row.id,
      name: row.name,
      status: row.status as Watch['status'],
      createdAt: new Date(row.created_at),
      lastCheckedAt: row.last_checked_at ? new Date(row.last_checked_at) : undefined,
      target: config.target,
      dates: config.dates,
      site: config.site,
      notifications: config.notifications,
    };
  }
}
