import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp, request, type TestContext } from '../helpers/setup.js'

describe('watches API', () => {
  let ctx: TestContext
  let userId: string
  let r: ReturnType<typeof request>

  beforeEach(async () => {
    ctx = createTestApp()
    r = request(ctx.app)
    const res = await r.post('/users', { username: 'testuser' })
    const user = await res.json()
    userId = user.id
  })

  const watchesUrl = () => `/users/${userId}/watches`

  const validWatch = () => ({
    name: 'Moraine Park',
    target: { source: 'recreation_gov', facility_id: '232450' },
    dates: { start: '2026-07-01', end: '2026-07-05' },
  })

  describe('POST /users/:userId/watches', () => {
    it('creates a watch', async () => {
      const res = await r.post(watchesUrl(), validWatch())
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.name).toBe('Moraine Park')
      expect(body.status).toBe('active')
      expect(body.id).toBeDefined()
    })

    it('rejects missing required fields', async () => {
      const res = await r.post(watchesUrl(), {})
      expect(res.status).toBe(400)
    })

    it('rejects unknown user', async () => {
      const res = await r.post('/users/nonexistent/watches', validWatch())
      expect(res.status).toBe(404)
    })
  })

  describe('GET /users/:userId/watches', () => {
    it('returns empty list initially', async () => {
      const res = await r.get(watchesUrl())
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual([])
    })

    it('returns created watches', async () => {
      await r.post(watchesUrl(), validWatch())
      const res = await r.get(watchesUrl())
      const body = await res.json()
      expect(body).toHaveLength(1)
    })

    it('scopes to user', async () => {
      await r.post(watchesUrl(), validWatch())
      // Different user sees nothing
      const user2Res = await r.post('/users', { username: 'other' })
      const user2 = await user2Res.json()
      const res = await r.get(`/users/${user2.id}/watches`)
      const body = await res.json()
      expect(body).toHaveLength(0)
    })
  })

  describe('GET /users/:userId/watches/:id', () => {
    it('returns watch by id', async () => {
      const createRes = await r.post(watchesUrl(), validWatch())
      const watch = await createRes.json()
      const res = await r.get(`${watchesUrl()}/${watch.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.name).toBe('Moraine Park')
    })

    it('returns 404 for unknown id', async () => {
      const res = await r.get(`${watchesUrl()}/nonexistent`)
      expect(res.status).toBe(404)
    })

    it('returns 404 for watch owned by another user', async () => {
      const createRes = await r.post(watchesUrl(), validWatch())
      const watch = await createRes.json()
      const user2Res = await r.post('/users', { username: 'other' })
      const user2 = await user2Res.json()
      const res = await r.get(`/users/${user2.id}/watches/${watch.id}`)
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /users/:userId/watches/:id', () => {
    it('updates watch status', async () => {
      const createRes = await r.post(watchesUrl(), validWatch())
      const watch = await createRes.json()
      const res = await r.patch(`${watchesUrl()}/${watch.id}`, { status: 'paused' })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('paused')
    })

    it('updates watch name', async () => {
      const createRes = await r.post(watchesUrl(), validWatch())
      const watch = await createRes.json()
      const res = await r.patch(`${watchesUrl()}/${watch.id}`, { name: 'New Name' })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.name).toBe('New Name')
    })

    it('returns 404 for unknown id', async () => {
      const res = await r.patch(`${watchesUrl()}/nonexistent`, { status: 'paused' })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /users/:userId/watches/:id', () => {
    it('deletes existing watch', async () => {
      const createRes = await r.post(watchesUrl(), validWatch())
      const watch = await createRes.json()
      const res = await r.delete(`${watchesUrl()}/${watch.id}`)
      expect(res.status).toBe(204)

      const getRes = await r.get(`${watchesUrl()}/${watch.id}`)
      expect(getRes.status).toBe(404)
    })

    it('returns 404 for unknown id', async () => {
      const res = await r.delete(`${watchesUrl()}/nonexistent`)
      expect(res.status).toBe(404)
    })
  })

  describe('POST /users/:userId/watches/run', () => {
    it('returns 503 when engine is not available', async () => {
      const createRes = await r.post(watchesUrl(), validWatch())
      const watch = await createRes.json()
      const res = await r.post(`${watchesUrl()}/run`, { watchIds: [watch.id] })
      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body.error).toBe('engine not available')
    })

    it('returns 503 for any request without engine', async () => {
      const res = await r.post(`${watchesUrl()}/run`, { watchIds: [] })
      expect(res.status).toBe(503)
    })
  })
})
