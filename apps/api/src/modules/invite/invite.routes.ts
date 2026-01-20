import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { InviteController } from './invite.controller'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    checkPermission: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const inviteController = new InviteController()

const inviteRoutes: FastifyPluginAsyncZod = async (app) => {
  // Create Invite (Protected)
  app.post(
    '/invite',
    {
      onRequest: [app.authenticate, app.checkPermission],
      schema: {
        tags: ['Invite'],
        description: 'Create a new user invite',
        body: z.object({
          email: z.string().email(),
          profileId: z.number().int().positive(),
        }),
        response: {
          201: z.object({
            message: z.string(),
            token: z.string().optional(),
            expiresAt: z.string().datetime(),
          }),
          400: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
          403: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    inviteController.create.bind(inviteController)
  )

  // Accept Invite (Public)
  app.post(
    '/invite/accept',
    {
      schema: {
        tags: ['Invite'],
        description: 'Accept an invite and create account',
        body: z.object({
          token: z.string(),
          email: z.string().email(),
          name: z.string().min(1),
          password: z.string().min(6),
        }),
        response: {
          200: z.object({
            token: z.string(),
            refreshToken: z.string(),
            user: z.object({
              id: z.number(),
              email: z.string(),
              name: z.string(),
            }),
          }),
          400: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    inviteController.accept.bind(inviteController)
  )
}

export default inviteRoutes
