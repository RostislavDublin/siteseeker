import { Hono } from 'hono';
import { logger as honoLogger } from 'hono/logger';
import { swaggerUI } from '@hono/swagger-ui';
import type { AppDb } from '../db/index.js';
import type { Engine } from '../engine/index.js';
import { usersRoutes } from './users.js';
import { watchesRoutes } from './watches.js';
import { settingsRoutes } from './settings.js';
import { spec } from './openapi-spec.js';

export interface ApiOptions {
  silent?: boolean;
  engine?: Engine;
}

export function createApi(appDb: AppDb, opts?: ApiOptions): Hono {
  const api = new Hono();

  if (!opts?.silent) api.use('*', honoLogger());

  api.route('/users', usersRoutes(appDb));
  api.route('/users/:userId/watches', watchesRoutes(appDb, opts?.engine));
  api.route('/settings', settingsRoutes(appDb));

  // OpenAPI spec + Swagger UI
  api.get('/doc', (c) => c.json(spec));
  api.get('/ui', swaggerUI({ url: '/doc' }));

  // Health check
  api.get('/health', (c) => c.json({ status: 'ok', watches: appDb.watches.count() }));

  return api;
}
