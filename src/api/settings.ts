import { Hono } from 'hono'
import type { AppDb } from '../db/index.js'

export function settingsRoutes(appDb: AppDb): Hono {
  const app = new Hono()

  app.get('/', (c) => {
    return c.json({
      schedulingEnabled: appDb.settings.isSchedulingEnabled(),
    })
  })

  app.patch('/', async (c) => {
    const body = await c.req.json<{ schedulingEnabled?: boolean }>()
    if (body.schedulingEnabled !== undefined) {
      appDb.settings.setSchedulingEnabled(body.schedulingEnabled)
    }
    return c.json({
      schedulingEnabled: appDb.settings.isSchedulingEnabled(),
    })
  })

  return app
}
