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

describe('GET /profile/:id and GET /profile', () => {
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
  
  describe('GET /profile/:id', () => {
    it('should get profile by id successfully', async () => {
      // Arrange
      const tenant = await insertTenant()
      createdIds.tenants.push(tenant.id)
      
      const profile = await insertProfile(tenant.id)
      createdIds.profiles.push(profile.id)
      
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
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: `/profile/${profile.id}`,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      // Assert
      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.body)
      expect(body.id).toBe(profile.id)
      expect(body.name).toBe(profile.name)
    })
    
    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/profile/1'
      })
      
      expect(response.statusCode).toBe(401)
    })
  })
  
  describe('GET /profile', () => {
    it('should list profiles successfully', async () => {
      // Arrange
      const tenant = await insertTenant()
      createdIds.tenants.push(tenant.id)
      
      const profile = await insertProfile(tenant.id)
      createdIds.profiles.push(profile.id)
      
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
      
      // Act
      const response = await app.inject({
        method: 'GET',
        url: '/profile',
        headers: {
          authorization: `Bearer ${token}`
        }
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
        url: '/profile'
      })
      
      expect(response.statusCode).toBe(401)
    })
  })
})
