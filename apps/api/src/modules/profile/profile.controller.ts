import type { FastifyReply, FastifyRequest } from 'fastify'
import { ProfileService } from './profile.service'

const profileService = new ProfileService()

export interface CreateProfileBody {
  name: string
  description?: string
}

export interface UpdateProfileBody {
  name?: string
  description?: string
  isActive?: boolean
}

export interface ProfileParams {
  id: string
}

export interface AddUserBody {
  userId: number
  tenantId: number
}

export interface ListProfilesQuery {
  isActive?: string
  limit?: string
  offset?: string
}

export class ProfileController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateProfileBody

    const result = await profileService.create(body)

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Profile name already exists',
      })
    }

    return reply.status(201).send(result)
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as ProfileParams
    const profileId = Number.parseInt(id, 10)

    if (Number.isNaN(profileId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid profile ID',
      })
    }

    const result = await profileService.findById(profileId)

    if (!result) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Profile not found',
      })
    }

    return reply.status(200).send(result)
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListProfilesQuery

    const filters: any = {}

    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true'
    }

    if (query.limit) {
      filters.limit = Number.parseInt(query.limit, 10)
    }

    if (query.offset) {
      filters.offset = Number.parseInt(query.offset, 10)
    }

    const result = await profileService.findAll(filters)

    return reply.status(200).send(result)
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as ProfileParams
    const body = request.body as UpdateProfileBody
    const profileId = Number.parseInt(id, 10)

    if (Number.isNaN(profileId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid profile ID',
      })
    }

    const result = await profileService.update({
      profileId,
      ...body,
    })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Profile not found or name already exists',
      })
    }

    return reply.status(200).send(result)
  }

  async softDelete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as ProfileParams
    const profileId = Number.parseInt(id, 10)

    if (Number.isNaN(profileId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid profile ID',
      })
    }

    const result = await profileService.softDelete(profileId)

    if (!result) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Profile not found or already deleted',
      })
    }

    return reply.status(200).send(result)
  }

  async addUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as ProfileParams
    const { userId, tenantId } = request.body as AddUserBody
    const profileId = Number.parseInt(id, 10)

    if (Number.isNaN(profileId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid profile ID',
      })
    }

    const result = await profileService.addUser({ profileId, userId, tenantId })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Profile not found, user not found, tenant not found, user not linked to tenant, or user already has this profile',
      })
    }

    return reply.status(200).send(result)
  }

  async removeUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as ProfileParams
    const { userId, tenantId } = request.body as AddUserBody
    const profileId = Number.parseInt(id, 10)

    if (Number.isNaN(profileId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid profile ID',
      })
    }

    const result = await profileService.removeUser({ profileId, userId, tenantId })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Profile not found, user not found, tenant not found, or user does not have this profile',
      })
    }

    return reply.status(200).send(result)
  }
}
