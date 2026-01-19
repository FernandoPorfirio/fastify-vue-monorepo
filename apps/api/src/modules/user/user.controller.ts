import type { FastifyReply, FastifyRequest } from 'fastify'
import { UserService } from './user.service'

const userService = new UserService()

export interface RequestPasswordResetBody {
  email: string
}

export interface VerifyResetTokenBody {
  token: string
}

export interface ResetPasswordBody {
  token: string
  newPassword: string
}

export class UserController {
  async requestPasswordReset(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { email } = request.body as RequestPasswordResetBody

    const result = await userService.requestPasswordReset({ email })

    return reply.status(200).send(result)
  }

  async verifyResetToken(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { token } = request.body as VerifyResetTokenBody

    const result = await userService.verifyResetToken({ token })

    if (!result.valid) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid or expired token',
      })
    }

    return reply.status(200).send(result)
  }

  async resetPassword(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { token, newPassword } = request.body as ResetPasswordBody

    const result = await userService.resetPassword({ token, newPassword })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid or expired token',
      })
    }

    return reply.status(200).send(result)
  }
}
