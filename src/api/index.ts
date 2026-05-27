import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import type { AppDb } from '../db/index.js';
import { usersRoutes } from './users.js';
import { watchesRoutes } from './watches.js';
import { runsRoutes } from './runs.js';

export interface ApiOptions {
  silent?: boolean;
}

export function createApi(appDb: AppDb, opts?: ApiOptions): Hono {
  const api = new Hono();

  if (!opts?.silent) api.use('*', honoLogger());

  api.route('/users', usersRoutes(appDb));
  api.route('/watches', watchesRoutes(appDb));
  api.route('/runs', runsRoutes(appDb));

  // Health check
  api.get('/health', (c) => c.json({ status: 'ok', watches: appDb.watches.count() }));

  return api;
}
