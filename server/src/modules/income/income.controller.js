import { createIncomeSchema, updateIncomeSchema, incomeQuerySchema } from './income.schema.js';
import * as incomeService from './income.service.js';

export async function create(request, reply) {
  const data = createIncomeSchema.parse(request.body);
  const income = await incomeService.createIncome(request.user.id, data);
  return reply.code(201).send({ income });
}

export async function list(request, reply) {
  const query = incomeQuerySchema.parse(request.query);
  const result = await incomeService.getIncomes(request.user.id, query);
  return reply.send(result);
}

export async function getById(request, reply) {
  const income = await incomeService.getIncomeById(request.user.id, request.params.id);
  return reply.send({ income });
}

export async function update(request, reply) {
  const data = updateIncomeSchema.parse(request.body);
  const income = await incomeService.updateIncome(request.user.id, request.params.id, data);
  return reply.send({ income });
}

export async function remove(request, reply) {
  await incomeService.deleteIncome(request.user.id, request.params.id);
  return reply.code(204).send();
}
