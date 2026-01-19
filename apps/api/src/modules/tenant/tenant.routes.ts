import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { TenantController } from './tenant.controller'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const tenantController = new TenantController()

const tenantRoutes: FastifyPluginAsyncZod = async (app) => {
  // Create Tenant (Protected)
  app.post(
    '/tenant',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Tenant'],
        description: 'Create a new tenant',
        body: z.object({
          name: z.string().min(1),
          slug: z.string().min(1),
          domain: z.string().optional(),
          plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
          ownerEmail: z.string().email(),
          maxUsers: z.number().int().positive().optional(),
        }),
        response: {
          201: z.object({
            id: z.number(),
            external_reference: z.string(),
            name: z.string(),
            slug: z.string(),
            domain: z.string().nullable(),
            plan: z.string(),
            owner_email: z.string(),
            max_users: z.number(),
            is_active: z.boolean(),
            is_trial: z.boolean(),
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
    tenantController.create.bind(tenantController)
  )

  // Get Tenant by ID (Protected)
  app.get(
    '/tenant/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Tenant'],
        description: 'Get tenant by ID',
        params: z.object({
          id: z.string(),
        }),
        response: {
          200: z.object({
            id: z.number(),
            external_reference: z.string(),
            name: z.string(),
            slug: z.string(),
            domain: z.string().nullable(),
            plan: z.string(),
            owner_email: z.string(),
            max_users: z.number(),
            is_active: z.boolean(),
            is_trial: z.boolean(),
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
    tenantController.findById.bind(tenantController)
  )

  // List Tenants (Protected)
  app.get(
    '/tenant',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Tenant'],
        description: 'List all tenants with optional filters',
        querystring: z.object({
          isActive: z.string().optional(),
          plan: z.string().optional(),
          limit: z.string().optional(),
          offset: z.string().optional(),
        }),
        response: {
          200: z.array(
            z.object({
              id: z.number(),
              external_reference: z.string(),
              name: z.string(),
              slug: z.string(),
              domain: z.string().nullable(),
              plan: z.string(),
              owner_email: z.string(),
              max_users: z.number(),
              is_active: z.boolean(),
              is_trial: z.boolean(),
              created_at: z.string(),
              updated_at: z.string(),
            })
          ),
        },
      },
    },
    tenantController.findAll.bind(tenantController)
  )

  // Update Tenant (Protected)
  app.patch(
    '/tenant/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Tenant'],
        description: 'Update tenant',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          name: z.string().min(1).optional(),
          slug: z.string().min(1).optional(),
          domain: z.string().optional(),
          plan: z.enum(['free', 'starter', 'professional', 'enterprise']).optional(),
          maxUsers: z.number().int().positive().optional(),
          ownerEmail: z.string().email().optional(),
          supportEmail: z.string().email().optional(),
          phone: z.string().optional(),
          isActive: z.boolean().optional(),
        }),
        response: {
          200: z.object({
            id: z.number(),
            external_reference: z.string(),
            name: z.string(),
            slug: z.string(),
            domain: z.string().nullable(),
            plan: z.string(),
            owner_email: z.string(),
            max_users: z.number(),
            is_active: z.boolean(),
            is_trial: z.boolean(),
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
    tenantController.update.bind(tenantController)
  )

  // Soft Delete Tenant (Protected)
  app.delete(
    '/tenant/:id',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Tenant'],
        description: 'Soft delete tenant',
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
    tenantController.softDelete.bind(tenantController)
  )

  // Add User to Tenant (Protected)
  app.post(
    '/tenant/:id/user',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Tenant'],
        description: 'Add user to tenant',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          userId: z.number().int().positive(),
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
    tenantController.addUser.bind(tenantController)
  )

  // Remove User from Tenant (Protected)
  app.delete(
    '/tenant/:id/user',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Tenant'],
        description: 'Remove user from tenant',
        params: z.object({
          id: z.string(),
        }),
        body: z.object({
          userId: z.number().int().positive(),
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
    tenantController.removeUser.bind(tenantController)
  )
}

export default tenantRoutes
