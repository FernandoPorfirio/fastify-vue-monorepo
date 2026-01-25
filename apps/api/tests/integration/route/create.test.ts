import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import {
  createTestApp,
  closeTestApp,
  insertTenant,
  insertUserWithTenant,
  deleteRecords,
  cleanupUsers,
  cleanupTenants,
} from '@tests/helpers'

describe('POST /route', () => {
  let app: FastifyInstance
  const createdIds = {
    tenants: [] as number[],
    users: [] as number[],
    routes: [] as number[],
  }

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  afterEach(async () => {
    await deleteRecords('routes', createdIds.routes)
    await cleanupUsers(createdIds.users)
    await cleanupTenants(createdIds.tenants)
    createdIds.routes = []
    createdIds.users = []
    createdIds.tenants = []
  })

  it('should create route successfully', async () => {
    const tenant = await insertTenant()
    createdIds.tenants.push(tenant.id)

    const user = await insertUserWithTenant(tenant.id, {
      password: 'password123',
    })
    createdIds.users.push(user.id)

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: user.email,
        password: 'password123',
      },
    })

    const { token } = JSON.parse(loginResponse.body)

    const uniqueId = Date.now()
    const routeName = `Users List ${uniqueId}`
    const routePath = `/api/users/${uniqueId}`

    const response = await app.inject({
      method: 'POST',
      url: '/route',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: routeName,
        path: routePath,
        type: 'api',
        method: 'GET',
        description: 'List all users',
      },
    })

    expect(response.statusCode).toBe(201)

    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('id')
    expect(body.name).toBe(routeName)
    expect(body.path).toBe(routePath)
    expect(body.type).toBe('api')
    expect(body.method).toBe('GET')

    createdIds.routes.push(body.id)
  })

  it('should return 401 without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/route',
      payload: {
        name: 'Test Route',
        path: '/test',
        type: 'api',
      },
    })

    expect(response.statusCode).toBe(401)
  })

  it('should return 400 with invalid type', async () => {
    const tenant = await insertTenant()
    createdIds.tenants.push(tenant.id)

    const user = await insertUserWithTenant(tenant.id, {
      password: 'password123',
    })
    createdIds.users.push(user.id)

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: user.email,
        password: 'password123',
      },
    })

    const { token } = JSON.parse(loginResponse.body)

    const response = await app.inject({
      method: 'POST',
      url: '/route',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: 'Test Route',
        path: '/test',
        type: 'invalid-type',
      },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Validation Error')
  })
})
