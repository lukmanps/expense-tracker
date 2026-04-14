import * as expenseController from './expense.controller.js';

export default async function expenseRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/', expenseController.create);
  fastify.get('/', expenseController.list);
  fastify.get('/:id', expenseController.getById);
  fastify.patch('/:id', expenseController.update);
  fastify.delete('/:id', expenseController.remove);
}
