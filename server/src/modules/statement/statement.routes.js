import * as statementController from './statement.controller.js';

export default async function statementRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/process', statementController.processFile);
  fastify.post('/confirm', statementController.confirmTransactions);
}
