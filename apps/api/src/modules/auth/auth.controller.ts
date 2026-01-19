import type { FastifyReply, FastifyRequest } from 'fastify'
import { AuthService } from './auth.service'
import type { JWTPayload } from '@/lib/auth'

const authService = new AuthService()

export interface LoginBody {
  email: string
  password: string
}

export interface RefreshBody {
  refreshToken: string
}

export interface LogoutBody {
  refreshToken?: string
}

export class AuthController {
  async login(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { email, password } = request.body as LoginBody

    const result = await authService.login(
      { email, password },
      request.ip,
      request.headers['user-agent']
    )

    if (!result) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid email or password',
      })
    }

    return reply.status(200).send(result)
  }

  async refresh(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { refreshToken } = request.body as RefreshBody

    const result = await authService.refresh(
      { refreshToken },
      request.ip,
      request.headers['user-agent']
    )

    if (!result) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired refresh token',
      })
    }

    return reply.status(200).send(result)
  }

  async logout(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { refreshToken } = request.body as LogoutBody
    const userId = (request.user as JWTPayload).userId

    await authService.logout({ userId, refreshToken })

    return reply.status(200).send({
      message: 'Logged out successfully',
    })
  }
}
