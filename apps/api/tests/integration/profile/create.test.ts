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
  cleanupTenants
} from '@tests/helpers'

describe('POST /profile', () => {
  let app: FastifyInstance
  const createdIds = {
    tenants: [] as number[],
    users: [] as number[],
    profiles: [] as number[]
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
  
  it('should create profile successfully', async () => {
    // Arrange
    const tenant = await insertTenant()
    createdIds.tenants.push(tenant.id)
    
    const user = await insertUserWithTenant(tenant.id, {
      password: 'password123'
    })
    createdIds.users.push(user.id)
    
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: user.email,
        password: 'password123'
      }
    })
    
    const { token } = JSON.parse(loginResponse.body)
    
    // Gerar nome único com timestamp
    const uniqueId = Date.now()
    const profileName = `Manager ${uniqueId}`
    
    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/profile',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {
        name: profileName,
        description: 'Manager profile'
      }
    })
    
    // Assert
    expect(response.statusCode).toBe(201)
    
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('id')
    expect(body.name).toBe(profileName)
    expect(body.description).toBe('Manager profile')
    
    createdIds.profiles.push(body.id)
  })
  
  it('should return 401 without authentication', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/profile',
      payload: {
        name: 'Manager'
      }
    })
    
    expect(response.statusCode).toBe(401)
  })
  
  it('should return 400 with missing name', async () => {
    const tenant = await insertTenant()
    createdIds.tenants.push(tenant.id)
    
    const user = await insertUserWithTenant(tenant.id, {
      password: 'password123'
    })
    createdIds.users.push(user.id)
    
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: user.email,
        password: 'password123'
      }
    })
    
    const { token } = JSON.parse(loginResponse.body)
    
    const response = await app.inject({
      method: 'POST',
      url: '/profile',
      headers: {
        authorization: `Bearer ${token}`
      },
      payload: {}
    })
    
    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Validation Error')
  })
})
