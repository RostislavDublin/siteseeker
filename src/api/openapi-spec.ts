import type { OpenAPIV3 } from './openapi-types.js'

export const spec: OpenAPIV3 = {
  openapi: '3.1.0',
  info: {
    title: 'SiteSeeker API',
    version: '0.1.0',
    description: 'Campsite availability monitor - REST API for managing users, watches, runs, and system settings.',
  },
  servers: [{ url: 'http://localhost:3000', description: 'Local dev server' }],
  paths: {
    '/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        responses: {
          '200': {
            description: 'Service is healthy',
            content: { 'application/json': { schema: { type: 'object', properties: { status: { type: 'string' }, watches: { type: 'integer' } } } } },
          },
        },
      },
    },
    '/settings': {
      get: {
        tags: ['System'],
        summary: 'Get system settings',
        responses: {
          '200': {
            description: 'Current settings',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Settings' } } },
          },
        },
      },
      patch: {
        tags: ['System'],
        summary: 'Update system settings',
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/SettingsPatch' } } } },
        responses: {
          '200': {
            description: 'Updated settings',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Settings' } } },
          },
        },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'List all users',
        responses: {
          '200': {
            description: 'Array of users',
            content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/User' } } } },
          },
        },
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user',
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/UserCreate' } } } },
        responses: {
          '201': { description: 'Created user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '400': { description: 'Validation error' },
          '409': { description: 'Username already exists' },
        },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'User', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '404': { description: 'Not found' },
        },
      },
      patch: {
        tags: ['Users'],
        summary: 'Update user',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/UserPatch' } } } },
        responses: {
          '200': { description: 'Updated user', content: { 'application/json': { schema: { $ref: '#/components/schemas/User' } } } },
          '404': { description: 'Not found' },
        },
      },
    },
    '/users/{userId}/watches': {
      get: {
        tags: ['Watches'],
        summary: 'List watches for a user',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        responses: {
          '200': { description: 'Array of watches', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/Watch' } } } } },
        },
      },
      post: {
        tags: ['Watches'],
        summary: 'Create a watch',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: { required: true, content: { 'application/json': { schema: { $ref: '#/components/schemas/WatchCreate' } } } },
        responses: {
          '201': { description: 'Created watch', content: { 'application/json': { schema: { $ref: '#/components/schemas/Watch' } } } },
          '400': { description: 'Validation error' },
          '404': { description: 'User not found' },
        },
      },
    },
    '/users/{userId}/watches/{id}': {
      get: {
        tags: ['Watches'],
        summary: 'Get watch by ID',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Watch', content: { 'application/json': { schema: { $ref: '#/components/schemas/Watch' } } } },
          '404': { description: 'Not found or not owned by user' },
        },
      },
      patch: {
        tags: ['Watches'],
        summary: 'Update watch (status, name)',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: { content: { 'application/json': { schema: { $ref: '#/components/schemas/WatchPatch' } } } },
        responses: {
          '200': { description: 'Updated watch', content: { 'application/json': { schema: { $ref: '#/components/schemas/Watch' } } } },
          '404': { description: 'Not found or not owned by user' },
        },
      },
      delete: {
        tags: ['Watches'],
        summary: 'Delete a watch',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '204': { description: 'Deleted' },
          '404': { description: 'Not found or not owned by user' },
        },
      },
    },
    '/users/{userId}/watches/run': {
      post: {
        tags: ['Watches'],
        summary: 'Trigger on-demand watch evaluation',
        description: 'Immediately evaluates specified watches owned by this user. Bypasses system/user scheduling pauses. Refuses fulfilled/expired watches.',
        parameters: [{ name: 'userId', in: 'path', required: true, schema: { type: 'string' } }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/WatchRunRequest' } } },
        },
        responses: {
          '200': { description: 'Run results', content: { 'application/json': { schema: { $ref: '#/components/schemas/WatchRunResponse' } } } },
          '400': { description: 'Invalid request (empty watchIds)' },
          '503': { description: 'Engine not available' },
        },
      },
    },
    '/users/{userId}/watches/{watchId}/runs': {
      get: {
        tags: ['Runs'],
        summary: 'List runs for a watch',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'watchId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Array of runs', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/WatchRun' } } } } },
          '404': { description: 'Watch not found or not owned by user' },
        },
      },
    },
    '/users/{userId}/watches/{watchId}/runs/{runId}/logs': {
      get: {
        tags: ['Runs'],
        summary: 'Get logs for a run',
        parameters: [
          { name: 'userId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'watchId', in: 'path', required: true, schema: { type: 'string' } },
          { name: 'runId', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          '200': { description: 'Array of log entries', content: { 'application/json': { schema: { type: 'array', items: { $ref: '#/components/schemas/RunLog' } } } } },
        },
      },
    },
  },
  components: {
    schemas: {
      Settings: {
        type: 'object',
        properties: {
          schedulingEnabled: { type: 'boolean', description: 'Global scheduling toggle' },
        },
      },
      SettingsPatch: {
        type: 'object',
        properties: {
          schedulingEnabled: { type: 'boolean' },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          username: { type: 'string' },
          email: { type: 'string', nullable: true },
          role: { type: 'string', enum: ['admin', 'user'] },
          schedulingEnabled: { type: 'boolean' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
      UserCreate: {
        type: 'object',
        required: ['username'],
        properties: {
          username: { type: 'string' },
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'user'] },
        },
      },
      UserPatch: {
        type: 'object',
        properties: {
          email: { type: 'string' },
          role: { type: 'string', enum: ['admin', 'user'] },
          schedulingEnabled: { type: 'boolean' },
        },
      },
      Watch: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          name: { type: 'string' },
          status: { type: 'string', enum: ['active', 'paused', 'fulfilled', 'expired'] },
          createdAt: { type: 'string', format: 'date-time' },
          lastCheckedAt: { type: 'string', format: 'date-time', nullable: true },
          target: { type: 'object' },
          dates: { type: 'object' },
          site: { type: 'object' },
          notifications: { type: 'array', items: { type: 'object' } },
        },
      },
      WatchCreate: {
        type: 'object',
        required: ['name', 'target', 'dates'],
        properties: {
          name: { type: 'string' },
          target: { type: 'object', description: 'WatchTarget (facility or geo)' },
          dates: { type: 'object', description: 'WatchDates (earliest, latest, minConsecutiveNights)' },
          site: { type: 'object', description: 'WatchSiteFilters (optional)' },
          notifications: { type: 'array', items: { type: 'object' } },
        },
      },
      WatchPatch: {
        type: 'object',
        properties: {
          status: { type: 'string', enum: ['active', 'paused', 'fulfilled', 'expired'] },
          name: { type: 'string' },
        },
      },
      WatchRunRequest: {
        type: 'object',
        required: ['watchIds'],
        properties: {
          watchIds: { type: 'array', items: { type: 'string' }, description: 'IDs of watches to evaluate immediately' },
        },
      },
      WatchRunResponse: {
        type: 'object',
        properties: {
          results: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                watchId: { type: 'string' },
                status: { type: 'string', enum: ['ok', 'error'] },
                matchesFound: { type: 'integer' },
                error: { type: 'string' },
              },
            },
          },
        },
      },
      WatchRun: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          watchId: { type: 'string' },
          startedAt: { type: 'string', format: 'date-time' },
          finishedAt: { type: 'string', format: 'date-time', nullable: true },
          status: { type: 'string', enum: ['running', 'ok', 'error'] },
          matchesFound: { type: 'integer' },
          errorMessage: { type: 'string', nullable: true },
        },
      },
      RunLog: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          runId: { type: 'string' },
          level: { type: 'string', enum: ['info', 'warn', 'error'] },
          message: { type: 'string' },
          createdAt: { type: 'string', format: 'date-time' },
        },
      },
    },
  },
}
