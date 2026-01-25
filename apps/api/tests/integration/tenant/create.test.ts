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

describe('POST /tenant', () => {
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

  it('should create tenant successfully', async () => {
    // Arrange - Criar usuário autenticado
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

    // Gerar valores únicos com timestamp
    const uniqueId = Date.now()
    const tenantName = `New Tenant ${uniqueId}`
    const tenantSlug = `new-tenant-${uniqueId}`

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/tenant',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: tenantName,
        slug: tenantSlug,
        ownerEmail: user.email,
        plan: 'starter',
      },
    })

    // Assert
    expect(response.statusCode).toBe(201)

    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('id')
    expect(body.name).toBe(tenantName)
    expect(body.slug).toBe(tenantSlug)
    expect(body.plan).toBe('starter')

    // Adicionar aos IDs para cleanup
    createdIds.tenants.push(body.id)
  })

  it('should return 401 without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/tenant',
      payload: {
        name: 'New Tenant',
        slug: 'new-tenant',
        ownerEmail: 'owner@example.com',
      },
    })

    expect(response.statusCode).toBe(401)
  })

  it('should return 400 with missing required fields', async () => {
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
      url: '/tenant',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        name: 'Incomplete Tenant',
        // Missing slug and ownerEmail
      },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Validation Error')
  })
})
