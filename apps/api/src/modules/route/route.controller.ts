import type { FastifyReply, FastifyRequest } from 'fastify'
import { RouteService } from './route.service'

const routeService = new RouteService()

export interface CreateRouteBody {
  name: string
  path: string
  type: 'api' | 'frontend'
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
  description?: string
}

export interface UpdateRouteBody {
  name?: string
  path?: string
  type?: 'api' | 'frontend'
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'OPTIONS' | 'HEAD'
  description?: string
  isActive?: boolean
}

export interface RouteParams {
  id: string
}

export interface AddProfileBody {
  profileId: number
}

export interface ListRoutesQuery {
  isActive?: string
  type?: string
  method?: string
  limit?: string
  offset?: string
}

export class RouteController {
  async create(request: FastifyRequest, reply: FastifyReply) {
    const body = request.body as CreateRouteBody

    const result = await routeService.create(body)

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Route name already exists or path + method combination already exists',
      })
    }

    return reply.status(201).send(result)
  }

  async findById(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as RouteParams
    const routeId = Number.parseInt(id, 10)

    if (Number.isNaN(routeId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid route ID',
      })
    }

    const result = await routeService.findById(routeId)

    if (!result) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Route not found',
      })
    }

    return reply.status(200).send(result)
  }

  async findAll(request: FastifyRequest, reply: FastifyReply) {
    const query = request.query as ListRoutesQuery

    const filters: any = {}

    if (query.isActive !== undefined) {
      filters.isActive = query.isActive === 'true'
    }

    if (query.type) {
      filters.type = query.type
    }

    if (query.method) {
      filters.method = query.method
    }

    if (query.limit) {
      filters.limit = Number.parseInt(query.limit, 10)
    }

    if (query.offset) {
      filters.offset = Number.parseInt(query.offset, 10)
    }

    const result = await routeService.findAll(filters)

    return reply.status(200).send(result)
  }

  async update(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as RouteParams
    const body = request.body as UpdateRouteBody
    const routeId = Number.parseInt(id, 10)

    if (Number.isNaN(routeId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid route ID',
      })
    }

    const result = await routeService.update({
      routeId,
      ...body,
    })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Route not found, name already exists, or path + method combination already exists',
      })
    }

    return reply.status(200).send(result)
  }

  async softDelete(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as RouteParams
    const routeId = Number.parseInt(id, 10)

    if (Number.isNaN(routeId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid route ID',
      })
    }

    const result = await routeService.softDelete(routeId)

    if (!result) {
      return reply.status(404).send({
        statusCode: 404,
        error: 'Not Found',
        message: 'Route not found or already deleted',
      })
    }

    return reply.status(200).send(result)
  }

  async addProfile(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as RouteParams
    const { profileId } = request.body as AddProfileBody
    const routeId = Number.parseInt(id, 10)

    if (Number.isNaN(routeId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid route ID',
      })
    }

    const result = await routeService.addProfile({ routeId, profileId })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Route not found, profile not found, or profile already has access to this route',
      })
    }

    return reply.status(200).send(result)
  }

  async removeProfile(request: FastifyRequest, reply: FastifyReply) {
    const { id } = request.params as RouteParams
    const { profileId } = request.body as AddProfileBody
    const routeId = Number.parseInt(id, 10)

    if (Number.isNaN(routeId)) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message: 'Invalid route ID',
      })
    }

    const result = await routeService.removeProfile({ routeId, profileId })

    if (!result) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Bad Request',
        message:
          'Route not found, profile not found, or profile does not have access to this route',
      })
    }

    return reply.status(200).send(result)
  }
}
