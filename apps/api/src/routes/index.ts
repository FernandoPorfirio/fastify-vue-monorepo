import type { FastifyInstance } from 'fastify'
import ScalarApiReference from '@scalar/fastify-api-reference'
import healthRoutes from './health'
import { authRoutes } from '../modules/auth'
import { userRoutes } from '../modules/user'
import { inviteRoutes } from '../modules/invite'
import { tenantRoutes } from '../modules/tenant'
import { profileRoutes } from '../modules/profile'

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
  await app.register(tenantRoutes)
  await app.register(profileRoutes)
}
