import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp, request, type TestContext } from '../helpers/setup.js'

describe('runs API', () => {
  let ctx: TestContext
  let watchId: string

  beforeEach(async () => {
    ctx = createTestApp()
    // Create user and watch for run context
    const userRes = await request(ctx.app).post('/users', { username: 'testuser' })
    const user = await userRes.json()
    const watchRes = await request(ctx.app).post('/watches', {
      user_id: user.id,
      name: 'Test Watch',
      target: { source: 'recreation_gov', facility_id: '232450' },
      dates: { start: '2026-07-01', end: '2026-07-05' },
    })
    const watch = await watchRes.json()
    watchId = watch.id
  })

  describe('GET /runs', () => {
    it('requires watch_id param', async () => {
      const res = await request(ctx.app).get('/runs')
      expect(res.status).toBe(400)
    })

    it('returns empty list when no runs exist', async () => {
      const res = await request(ctx.app).get(`/runs?watch_id=${watchId}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual([])
    })

    it('returns runs for a watch', async () => {
      // Create a run directly via the store
      const run = ctx.db.runs.startRun(watchId)
      ctx.db.runs.finishRun(run.id, 'ok', 2)

      const res = await request(ctx.app).get(`/runs?watch_id=${watchId}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveLength(1)
      expect(body[0].status).toBe('ok')
      expect(body[0].matches_found ?? body[0].matchesFound).toBe(2)
    })
  })

  describe('GET /runs/:id/logs', () => {
    it('returns empty logs for new run', async () => {
      const run = ctx.db.runs.startRun(watchId)
      const res = await request(ctx.app).get(`/runs/${run.id}/logs`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual([])
    })

    it('returns logs with level and message', async () => {
      const run = ctx.db.runs.startRun(watchId)
      ctx.db.runs.addLog(run.id, 'info', 'Checking availability')
      ctx.db.runs.addLog(run.id, 'info', 'Found 2 matches')

      const res = await request(ctx.app).get(`/runs/${run.id}/logs`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveLength(2)
      expect(body[0].level).toBe('info')
      expect(body[0].message).toBe('Checking availability')
    })
  })
})
