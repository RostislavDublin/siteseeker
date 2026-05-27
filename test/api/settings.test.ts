import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp, request, type TestContext } from '../helpers/setup.js'

describe('Settings API', () => {
  let ctx: TestContext
  let r: ReturnType<typeof request>

  beforeEach(() => {
    ctx = createTestApp()
    r = request(ctx.app)
  })

  it('GET /settings returns default scheduling enabled', async () => {
    const res = await r.get('/settings')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.schedulingEnabled).toBe(true)
  })

  it('PATCH /settings disables scheduling', async () => {
    const res = await r.patch('/settings', { schedulingEnabled: false })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.schedulingEnabled).toBe(false)
  })

  it('PATCH /settings re-enables scheduling', async () => {
    await r.patch('/settings', { schedulingEnabled: false })
    const res = await r.patch('/settings', { schedulingEnabled: true })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.schedulingEnabled).toBe(true)
  })

  it('GET /settings reflects persisted state', async () => {
    await r.patch('/settings', { schedulingEnabled: false })
    const res = await r.get('/settings')
    const body = await res.json()
    expect(body.schedulingEnabled).toBe(false)
  })
})
