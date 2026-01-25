import type { FastifyReply, FastifyRequest } from 'fastify'
import { TenantService } from './tenant.service'

const tenantService = new TenantService()

export interface CreateTenantBody {
  name: string
  slug: string
  domain?: string
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  ownerEmail: string
  maxUsers?: number
}

export interface UpdateTenantBody {
  name?: string
  slug?: string
  domain?: string
  plan?: 'free' | 'starter' | 'professional' | 'enterprise'
  maxUsers?: number
  ownerEmail?: string
  supportEmail?: string
  phone?: string
  isActive?: boolean
}

export interface TenantParams {
  id: string
}

export interface AddUserBody {
  userId: number
}

export interface ListTenantsQuery {
  isActive?: string
  plan?: string
  limit?: string
  offset?: string
}

export class TenantController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateTenantBody

    const result = await tenantService.create(body)

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Tenant slug or domain already exists',
      })
    }

    return reply.status(201).send(result)
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as TenantParams
    const tenantId = Number.parseInt(id, 10)

    if (Number.isNaN(tenantId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid tenant ID',
      })
    }

    const result = await tenantService.findById(tenantId)

    if (!result) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Tenant not found',
      })
    }

    return reply.status(200).send(result)
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListTenantsQuery

    const filters: { isActive?: boolean; plan?: string; limit?: number; offset?: number } = {}

    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true'
    }

    if (query.plan) {
      filters.plan = query.plan
    }

    if (query.limit) {
      filters.limit = Number.parseInt(query.limit, 10)
    }

    if (query.offset) {
      filters.offset = Number.parseInt(query.offset, 10)
    }

    const result = await tenantService.findAll(filters)

    return reply.status(200).send(result)
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as TenantParams
    const body = request.body as UpdateTenantBody
    const tenantId = Number.parseInt(id, 10)

    if (Number.isNaN(tenantId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid tenant ID',
      })
    }

    const result = await tenantService.update({
      tenantId,
      ...body,
    })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Tenant not found or slug/domain already exists',
      })
    }

    return reply.status(200).send(result)
  }

  async softDelete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as TenantParams
    const tenantId = Number.parseInt(id, 10)

    if (Number.isNaN(tenantId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid tenant ID',
      })
    }

    const result = await tenantService.softDelete(tenantId)

    if (!result) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Tenant not found or already deleted',
      })
    }

    return reply.status(200).send(result)
  }

  async addUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as TenantParams
    const { userId } = request.body as AddUserBody
    const tenantId = Number.parseInt(id, 10)

    if (Number.isNaN(tenantId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid tenant ID',
      })
    }

    const result = await tenantService.addUser({ tenantId, userId })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Tenant not found, user not found, user already linked, or tenant user limit reached',
      })
    }

    return reply.status(200).send(result)
  }

  async removeUser(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as TenantParams
    const { userId } = request.body as AddUserBody
    const tenantId = Number.parseInt(id, 10)

    if (Number.isNaN(tenantId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid tenant ID',
      })
    }

    const result = await tenantService.removeUser({ tenantId, userId })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Tenant not found, user not found, or user not linked to tenant',
      })
    }

    return reply.status(200).send(result)
  }
}
