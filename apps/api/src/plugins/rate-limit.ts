import fastifyPlugin from 'fastify-plugin'
import rateLimit from '@fastify/rate-limit'
import type { FastifyInstance } from 'fastify'

/**
 * Rate Limiting Plugin
 *
 * - Global: 100 requisições / 15 minutos
 * - Auth: 5 tentativas / 15 minutos
 * - Identificação por usuário autenticado ou IP
 */

export default fastifyPlugin(async (fastify: FastifyInstance) => {
  // GLOBAL
  await fastify.register(rateLimit, {
    global: true,
    max: 100,
    timeWindow: '15 minutes',
    addHeaders: {
      'x-ratelimit-limit': true,
      'x-ratelimit-remaining': true,
      'x-ratelimit-reset': true,
    },
    keyGenerator: req => {
      const userId = req.user?.userId
      return userId ? `user:${userId}` : `ip:${req.ip}`
    },
    errorResponseBuilder: (_req, context) => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: `Limite excedido. Tente novamente em ${Math.ceil(context.ttl / 1000)}s.`,
      retryAfter: context.ttl,
    }),
  })

  // AUTH (mais restritivo)
  await fastify.register(
    async authScope => {
      await authScope.register(rateLimit, {
        max: 5,
        timeWindow: '15 minutes',
        errorResponseBuilder: (_req, context) => ({
          statusCode: 429,
          error: 'Too Many Requests',
          message: 'Muitas tentativas de autenticação. Tente novamente mais tarde.',
          retryAfter: context.ttl,
        }),
      })
    },
    { prefix: '/auth' }
  )
})
