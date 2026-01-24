import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import type { FastifyInstance } from 'fastify'
import { createTestApp, closeTestApp } from '@tests/helpers'

describe('GET /health', () => {
  let app: FastifyInstance
  
  beforeAll(async () => {
    app = await createTestApp()
  })
  
  afterAll(async () => {
    await closeTestApp(app)
  })
  
  it('should return 200 with status ok', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health'
    })
    
    expect(response.statusCode).toBe(200)
    
    const body = JSON.parse(response.body)
    expect(body.status).toBe('ok')
  })
})
