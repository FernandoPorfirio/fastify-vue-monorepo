import type { FastifyInstance } from 'fastify'
import ScalarApiReference from '@scalar/fastify-api-reference'
import healthRoutes from './health'
import { authRoutes } from '../modules/auth'
import { userRoutes } from '../modules/user'
import { inviteRoutes } from '../modules/invite'

export async function registerRoutes(app: FastifyInstance) {
  // API Documentation
  await app.register(ScalarApiReference, {
    routePrefix: '/api-docs'
  })

  // Routes
  await app.register(healthRoutes)
  await app.register(authRoutes)
  await app.register(userRoutes)
  await app.register(inviteRoutes)
}
