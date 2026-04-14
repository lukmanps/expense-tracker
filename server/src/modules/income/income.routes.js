import * as incomeController from './income.controller.js';

export default async function incomeRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/', incomeController.create);
  fastify.get('/', incomeController.list);
  fastify.get('/:id', incomeController.getById);
  fastify.patch('/:id', incomeController.update);
  fastify.delete('/:id', incomeController.remove);
}
