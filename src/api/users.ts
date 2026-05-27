import { Hono } from 'hono';
import type { AppDb } from '../db/index.js';

export function usersRoutes(appDb: AppDb): Hono {
  const app = new Hono();

  app.get('/', (c) => {
    const users = appDb.users.list();
    return c.json(users);
  });

  app.post('/', async (c) => {
    const body = await c.req.json<{ username: string; email?: string; role?: 'admin' | 'user' }>();
    if (!body.username) {
      return c.json({ error: 'username is required' }, 400);
    }
    const existing = appDb.users.getByUsername(body.username);
    if (existing) {
      return c.json({ error: `user '${body.username}' already exists` }, 409);
    }
    const user = appDb.users.create({
      username: body.username,
      email: body.email,
      role: body.role,
    });
    return c.json(user, 201);
  });

  app.get('/:id', (c) => {
    const user = appDb.users.getById(c.req.param('id'));
    if (!user) return c.json({ error: 'not found' }, 404);
    return c.json(user);
  });

  return app;
}
