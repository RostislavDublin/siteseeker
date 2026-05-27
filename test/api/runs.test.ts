import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp, request, type TestContext } from '../helpers/setup.js'

describe('runs API', () => {
  let ctx: TestContext
  let userId: string
  let watchId: string
  let r: ReturnType<typeof request>

  beforeEach(async () => {
    ctx = createTestApp()
    r = request(ctx.app)
    const userRes = await r.post('/users', { username: 'testuser' })
    const user = await userRes.json()
    userId = user.id
    const watchRes = await r.post(`/users/${userId}/watches`, {
      name: 'Test Watch',
      target: { source: 'recreation_gov', facility_id: '232450' },
      dates: { start: '2026-07-01', end: '2026-07-05' },
    })
    const watch = await watchRes.json()
    watchId = watch.id
  })

  const runsUrl = () => `/users/${userId}/watches/${watchId}/runs`

  describe('GET /users/:userId/watches/:watchId/runs', () => {
    it('returns empty list when no runs exist', async () => {
      const res = await r.get(runsUrl())
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual([])
    })

    it('returns runs for a watch', async () => {
      const run = ctx.db.runs.startRun(watchId)
      ctx.db.runs.finishRun(run.id, 'ok', 2)

      const res = await r.get(runsUrl())
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveLength(1)
      expect(body[0].status).toBe('ok')
      expect(body[0].matches_found ?? body[0].matchesFound).toBe(2)
    })

    it('returns 404 for watch owned by another user', async () => {
      const user2Res = await r.post('/users', { username: 'other' })
      const user2 = await user2Res.json()
      const res = await r.get(`/users/${user2.id}/watches/${watchId}/runs`)
      expect(res.status).toBe(404)
    })
  })

  describe('GET /users/:userId/watches/:watchId/runs/:runId/logs', () => {
    it('returns empty logs for new run', async () => {
      const run = ctx.db.runs.startRun(watchId)
      const res = await r.get(`${runsUrl()}/${run.id}/logs`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual([])
    })

    it('returns logs with level and message', async () => {
      const run = ctx.db.runs.startRun(watchId)
      ctx.db.runs.addLog(run.id, 'info', 'Checking availability')
      ctx.db.runs.addLog(run.id, 'info', 'Found 2 matches')

      const res = await r.get(`${runsUrl()}/${run.id}/logs`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toHaveLength(2)
      expect(body[0].level).toBe('info')
      expect(body[0].message).toBe('Checking availability')
    })
  })
})
