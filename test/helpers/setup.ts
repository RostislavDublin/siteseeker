import { Hono } from 'hono'
import { openDatabase } from '../../src/db/index.js'
import { createApi } from '../../src/api/index.js'
import type { AppDb } from '../../src/db/index.js'

export interface TestContext {
  app: Hono
  db: AppDb
}

/**
 * Create a fresh in-memory database and Hono app for testing.
 * Each call returns an isolated instance - no cross-test contamination.
 */
export function createTestApp(): TestContext {
  const db = openDatabase(':memory:')
  const app = createApi(db, { silent: true })
  return { app, db }
}

/**
 * Helper to make requests against the test app.
 */
export function request(app: Hono) {
  const base = 'http://localhost'
  return {
    get: (path: string) => app.request(`${base}${path}`),
    post: (path: string, body: unknown) =>
      app.request(`${base}${path}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    patch: (path: string, body: unknown) =>
      app.request(`${base}${path}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      }),
    delete: (path: string) =>
      app.request(`${base}${path}`, { method: 'DELETE' }),
  }
}
