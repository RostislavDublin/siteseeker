import Database from 'better-sqlite3';
import { migrateAll } from './schema.js';
import { UserStore } from './user-store.js';
import { WatchStore } from './watch-store.js';
import { RunStore } from './run-store.js';

export { UserStore } from './user-store.js';
export { WatchStore } from './watch-store.js';
export { RunStore } from './run-store.js';
export type { User } from './user-store.js';
export type { WatchRun, RunStatus } from './run-store.js';

export interface AppDb {
  db: Database.Database;
  users: UserStore;
  watches: WatchStore;
  runs: RunStore;
}

export function openDatabase(path: string): AppDb {
  const db = new Database(path);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  migrateAll(db);
  return {
    db,
    users: new UserStore(db),
    watches: new WatchStore(db),
    runs: new RunStore(db),
  };
}
