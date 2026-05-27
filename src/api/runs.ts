import { Hono } from 'hono';
import type { AppDb } from '../db/index.js';

export function runsRoutes(appDb: AppDb): Hono {
  const app = new Hono();

  // List runs for a watch
  app.get('/', (c) => {
    const watchId = c.req.query('watch_id');
    if (!watchId) return c.json({ error: 'watch_id query param required' }, 400);
    const runs = appDb.runs.getRunsForWatch(watchId);
    return c.json(runs);
  });

  // Get logs for a specific run
  app.get('/:id/logs', (c) => {
    const logs = appDb.runs.getLogsForRun(c.req.param('id'));
    return c.json(logs);
  });

  return app;
}
