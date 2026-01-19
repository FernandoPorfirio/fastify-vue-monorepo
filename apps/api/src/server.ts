import { fastify } from 'fastify'
import {
  serializerCompiler,
  validatorCompiler,
  jsonSchemaTransform,
  type ZodTypeProvider,
} from 'fastify-type-provider-zod'
import { fastifySwagger } from '@fastify/swagger'
import { fastifyCors } from '@fastify/cors'
import { errorHandler } from './errors/handler'
import { registerRoutes } from './routes'

const app = fastify().withTypeProvider<ZodTypeProvider>()

app.setValidatorCompiler(validatorCompiler)
app.setSerializerCompiler(serializerCompiler)
app.setErrorHandler(errorHandler)

app.register(fastifyCors, {
  origin: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  // credentials: true
})

app.register(fastifySwagger, {
  openapi: {
    info: {
      title: 'Fastify API',
      description: 'API documentation for Fastify server',
      version: '1.0.0',
    },
  },
  transform: jsonSchemaTransform,
})

app.register(registerRoutes)

app.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  console.log('Server running on http://localhost:3333')
})
