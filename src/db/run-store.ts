import { randomUUID } from 'node:crypto';
import type Database from 'better-sqlite3';

export type RunStatus = 'running' | 'ok' | 'error';

export interface WatchRun {
  id: string;
  watchId: string;
  startedAt: Date;
  finishedAt?: Date;
  status: RunStatus;
  matchesFound: number;
  errorMessage?: string;
}

interface RunRow {
  id: string;
  watch_id: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  matches_found: number;
  error_message: string | null;
}

export class RunStore {
  constructor(private db: Database.Database) {}

  startRun(watchId: string): WatchRun {
    const run: WatchRun = {
      id: randomUUID(),
      watchId,
      startedAt: new Date(),
      status: 'running',
      matchesFound: 0,
    };
    this.db.prepare(`
      INSERT INTO watch_runs (id, watch_id, started_at, status, matches_found)
      VALUES (?, ?, ?, ?, ?)
    `).run(run.id, run.watchId, run.startedAt.toISOString(), run.status, run.matchesFound);
    return run;
  }

  finishRun(runId: string, status: RunStatus, matchesFound: number, errorMessage?: string): void {
    this.db.prepare(`
      UPDATE watch_runs
      SET finished_at = ?, status = ?, matches_found = ?, error_message = ?
      WHERE id = ?
    `).run(new Date().toISOString(), status, matchesFound, errorMessage ?? null, runId);
  }

  addLog(runId: string, level: 'debug' | 'info' | 'warn' | 'error', message: string): void {
    this.db.prepare(`
      INSERT INTO watch_run_logs (run_id, level, message, created_at)
      VALUES (?, ?, ?, ?)
    `).run(runId, level, message, new Date().toISOString());
  }

  getRunsForWatch(watchId: string, limit = 50): WatchRun[] {
    const rows = this.db.prepare(
      'SELECT * FROM watch_runs WHERE watch_id = ? ORDER BY started_at DESC LIMIT ?'
    ).all(watchId, limit) as RunRow[];
    return rows.map(r => this.rowToRun(r));
  }

  getLogsForRun(runId: string): { level: string; message: string; createdAt: Date }[] {
    const rows = this.db.prepare(
      'SELECT level, message, created_at FROM watch_run_logs WHERE run_id = ? ORDER BY id'
    ).all(runId) as { level: string; message: string; created_at: string }[];
    return rows.map(r => ({ level: r.level, message: r.message, createdAt: new Date(r.created_at) }));
  }

  private rowToRun(row: RunRow): WatchRun {
    return {
      id: row.id,
      watchId: row.watch_id,
      startedAt: new Date(row.started_at),
      finishedAt: row.finished_at ? new Date(row.finished_at) : undefined,
      status: row.status as RunStatus,
      matchesFound: row.matches_found,
      errorMessage: row.error_message ?? undefined,
    };
  }
}
