import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import type { FastifyRequest, FastifyReply } from 'fastify'
import { z } from 'zod'
import { AuthController } from './auth.controller'

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

const authController = new AuthController()

const authRoutes: FastifyPluginAsyncZod = async (app) => {
  // Login
  app.post(
    '/auth/login',
    {
      schema: {
        tags: ['Auth'],
        description: 'User login',
        body: z.object({
          email: z.email(),
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
          401: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    authController.login.bind(authController)
  )

  // Refresh Token
  app.post(
    '/auth/refresh',
    {
      schema: {
        tags: ['Auth'],
        description: 'Refresh access token',
        body: z.object({
          refreshToken: z.string(),
        }),
        response: {
          200: z.object({
            token: z.string(),
            refreshToken: z.string(),
          }),
          401: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    authController.refresh.bind(authController)
  )

  // Logout
  app.post(
    '/auth/logout',
    {
      onRequest: [app.authenticate],
      schema: {
        tags: ['Auth'],
        description: 'User logout',
        body: z.object({
          refreshToken: z.string().optional(),
        }),
        response: {
          200: z.object({
            message: z.string(),
          }),
        },
      },
    },
    authController.logout.bind(authController)
  )
}

export default authRoutes
