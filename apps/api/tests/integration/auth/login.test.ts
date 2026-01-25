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

/**
 * Exemplo de teste de integração com o padrão simplificado
 *
 * Padrão:
 * 1. Criar dados necessários para o teste
 * 2. Executar requisição
 * 3. Fazer assertions
 * 4. Limpar dados criados (afterEach)
 */

describe('POST /auth/login', () => {
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
    // Limpar dados criados neste teste
    await cleanupUsers(createdIds.users)
    await cleanupTenants(createdIds.tenants)
    createdIds.users = []
    createdIds.tenants = []
  })

  it('should login successfully with valid credentials', async () => {
    // Arrange - Criar dados necessários
    const tenant = await insertTenant()
    createdIds.tenants.push(tenant.id)

    const user = await insertUserWithTenant(tenant.id)
    createdIds.users.push(user.id)

    // Act - Executar requisição
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: user.email,
        password: 'password123',
      },
    })

    // Assert - Verificar resposta
    expect(response.statusCode).toBe(200)

    const body = JSON.parse(response.body)
    expect(body).toHaveProperty('token')
    expect(body).toHaveProperty('refreshToken')
    expect(body.user).toMatchObject({
      email: user.email,
      name: user.name,
    })
  })

  it('should return 401 with invalid credentials', async () => {
    // Arrange
    const tenant = await insertTenant()
    createdIds.tenants.push(tenant.id)

    const user = await insertUserWithTenant(tenant.id)
    createdIds.users.push(user.id)

    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: user.email,
        password: 'wrongpassword',
      },
    })

    // Assert
    expect(response.statusCode).toBe(401)
  })

  it('should return 400 with invalid email format', async () => {
    // Act
    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'invalid-email',
        password: 'password123',
      },
    })

    // Assert
    expect(response.statusCode).toBe(400)
    const body = JSON.parse(response.body)
    expect(body.error).toBe('Validation Error')
  })
})
