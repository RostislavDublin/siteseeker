import { Hono } from 'hono';
import { randomUUID } from 'node:crypto';
import type { AppDb } from '../db/index.js';
import type { Watch, WatchTarget, WatchDates, WatchSiteFilters, NotificationTarget } from '../domain/types.js';

export function watchesRoutes(appDb: AppDb): Hono {
  const app = new Hono();

  // List watches (optionally filter by user_id query param)
  app.get('/', (c) => {
    const userId = c.req.query('user_id');
    const watches = appDb.watches.getAll(userId || undefined);
    return c.json(watches);
  });

  // Create a watch
  app.post('/', async (c) => {
    const body = await c.req.json<{
      user_id: string;
      name: string;
      target: WatchTarget;
      dates: WatchDates;
      site?: WatchSiteFilters;
      notifications?: NotificationTarget[];
    }>();

    if (!body.user_id || !body.name || !body.target || !body.dates) {
      return c.json({ error: 'user_id, name, target, and dates are required' }, 400);
    }

    const user = appDb.users.getById(body.user_id);
    if (!user) {
      return c.json({ error: `user '${body.user_id}' not found` }, 404);
    }

    const watch: Watch = {
      id: randomUUID(),
      name: body.name,
      status: 'active',
      createdAt: new Date(),
      target: body.target,
      dates: body.dates,
      site: body.site ?? {},
      notifications: body.notifications ?? [],
    };

    appDb.watches.upsert(watch, body.user_id);
    return c.json(watch, 201);
  });

  // Get single watch
  app.get('/:id', (c) => {
    const all = appDb.watches.getAll();
    const watch = all.find(w => w.id === c.req.param('id'));
    if (!watch) return c.json({ error: 'not found' }, 404);
    return c.json(watch);
  });

  // Update watch status (pause/resume/expire)
  app.patch('/:id', async (c) => {
    const body = await c.req.json<{ status?: string; name?: string }>();
    const all = appDb.watches.getAll();
    const watch = all.find(w => w.id === c.req.param('id'));
    if (!watch) return c.json({ error: 'not found' }, 404);

    if (body.status) watch.status = body.status as Watch['status'];
    if (body.name) watch.name = body.name;

    // Re-upsert with updated fields (user_id is in DB, use a placeholder lookup)
    const row = appDb.db.prepare('SELECT user_id FROM watches WHERE id = ?').get(c.req.param('id')) as { user_id: string } | undefined;
    if (row) appDb.watches.upsert(watch, row.user_id);
    return c.json(watch);
  });

  // Delete watch
  app.delete('/:id', (c) => {
    const result = appDb.db.prepare('DELETE FROM watches WHERE id = ?').run(c.req.param('id'));
    if (result.changes === 0) return c.json({ error: 'not found' }, 404);
    return c.body(null, 204);
  });

  return app;
}
