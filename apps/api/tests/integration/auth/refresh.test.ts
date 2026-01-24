import { describe, it, expect, beforeAll, afterAll, afterEach } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { 
  createTestApp, 
  closeTestApp,
  insertTenant,
  insertUserWithTenant,
  deleteRecords,
  cleanupUsers,
  cleanupTenants
} from '@tests/helpers'

describe('POST /auth/refresh', () => {
  let app: FastifyInstance
  const createdIds = {
    tenants: [] as number[],
    users: [] as number[]
  }
  
  beforeAll(async () => {
    app = await createTestApp()
  })
  
  afterAll(async () => {
    await closeTestApp(app)
  })
  
  afterEach(async () => {
    // Limpar na ordem correta (tabelas dependentes primeiro)
    await deleteRecords('tenant_users', [])  // Limpar relações
    await cleanupUsers(createdIds.users)
    await cleanupTenants(createdIds.tenants)
    createdIds.users = []
    createdIds.tenants = []
  })
  
  it('should refresh token successfully', async () => {
    // Arrange - Criar usuário e fazer login
    const tenant = await insertTenant()
    createdIds.tenants.push(tenant.id)
    
    const user = await insertUserWithTenant(tenant.id, {
      password: 'password123'
    })
    createdIds.users.push(user.id)
    
    // Login para obter refresh token
    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: user.email,
        password: 'password123'
      }
    })
    
    const { refreshToken } = JSON.parse(loginResponse.body)
    
    // Act - Refresh token
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: {
        refreshToken
      }
    })
    
    // Assert
    expect(response.statusCode).toBe(200)
    
    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('token')
    expect(body).toHaveProperty('refreshToken')
    expect(body.token).not.toBe(loginResponse.body.token) // Novo token
  })
  
  it('should return 401 with invalid refresh token', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: {
        refreshToken: 'invalid-token'
      }
    })
    
    expect(response.statusCode).toBe(401)
  })
  
  it('should return 400 when refresh token is missing', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      payload: {}
    })
    
    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Validation Error')
  })
})
