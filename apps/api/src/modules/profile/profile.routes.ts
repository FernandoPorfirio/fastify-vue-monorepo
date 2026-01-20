import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { ProfileController } from './profile.controller'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    checkPermission: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const profileController = new ProfileController()

const profileRoutes: FastifyPluginAsyncZod = async (app) => {
  // Create Profile (Protected)
  app.post(
    '/profile',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Profile'],
        description: 'Create a new profile',
        body: z.object({
          name: z.string().min(1).max(100),
          description: z.string().max(500).optional(),
        }),
        response: {
          201: z.object({
            id: z.number(),
            external_reference: z.string(),
            name: z.string(),
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
    profileController.create.bind(profileController)
  )

  // Get Profile by ID (Protected)
  app.get(
    '/profile/:id',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Profile'],
        description: 'Get profile by ID',
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            id: z.number(),
            external_reference: z.string(),
            name: z.string(),
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
    profileController.findById.bind(profileController)
  )

  // List Profiles (Protected)
  app.get(
    '/profile',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Profile'],
        description: 'List all profiles with optional filters',
        querystring: z.object({
          isActive: z.string().optional(),
          limit: z.string().optional(),
          offset: z.string().optional(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              external_reference: z.string(),
              name: z.string(),
              description: z.string().nullable(),
              is_active: z.boolean(),
              created_at: z.string(),
              updated_at: z.string(),
            })
          ),
        },
      },
    },
    profileController.findAll.bind(profileController)
  )

  // Update Profile (Protected)
  app.patch(
    '/profile/:id',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Profile'],
        description: 'Update profile',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          name: z.string().min(1).max(100).optional(),
          description: z.string().max(500).optional(),
          isActive: z.boolean().optional(),
        }),
        response: {
          200: z.object({
            id: z.number(),
            external_reference: z.string(),
            name: z.string(),
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
    profileController.update.bind(profileController)
  )

  // Soft Delete Profile (Protected)
  app.delete(
    '/profile/:id',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Profile'],
        description: 'Soft delete profile',
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
    profileController.softDelete.bind(profileController)
  )

  // Add User to Profile (Protected)
  app.post(
    '/profile/:id/user',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Profile'],
        description: 'Add user to profile (requires tenant context)',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          userId: z.number().int().positive(),
          tenantId: z.number().int().positive(),
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
    profileController.addUser.bind(profileController)
  )

  // Remove User from Profile (Protected)
  app.delete(
    '/profile/:id/user',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Profile'],
        description: 'Remove user from profile (requires tenant context)',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          userId: z.number().int().positive(),
          tenantId: z.number().int().positive(),
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
    profileController.removeUser.bind(profileController)
  )
}

export default profileRoutes
