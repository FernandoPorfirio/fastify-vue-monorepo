import type { FastifyPluginAsyncZod } from 'fastify-type-provider-zod'
import { z } from 'zod'
import { UserController } from './user.controller'

const userController = new UserController()

const userRoutes: FastifyPluginAsyncZod = async app => {
  // Request Password Reset
  app.post(
    '/user/password-reset/request',
    {
      schema: {
        tags: ['User'],
        description: 'Request password reset',
        body: z.object({
          email: z.string().email(),
        }),
        response: {
          200: z.object({
            message: z.string(),
            token: z.string().optional(), // Only in development
          }),
        },
      },
    },
    userController.requestPasswordReset.bind(userController)
  )

  // Verify Reset Token
  app.post(
    '/user/password-reset/verify',
    {
      schema: {
        tags: ['User'],
        description: 'Verify password reset token',
        body: z.object({
          token: z.string(),
        }),
        response: {
          200: z.object({
            valid: z.boolean(),
            email: z.string().optional(),
          }),
          400: z.object({
            statusCode: z.number(),
            error: z.string(),
            message: z.string(),
          }),
        },
      },
    },
    userController.verifyResetToken.bind(userController)
  )

  // Reset Password
  app.post(
    '/user/password-reset/reset',
    {
      schema: {
        tags: ['User'],
        description: 'Reset password with token',
        body: z.object({
          token: z.string(),
          newPassword: z.string().min(6),
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
    userController.resetPassword.bind(userController)
  )
}

export default userRoutes
