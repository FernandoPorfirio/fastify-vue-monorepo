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

describe('GET /tenant/:id and GET /tenant', () => {
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

  describe('GET /tenant/:id', () => {
    it('should get tenant by id successfully', async () => {
      // Arrange
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

      // Act
      const response = await app.inject({
        method: 'GET',
        url: `/tenant/${tenant.id}`,
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      // Assert
      expect(response.statusCode).toBe(200)

      const body = JSON.parse(response.body)
      expect(body.id).toBe(tenant.id)
      expect(body.name).toBe(tenant.name)
    })

    it('should return 401 without authentication', async () => {
      const tenant = await insertTenant()
      createdIds.tenants.push(tenant.id)

      const response = await app.inject({
        method: 'GET',
        url: `/tenant/${tenant.id}`,
      })

      expect(response.statusCode).toBe(401)
    })
  })

  describe('GET /tenant', () => {
    it('should list tenants successfully', async () => {
      // Arrange
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

      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/tenant',
        headers: {
          authorization: `Bearer ${token}`,
        },
      })

      // Assert
      expect(response.statusCode).toBe(200)

      const body = JSON.parse(response.body)
      expect(Array.isArray(body)).toBe(true)
      expect(body.length).toBeGreaterThan(0)
    })

    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/tenant',
      })

      expect(response.statusCode).toBe(401)
    })
  })
})
