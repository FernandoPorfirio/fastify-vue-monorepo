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

const port = Number(process.env.PORT) || 3333
const host = process.env.HOST || '0.0.0.0'

app.listen({ port, host }).then(() => {
  console.log(`Server running on http://${host}:${port}`)
})
