import { describe, it, expect, beforeEach } from 'vitest'
import { createTestApp, request, type TestContext } from '../helpers/setup.js'

describe('GET /health', () => {
  let ctx: TestContext

  beforeEach(() => {
    ctx = createTestApp()
  })

  it('returns ok status and watch count', async () => {
    const res = await request(ctx.app).get('/health')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.status).toBe('ok')
    expect(body.watches).toBe(0)
  })
})

describe('users API', () => {
  let ctx: TestContext

  beforeEach(() => {
    ctx = createTestApp()
  })

  describe('POST /users', () => {
    it('creates a user with username', async () => {
      const res = await request(ctx.app).post('/users', { username: 'alice' })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.username).toBe('alice')
      expect(body.id).toBeDefined()
      expect(body.role).toBe('user')
    })

    it('creates a user with email and role', async () => {
      const res = await request(ctx.app).post('/users', {
        username: 'bob',
        email: 'bob@example.com',
        role: 'admin',
      })
      expect(res.status).toBe(201)
      const body = await res.json()
      expect(body.email).toBe('bob@example.com')
      expect(body.role).toBe('admin')
    })

    it('rejects empty username', async () => {
      const res = await request(ctx.app).post('/users', { username: '' })
      expect(res.status).toBe(400)
    })

    it('rejects missing username', async () => {
      const res = await request(ctx.app).post('/users', { email: 'x@y.com' })
      expect(res.status).toBe(400)
    })

    it('rejects duplicate username', async () => {
      await request(ctx.app).post('/users', { username: 'alice' })
      const res = await request(ctx.app).post('/users', { username: 'alice' })
      expect(res.status).toBe(409)
    })
  })

  describe('GET /users', () => {
    it('returns empty list initially', async () => {
      const res = await request(ctx.app).get('/users')
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body).toEqual([])
    })

    it('returns created users', async () => {
      await request(ctx.app).post('/users', { username: 'alice' })
      await request(ctx.app).post('/users', { username: 'bob' })
      const res = await request(ctx.app).get('/users')
      const body = await res.json()
      expect(body).toHaveLength(2)
    })
  })

  describe('GET /users/:id', () => {
    it('returns user by id', async () => {
      const createRes = await request(ctx.app).post('/users', { username: 'alice' })
      const user = await createRes.json()
      const res = await request(ctx.app).get(`/users/${user.id}`)
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.username).toBe('alice')
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(ctx.app).get('/users/nonexistent')
      expect(res.status).toBe(404)
    })
  })

  describe('PATCH /users/:id', () => {
    it('updates user email', async () => {
      const createRes = await request(ctx.app).post('/users', { username: 'alice' })
      const user = await createRes.json()
      const res = await request(ctx.app).patch(`/users/${user.id}`, { email: 'alice@example.com' })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.email).toBe('alice@example.com')
    })

    it('disables user scheduling', async () => {
      const createRes = await request(ctx.app).post('/users', { username: 'alice' })
      const user = await createRes.json()
      expect(user.schedulingEnabled).toBe(true)

      const res = await request(ctx.app).patch(`/users/${user.id}`, { schedulingEnabled: false })
      expect(res.status).toBe(200)
      const body = await res.json()
      expect(body.schedulingEnabled).toBe(false)
    })

    it('re-enables user scheduling', async () => {
      const createRes = await request(ctx.app).post('/users', { username: 'alice' })
      const user = await createRes.json()
      await request(ctx.app).patch(`/users/${user.id}`, { schedulingEnabled: false })
      const res = await request(ctx.app).patch(`/users/${user.id}`, { schedulingEnabled: true })
      const body = await res.json()
      expect(body.schedulingEnabled).toBe(true)
    })

    it('returns 404 for unknown id', async () => {
      const res = await request(ctx.app).patch('/users/nonexistent', { email: 'x@y.com' })
      expect(res.status).toBe(404)
    })
  })
})
