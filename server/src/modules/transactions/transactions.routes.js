import * as txController from './transactions.controller.js';

export default async function transactionRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.post('/', txController.create);
  fastify.get('/', txController.list);
  fastify.get('/:id', txController.getById);
  fastify.patch('/:id', txController.update);
  fastify.patch('/:id/toggle', txController.toggle);
  fastify.patch('/:id/complete', txController.complete);
  fastify.delete('/:id', txController.remove);
}
