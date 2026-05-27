import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp, request, type TestContext } from '../helpers/setup.js'

describe('watches API', () => {
  let ctx: TestContext
  let userId: string

  beforeEach(async () => {
    ctx = createTestApp()
    const res = await request(ctx.app).post('/users', { username: 'testuser' })
    const user = await res.json()
    userId = user.id
  })

  const validWatch = () => ({
    user_id: userId,
    name: 'Moraine Park',
    target: { source: 'recreation_gov', facility_id: '232450' },
    dates: { start: '2026-07-01', end: '2026-07-05' },
  })

  describe('POST /watches', () => {
    it('creates a watch', async () => {
      const res = await request(ctx.app).post('/watches', validWatch())
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.name).toBe('Moraine Park')
      expect(body.status).toBe('active')
      expect(body.id).toBeDefined()
    })

    it('rejects missing required fields', async () => {
      const res = await request(ctx.app).post('/watches', { user_id: userId })
      expect(res.status).toBe(400)
    })

    it('rejects unknown user_id', async () => {
      const res = await request(ctx.app).post('/watches', {
        ...validWatch(),
        user_id: 'nonexistent',
      })
      expect(res.status).toBe(404)
    })
  })

  describe('GET /watches', () => {
    it('returns empty list initially', async () => {
      const res = await request(ctx.app).get('/watches')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual([])
    })

    it('returns created watches', async () => {
      await request(ctx.app).post('/watches', validWatch())
      const res = await request(ctx.app).get('/watches')
      const body = await res.json()
      expect(body).toHaveLength(1)
    })

    it('filters by user_id', async () => {
      await request(ctx.app).post('/watches', validWatch())
      const res = await request(ctx.app).get(`/watches?user_id=${userId}`)
      const body = await res.json()
      expect(body).toHaveLength(1)

      const res2 = await request(ctx.app).get('/watches?user_id=other')
      const body2 = await res2.json()
      expect(body2).toHaveLength(0)
    })
  })

  describe('GET /watches/:id', () => {
    it('returns watch by id', async () => {
      const createRes = await request(ctx.app).post('/watches', validWatch())
      const watch = await createRes.json()
      const res = await request(ctx.app).get(`/watches/${watch.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.name).toBe('Moraine Park')
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(ctx.app).get('/watches/nonexistent')
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /watches/:id', () => {
    it('updates watch status', async () => {
      const createRes = await request(ctx.app).post('/watches', validWatch())
      const watch = await createRes.json()
      const res = await request(ctx.app).patch(`/watches/${watch.id}`, { status: 'paused' })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.status).toBe('paused')
    })

    it('updates watch name', async () => {
      const createRes = await request(ctx.app).post('/watches', validWatch())
      const watch = await createRes.json()
      const res = await request(ctx.app).patch(`/watches/${watch.id}`, { name: 'New Name' })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.name).toBe('New Name')
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(ctx.app).patch('/watches/nonexistent', { status: 'paused' })
      expect(res.status).toBe(404)
    })
  })

  describe('DELETE /watches/:id', () => {
    it('deletes existing watch', async () => {
      const createRes = await request(ctx.app).post('/watches', validWatch())
      const watch = await createRes.json()
      const res = await request(ctx.app).delete(`/watches/${watch.id}`)
      expect(res.status).toBe(204)

      const getRes = await request(ctx.app).get(`/watches/${watch.id}`)
      expect(getRes.status).toBe(404)
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(ctx.app).delete('/watches/nonexistent')
      expect(res.status).toBe(404)
    })
  })

  describe('POST /watches/run', () => {
    it('returns 503 when engine is not available', async () => {
      const createRes = await request(ctx.app).post('/watches', validWatch())
      const watch = await createRes.json()
      const res = await request(ctx.app).post('/watches/run', { watchIds: [watch.id] })
      expect(res.status).toBe(503)
      const body = await res.json()
      expect(body.error).toBe('engine not available')
    })

    it('returns 503 for any request without engine (even invalid body)', async () => {
      const res = await request(ctx.app).post('/watches/run', { watchIds: [] })
      expect(res.status).toBe(503)
    })
  })
})
