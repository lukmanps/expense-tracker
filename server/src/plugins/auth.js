import fp from 'fastify-plugin';
import fjwt from '@fastify/jwt';

async function authPlugin(fastify) {
  fastify.register(fjwt, {
    secret: process.env.JWT_SECRET || 'supersecret',
    sign: {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    },
  });

  // Decorate with authenticate method
  fastify.decorate('authenticate', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }
  });
}

export default fp(authPlugin, { name: 'auth-plugin' });
