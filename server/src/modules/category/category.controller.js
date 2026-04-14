import { createCategorySchema, updateCategorySchema } from './category.schema.js';
import * as categoryService from './category.service.js';

export async function list(request, reply) {
  const type = request.query.type;
  const categories = await categoryService.getCategories(request.user.id, type);
  return reply.send({ categories });
}

export async function create(request, reply) {
  const data = createCategorySchema.parse(request.body);
  const category = await categoryService.createCategory(request.user.id, data);
  return reply.code(201).send({ category });
}

export async function update(request, reply) {
  const data = updateCategorySchema.parse(request.body);
  const category = await categoryService.updateCategory(request.user.id, request.params.id, data);
  return reply.send({ category });
}

export async function remove(request, reply) {
  await categoryService.deleteCategory(request.user.id, request.params.id);
  return reply.code(204).send();
}
