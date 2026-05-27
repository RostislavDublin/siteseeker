import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user';
  schedulingEnabled: boolean;
  createdAt: Date;
}

interface UserRow {
  id: string;
  username: string;
  email: string | null;
  role: string;
  scheduling_enabled: number;
  created_at: string;
}

export class UserStore {
  constructor(private db: Database.Database) {}

  ensureSystemUser(): User {
    const existing = this.getByUsername('system');
    if (existing) return existing;
    return this.create({ username: 'system', role: 'admin' });
  }

  create(opts: { username: string; email?: string; role?: 'admin' | 'user' }): User {
    const user: User = {
      id: randomUUID(),
      username: opts.username,
      email: opts.email,
      role: opts.role ?? 'user',
      schedulingEnabled: true,
      createdAt: new Date(),
    };
    this.db.prepare(`
      INSERT INTO users (id, username, email, role, scheduling_enabled, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(user.id, user.username, user.email ?? null, user.role, 1, user.createdAt.toISOString());
    return user;
  }

  update(id: string, fields: { email?: string; role?: 'admin' | 'user'; schedulingEnabled?: boolean }): User | null {
    const user = this.getById(id);
    if (!user) return null;
    if (fields.email !== undefined) user.email = fields.email;
    if (fields.role !== undefined) user.role = fields.role;
    if (fields.schedulingEnabled !== undefined) user.schedulingEnabled = fields.schedulingEnabled;
    this.db.prepare(`
      UPDATE users SET email = ?, role = ?, scheduling_enabled = ? WHERE id = ?
    `).run(user.email ?? null, user.role, user.schedulingEnabled ? 1 : 0, id);
    return user;
  }

  getByUsername(username: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE username = ?').get(username) as UserRow | undefined;
    return row ? this.rowToUser(row) : null;
  }

  getById(id: string): User | null {
    const row = this.db.prepare('SELECT * FROM users WHERE id = ?').get(id) as UserRow | undefined;
    return row ? this.rowToUser(row) : null;
  }

  list(): User[] {
    const rows = this.db.prepare('SELECT * FROM users ORDER BY created_at').all() as UserRow[];
    return rows.map(r => this.rowToUser(r));
  }

  private rowToUser(row: UserRow): User {
    return {
      id: row.id,
      username: row.username,
      email: row.email ?? undefined,
      role: row.role as 'admin' | 'user',
      schedulingEnabled: row.scheduling_enabled === 1,
      createdAt: new Date(row.created_at),
    };
  }
}
