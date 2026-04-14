import * as authController from './auth.controller.js';

export default async function authRoutes(fastify) {
  fastify.post('/register', authController.register);
  fastify.post('/login', authController.login);
  fastify.get('/me', { preHandler: [fastify.authenticate] }, authController.getMe);
  fastify.patch('/profile', { preHandler: [fastify.authenticate] }, authController.updateProfile);
}
