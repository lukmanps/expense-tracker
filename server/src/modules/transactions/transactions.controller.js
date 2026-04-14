import { createTransactionSchema, updateTransactionSchema, transactionQuerySchema } from './transactions.schema.js';
import * as transactionService from './transactions.service.js';

export async function create(request, reply) {
  const data = createTransactionSchema.parse(request.body);
  const transaction = await transactionService.createTransaction(request.user.id, data);
  return reply.code(201).send({ transaction });
}

export async function list(request, reply) {
  const query = transactionQuerySchema.parse(request.query);
  const result = await transactionService.getTransactions(request.user.id, query);
  return reply.send(result);
}

export async function getById(request, reply) {
  const transaction = await transactionService.getTransactionById(request.user.id, request.params.id);
  return reply.send({ transaction });
}

export async function update(request, reply) {
  const data = updateTransactionSchema.parse(request.body);
  const transaction = await transactionService.updateTransaction(request.user.id, request.params.id, data);
  return reply.send({ transaction });
}

export async function toggle(request, reply) {
  const transaction = await transactionService.toggleStatus(request.user.id, request.params.id);
  return reply.send({ transaction });
}

export async function complete(request, reply) {
  const transaction = await transactionService.completeBill(request.user.id, request.params.id);
  return reply.send({ transaction });
}

export async function remove(request, reply) {
  await transactionService.deleteTransaction(request.user.id, request.params.id);
  return reply.code(204).send();
}
