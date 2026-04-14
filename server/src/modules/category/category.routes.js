import * as categoryController from './category.controller.js';

export default async function categoryRoutes(fastify) {
  fastify.addHook('preHandler', fastify.authenticate);

  fastify.get('/', categoryController.list);
  fastify.post('/', categoryController.create);
  fastify.patch('/:id', categoryController.update);
  fastify.delete('/:id', categoryController.remove);
}
