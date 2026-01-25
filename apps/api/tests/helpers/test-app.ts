import { fastify, FastifyInstance } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { errorHandler } from '@/errors/handler'
import authPlugin from '@/plugins/auth'
import { registerRoutes } from '@/routes'

/**
 * Cria uma instância do Fastify configurada para testes
 */
export async function createTestApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: false, // Desabilitar logs em testes
  }).withTypeProvider<ZodTypeProvider>()

  // Configurações essenciais
  app.setValidatorCompiler(validatorCompiler)
  app.setSerializerCompiler(serializerCompiler)
  app.setErrorHandler(errorHandler)

  // Plugins necessários para testes
  app.register(authPlugin)

  // Rotas
  app.register(registerRoutes)

  // Aguardar o app estar pronto
  await app.ready()

  return app
}

/**
 * Fecha a instância do Fastify de forma segura
 */
export async function closeTestApp(app: FastifyInstance): Promise<void> {
  await app.close()
}
