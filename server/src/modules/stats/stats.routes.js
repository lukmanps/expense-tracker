import * as statsController from './stats.controller.js';

export default async function statsRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/dashboard', statsController.dashboard);
  fastify.get('/weekly', statsController.weekly);
  fastify.get('/monthly', statsController.monthly);
  fastify.get('/categories', statsController.categoryBreakdown);
  fastify.get('/recent', statsController.recentActivity);
  fastify.get('/top-expenses', statsController.topExpenses);
  fastify.get('/export', statsController.exportData);
}
