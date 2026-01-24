import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { 
  createTestApp, 
  closeTestApp,
  insertTenant,
  insertUserWithTenant,
  insertRoute,
  deleteRecords,
  cleanupUsers,
  cleanupTenants
} from '@tests/helpers'

describe('GET /route/:id and GET /route', () => {
  let app: FastifyInstance
  const createdIds = {
    tenants: [] as number[],
    users: [] as number[],
    routes: [] as number[]
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
  
  describe('GET /route/:id', () => {
    it('should get route by id successfully', async () => {
      // Arrange
      const tenant = await insertTenant()
      createdIds.tenants.push(tenant.id)
      
      const route = await insertRoute(tenant.id)
      createdIds.routes.push(route.id)
      
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
        url: `/route/${route.id}`,
        headers: {
          authorization: `Bearer ${token}`
        }
      })
      
      // Assert
      expect(response.statusCode).toBe(200)
      
      const body = JSON.parse(response.body)
      expect(body.id).toBe(route.id)
      expect(body.name).toBe(route.name)
      expect(body.path).toBe(route.path)
    })
    
    it('should return 401 without authentication', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/route/1'
      })
      
      expect(response.statusCode).toBe(401)
    })
  })
  
  describe('GET /route', () => {
    it('should list routes successfully', async () => {
      // Arrange
      const tenant = await insertTenant()
      createdIds.tenants.push(tenant.id)
      
      const route = await insertRoute(tenant.id)
      createdIds.routes.push(route.id)
      
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
        url: '/route',
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
        url: '/route'
      })
      
      expect(response.statusCode).toBe(401)
    })
  })
})
