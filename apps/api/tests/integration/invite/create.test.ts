import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import {
  createTestApp,
  closeTestApp,
  insertTenant,
  insertUserWithTenant,
  insertProfile,
  deleteRecords,
  cleanupUsers,
  cleanupTenants,
} from '@tests/helpers'

describe('POST /invite', () => {
  let app: FastifyInstance
  const createdIds = {
    tenants: [] as number[],
    users: [] as number[],
    profiles: [] as number[],
  }

  beforeAll(async () => {
    app = await createTestApp()
  })

  afterAll(async () => {
    await closeTestApp(app)
  })

  afterEach(async () => {
    await deleteRecords('profiles', createdIds.profiles)
    await cleanupUsers(createdIds.users)
    await cleanupTenants(createdIds.tenants)
    createdIds.profiles = []
    createdIds.users = []
    createdIds.tenants = []
  })

  it('should create invite successfully', async () => {
    // Arrange
    const tenant = await insertTenant()
    createdIds.tenants.push(tenant.id)

    const profile = await insertProfile(tenant.id)
    createdIds.profiles.push(profile.id)

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

    // Gerar email único com timestamp
    const uniqueId = Date.now()
    const inviteEmail = `newuser-${uniqueId}@example.com`

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/invite',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        email: inviteEmail,
        profileId: profile.id,
      },
    })

    // Assert
    expect(response.statusCode).toBe(201)

    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('message')
    expect(body).toHaveProperty('expiresAt')
  })

  it('should return 401 without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/invite',
      payload: {
        email: 'newuser@example.com',
        profileId: 1,
      },
    })

    expect(response.statusCode).toBe(401)
  })

  it('should return 400 with invalid email', async () => {
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
      url: '/invite',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        email: 'invalid-email',
        profileId: 1,
      },
    })

    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Validation Error')
  })
})
