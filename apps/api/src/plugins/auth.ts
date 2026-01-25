import type { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify'
import fp from 'fastify-plugin'
import { verifyToken, type JWTPayload } from '@/lib/auth'
import { db } from '@/lib/db'

declare module 'fastify' {
  interface FastifyRequest {
    user?: JWTPayload & {
      tenantId: number
      profileIds: number[]
    }
  }
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    checkPermission: (request: FastifyRequest, reply: FastifyReply) => Promise<void>
    authorize: (
      routePath: string,
      method?: string
    ) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>
  }
}

async function authPlugin(app: FastifyInstance) {
  // Decorator para verificar autenticação
  app.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = request.headers.authorization

      if (!authHeader?.startsWith('Bearer ')) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Missing or invalid authorization header',
        })
      }

      const token = authHeader.substring(7)

      // Verificar se o token não está vazio
      if (!token) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'Token is required',
        })
      }

      const payload = verifyToken(token)

      // Buscar tenant e perfis do usuário
      const tenantUser = await db('tenant_users')
        .where({ user_id: payload.userId, is_active: true })
        .first()

      if (!tenantUser) {
        return reply.status(401).send({
          statusCode: 401,
          error: 'Unauthorized',
          message: 'User not associated with any tenant',
        })
      }

      const profiles = await db('user_profiles')
        .where({
          user_id: payload.userId,
          tenant_id: tenantUser.tenant_id,
          is_active: true,
        })
        .pluck('profile_id')

      request.user = {
        ...payload,
        tenantId: tenantUser.tenant_id,
        profileIds: profiles,
      }
    } catch (error) {
      app.log.error(error, 'Authentication error:')
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Invalid or expired token',
      })
    }
  })

  // Middleware RBAC automático - verifica permissão baseado na rota da requisição
  app.decorate('checkPermission', async (request: FastifyRequest, reply: FastifyReply) => {
    // Verificar se usuário está autenticado
    if (!request.user) {
      return reply.status(401).send({
        statusCode: 401,
        error: 'Unauthorized',
        message: 'Authentication required',
      })
    }

    // Extrair path e method da requisição
    const requestPath = request.routeOptions.url || request.url
    const requestMethod = request.method.toUpperCase()

    // Buscar a rota no banco de dados
    const route = await db('routes')
      .where({
        path: requestPath,
        method: requestMethod,
        type: 'api',
        is_active: true,
      })
      .whereNull('deleted_at')
      .first()

    // Se a rota não está cadastrada no sistema, permite acesso
    if (!route) {
      app.log.debug(
        { path: requestPath, method: requestMethod },
        'Route not found in database, allowing access'
      )
      return
    }

    // Verificar se algum dos perfis do usuário tem acesso à rota
    const hasAccess = await db('profile_routes')
      .whereIn('profile_id', request.user.profileIds)
      .where('route_id', route.id)
      .where('is_active', true)
      .first()

    if (!hasAccess) {
      app.log.warn(
        {
          userId: request.user.userId,
          profileIds: request.user.profileIds,
          route: requestPath,
          method: requestMethod,
        },
        'Access denied - User does not have permission'
      )

      return reply.status(403).send({
        statusCode: 403,
        error: 'Forbidden',
        message: 'You do not have permission to access this resource',
      })
    }

    app.log.debug(
      {
        userId: request.user.userId,
        profileIds: request.user.profileIds,
        route: requestPath,
      },
      'Access granted'
    )
  })
}

export default fp(authPlugin)
