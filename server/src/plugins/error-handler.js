import fp from 'fastify-plugin';

async function errorHandler(fastify) {
  fastify.setErrorHandler((error, request, reply) => {
    const statusCode = error.statusCode || 500;

    // Zod validation errors
    if (error.name === 'ZodError') {
      return reply.code(400).send({
        error: 'Validation Error',
        message: 'Invalid request data',
        details: error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      });
    }

    // Prisma errors
    if (error.code === 'P2002') {
      return reply.code(409).send({
        error: 'Conflict',
        message: 'A record with this data already exists',
      });
    }
    if (error.code === 'P2025') {
      return reply.code(404).send({
        error: 'Not Found',
        message: 'Record not found',
      });
    }

    // Log server errors
    if (statusCode >= 500) {
      request.log.error(error);
    }

    reply.code(statusCode).send({
      error: error.name || 'Error',
      message: statusCode >= 500 ? 'Internal server error' : error.message,
    });
  });
}

export default fp(errorHandler, { name: 'error-handler' });
