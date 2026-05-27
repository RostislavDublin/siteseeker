import type Database from 'better-sqlite3'

export class SettingsStore {
  constructor(private db: Database.Database) {}

  get(key: string): string | null {
    const row = this.db.prepare('SELECT value FROM settings WHERE key = ?').get(key) as { value: string } | undefined
    return row?.value ?? null
  }

  set(key: string, value: string): void {
    this.db.prepare(`
      INSERT INTO settings (key, value) VALUES (?, ?)
      ON CONFLICT(key) DO UPDATE SET value = excluded.value
    `).run(key, value)
  }

  isSchedulingEnabled(): boolean {
    return this.get('scheduling_enabled') !== '0'
  }

  setSchedulingEnabled(enabled: boolean): void {
    this.set('scheduling_enabled', enabled ? '1' : '0')
  }
}
