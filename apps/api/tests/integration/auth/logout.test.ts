import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import {
  createTestApp,
  closeTestApp,
  insertTenant,
  insertUserWithTenant,
  cleanupUsers,
  cleanupTenants,
} from '@tests/helpers'

describe('POST /auth/logout', () => {
  let app: FastifyInstance
  const createdIds = {
    tenants: [] as number[],
    users: [] as number[],
  }

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  afterEach(async () => {
    await cleanupUsers(createdIds.users)
    await cleanupTenants(createdIds.tenants)
    createdIds.users = []
    createdIds.tenants = []
  })

  it('should logout successfully with valid token', async () => {
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

    const { token, refreshToken } = JSON.parse(loginResponse.body)

    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        refreshToken,
      },
    })

    expect(response.statusCode).toBe(200)
  })

  it('should return 401 without authentication token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/logout',
      payload: {},
    })

    expect(response.statusCode).toBe(401)
  })
})
