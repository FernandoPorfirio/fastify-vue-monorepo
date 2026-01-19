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
}

async function authPlugin(app: FastifyInstance) {
  // Decorator para verificar autenticação
  app.decorate('authenticate', async (
    request: FastifyRequest,
    reply: FastifyReply
  ) => {
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

  // Decorator para verificar permissão de rota
  app.decorate(
    'authorize',
    (routePath: string, method: string = 'GET') => {
      return async (request: FastifyRequest, reply: FastifyReply) => {
        if (!request.user) {
          return reply.status(401).send({
            statusCode: 401,
            error: 'Unauthorized',
            message: 'Authentication required',
          })
        }

        // Buscar a rota no banco
        const route = await db('routes')
          .where({ path: routePath, method: method.toUpperCase(), is_active: true })
          .first()

        if (!route) {
          // Se a rota não está cadastrada, permite acesso
          return
        }

        // Verificar se algum dos perfis do usuário tem acesso à rota
        const hasAccess = await db('profile_routes')
          .whereIn('profile_id', request.user.profileIds)
          .where('route_id', route.id)
          .first()

        if (!hasAccess) {
          return reply.status(403).send({
            statusCode: 403,
            error: 'Forbidden',
            message: 'Insufficient permissions',
          })
        }
      }
    }
  )
}

export default fp(authPlugin)
