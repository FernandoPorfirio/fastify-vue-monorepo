import type { FastifyInstance } from 'fastify'
import ScalarApiReference from '@scalar/fastify-api-reference'
import healthRoutes from './health'

export async function registerRoutes(app: FastifyInstance) {
  // API Documentation
  await app.register(ScalarApiReference, {
    routePrefix: '/api-docs'
  })

  // Routes
  await app.register(healthRoutes)
}
