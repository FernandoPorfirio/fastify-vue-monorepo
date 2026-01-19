import type { FastifyInstance } from 'fastify'
import ScalarApiReference from '@scalar/fastify-api-reference'
import healthRoutes from './health'
import { authRoutes } from '../modules/auth'

export async function registerRoutes(app: FastifyInstance) {
  // API Documentation
  await app.register(ScalarApiReference, {
    routePrefix: '/api-docs'
  })

  // Routes
  await app.register(healthRoutes)
  await app.register(authRoutes)
}
