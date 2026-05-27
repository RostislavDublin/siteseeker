import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';

export interface User {
  id: string;
  username: string;
  email?: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

interface UserRow {
  id: string;
  username: string;
  email: string | null;
  role: string;
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
      createdAt: new Date(),
    };
    this.db.prepare(`
      INSERT INTO users (id, username, email, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(user.id, user.username, user.email ?? null, user.role, user.createdAt.toISOString());
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
      createdAt: new Date(row.created_at),
    };
  }
}
