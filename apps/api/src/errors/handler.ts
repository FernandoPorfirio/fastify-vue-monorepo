import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify'

export async function errorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply
) {
  // Fastify validation errors
  if (error.validation) {
    return reply.status(400).send({
      statusCode: 400,
      error: 'Validation Error',
      message: error.message,
      validation: error.validation,
    })
  }

  // HTTP errors with statusCode
  if (error.statusCode && error.statusCode < 500) {
    return reply.status(error.statusCode).send({
      statusCode: error.statusCode,
      error: error.name,
      message: error.message,
    })
  }

  // Log server errors
  request.log.error(error)

  // Internal server errors
  return reply.status(500).send({
    statusCode: 500,
    error: 'Internal Server Error',
    message: 'An unexpected error occurred',
  })
}
