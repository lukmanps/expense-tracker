import fp from 'fastify-plugin';

async function adminAuthPlugin(fastify) {
  fastify.decorate('adminOnly', async function (request, reply) {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized', message: 'Invalid or expired token' });
    }

    const adminId = process.env.ADMIN_USER_ID;
    if (!adminId) {
      return reply.code(403).send({ error: 'Forbidden', message: 'Admin not configured' });
    }
    if (request.user.id !== adminId) {
      return reply.code(403).send({ error: 'Forbidden', message: 'Admin access required' });
    }
  });
}

export default fp(adminAuthPlugin, { name: 'admin-auth-plugin' });
