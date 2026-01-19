import type { FastifyReply, FastifyRequest } from 'fastify'
import { InviteService } from './invite.service'
import type { JWTPayload } from '@/lib/auth'

const inviteService = new InviteService()

export interface CreateInviteBody {
  email: string
  profileId: number
}

export interface AcceptInviteBody {
  token: string
  email: string
  name: string
  password: string
}

export class InviteController {
  async create(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { email, profileId } = request.body as CreateInviteBody
    const user = request.user as JWTPayload

    // Verificar se o usuário tem tenantId
    if (!user.tenantId) {
      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'User does not belong to any tenant',
      })
    }

    const result = await inviteService.createInvite({
      tenantId: user.tenantId,
      invitedBy: user.userId,
      profileId,
      email,
    })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Unable to create invite. Check if the email is already registered or has a pending invite',
      })
    }

    return reply.status(201).send(result)
  }

  async accept(
    request: FastifyRequest,
    reply: FastifyReply
  ) {
    const { token, email, name, password } = request.body as AcceptInviteBody

    const result = await inviteService.acceptInvite({
      token,
      email,
      name,
      password,
    })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid or expired invite token',
      })
    }

    return reply.status(200).send(result)
  }
}
