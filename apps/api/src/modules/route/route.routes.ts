import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { RouteController } from './route.controller'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    checkPermission: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const routeController = new RouteController()

const routeRoutes: FastifyPluginAsyncZod = async (app) => {
  // Create Route (Protected)
  app.post(
    '/route',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Route'],
        description: 'Create a new route',
        body: z.object({
          name: z.string().min(1).max(100),
          path: z.string().min(1).max(500),
          type: z.enum(['api', 'frontend']),
          method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']).optional(),
          description: z.string().max(500).optional(),
        }),
        response: {
          201: z.object({
            id: z.number(),
            external_reference: z.string(),
            name: z.string(),
            path: z.string(),
            type: z.string(),
            method: z.string().nullable(),
            description: z.string().nullable(),
            is_active: z.boolean(),
            created_at: z.string(),
            updated_at: z.string(),
          }),
          400: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    routeController.create.bind(routeController)
  )

  // Get Route by ID (Protected)
  app.get(
    '/route/:id',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Route'],
        description: 'Get route by ID',
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            id: z.number(),
            external_reference: z.string(),
            name: z.string(),
            path: z.string(),
            type: z.string(),
            method: z.string().nullable(),
            description: z.string().nullable(),
            is_active: z.boolean(),
            created_at: z.string(),
            updated_at: z.string(),
          }),
          400: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
          404: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    routeController.findById.bind(routeController)
  )

  // List Routes (Protected)
  app.get(
    '/route',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Route'],
        description: 'List all routes with optional filters',
        querystring: z.object({
          isActive: z.string().optional(),
          type: z.string().optional(),
          method: z.string().optional(),
          limit: z.string().optional(),
          offset: z.string().optional(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              external_reference: z.string(),
              name: z.string(),
              path: z.string(),
              type: z.string(),
              method: z.string().nullable(),
              description: z.string().nullable(),
              is_active: z.boolean(),
              created_at: z.string(),
              updated_at: z.string(),
            })
          ),
        },
      },
    },
    routeController.findAll.bind(routeController)
  )

  // Update Route (Protected)
  app.patch(
    '/route/:id',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Route'],
        description: 'Update route',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          name: z.string().min(1).max(100).optional(),
          path: z.string().min(1).max(500).optional(),
          type: z.enum(['api', 'frontend']).optional(),
          method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']).optional(),
          description: z.string().max(500).optional(),
          isActive: z.boolean().optional(),
        }),
        response: {
          200: z.object({
            id: z.number(),
            external_reference: z.string(),
            name: z.string(),
            path: z.string(),
            type: z.string(),
            method: z.string().nullable(),
            description: z.string().nullable(),
            is_active: z.boolean(),
            created_at: z.string(),
            updated_at: z.string(),
          }),
          400: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    routeController.update.bind(routeController)
  )

  // Soft Delete Route (Protected)
  app.delete(
    '/route/:id',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Route'],
        description: 'Soft delete route',
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          400: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
          404: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    routeController.softDelete.bind(routeController)
  )

  // Add Profile to Route (Protected)
  app.post(
    '/route/:id/profile',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Route'],
        description: 'Add profile to route (grant access)',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          profileId: z.number().int().positive(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          400: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    routeController.addProfile.bind(routeController)
  )

  // Remove Profile from Route (Protected)
  app.delete(
    '/route/:id/profile',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Route'],
        description: 'Remove profile from route (revoke access)',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          profileId: z.number().int().positive(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
          400: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    routeController.removeProfile.bind(routeController)
  )
}

export default routeRoutes
