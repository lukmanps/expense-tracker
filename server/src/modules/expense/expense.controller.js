import { createExpenseSchema, updateExpenseSchema, expenseQuerySchema } from './expense.schema.js';
import * as expenseService from './expense.service.js';

export async function create(request, reply) {
  const data = createExpenseSchema.parse(request.body);
  const expense = await expenseService.createExpense(request.user.id, data);
  return reply.code(201).send({ expense });
}

export async function list(request, reply) {
  const query = expenseQuerySchema.parse(request.query);
  const result = await expenseService.getExpenses(request.user.id, query);
  return reply.send(result);
}

export async function getById(request, reply) {
  const expense = await expenseService.getExpenseById(request.user.id, request.params.id);
  return reply.send({ expense });
}

export async function update(request, reply) {
  const data = updateExpenseSchema.parse(request.body);
  const expense = await expenseService.updateExpense(request.user.id, request.params.id, data);
  return reply.send({ expense });
}

export async function remove(request, reply) {
  await expenseService.deleteExpense(request.user.id, request.params.id);
  return reply.code(204).send();
}
