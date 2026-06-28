import * as adminService from './admin.service.js';
import { z } from 'zod';

const monthQuery = z.object({
  month: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional()
});
const numMonthsQuery = z.object({ months: z.coerce.number().int().min(1).max(12).default(6) });
const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  month: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  categoryId: z.string().optional(),
  source: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  recurring: z.coerce.boolean().optional(),
});

const createExpenseSchema = z.object({
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  date: z.string(),
  notes: z.string().max(500).optional().nullable(),
  recurring: z.boolean().optional().default(false),
});

const createIncomeSchema = z.object({
  amount: z.number().positive(),
  source: z.string().min(1).max(100),
  date: z.string(),
  notes: z.string().max(500).optional().nullable(),
});

const createTransactionSchema = z.object({
  name: z.string().min(1).max(200),
  amount: z.number().positive(),
  type: z.enum(['to_pay', 'to_receive']),
  dueDate: z.string().optional().nullable(),
  notes: z.string().max(500).optional().nullable(),
  categoryId: z.string().optional().nullable(),
});

const createCategorySchema = z.object({
  name: z.string().min(1).max(100),
  icon: z.string().min(1).max(50),
  color: z.string().min(1).max(50),
  type: z.enum(['income', 'expense']),
});

export async function listUsers(request, reply) {
  const users = await adminService.getAllUsers();
  return reply.send({ users });
}

export async function getUser(request, reply) {
  const user = await adminService.getUserById(request.params.userId);
  if (!user) return reply.code(404).send({ error: 'User not found' });
  return reply.send({ user });
}

export async function overview(request, reply) {
  const { month } = monthQuery.parse(request.query);
  const data = await adminService.getOverview(month);
  return reply.send(data);
}

export async function overviewMonthly(request, reply) {
  const { months } = numMonthsQuery.parse(request.query);
  const data = await adminService.getOverviewMonthly(months);
  return reply.send(data);
}

export async function userSummary(request, reply) {
  const { month, startDate, endDate } = monthQuery.parse(request.query);
  const data = await adminService.getDashboardSummary(request.params.userId, month, startDate, endDate);
  return reply.send(data);
}

export async function userExpenses(request, reply) {
  const query = paginationQuery.parse(request.query);
  const data = await adminService.getExpenses(request.params.userId, query);
  return reply.send(data);
}

export async function userIncomes(request, reply) {
  const query = paginationQuery.parse(request.query);
  const data = await adminService.getIncomes(request.params.userId, query);
  return reply.send(data);
}

export async function userTransactions(request, reply) {
  const query = paginationQuery.parse(request.query);
  const data = await adminService.getTransactions(request.params.userId, query);
  return reply.send(data);
}

export async function userMonthly(request, reply) {
  const { months } = numMonthsQuery.parse(request.query);
  const data = await adminService.getMonthlySummary(request.params.userId, months);
  return reply.send(data);
}

export async function userCategories(request, reply) {
  const { month, startDate, endDate } = monthQuery.parse(request.query);
  const data = await adminService.getCategoryBreakdown(request.params.userId, month, startDate, endDate);
  return reply.send(data);
}

export async function userRecent(request, reply) {
  const { month, startDate, endDate } = monthQuery.parse(request.query);
  const type = request.query.type;
  const limit = parseInt(request.query.limit) || 20;
  const result = await adminService.getRecentActivity(request.params.userId, limit, month, startDate, endDate, type);
  return reply.send({ data: result });
}

export async function userTopExpenses(request, reply) {
  const { month, startDate, endDate } = monthQuery.parse(request.query);
  const limit = parseInt(request.query.limit) || 5;
  const data = await adminService.getTopExpenses(request.params.userId, limit, month, startDate, endDate);
  return reply.send(data);
}

export async function userWeekly(request, reply) {
  const data = await adminService.getWeeklySpending(request.params.userId);
  return reply.send(data);
}

export async function userCategoriesList(request, reply) {
  const data = await adminService.getUserCategories(request.params.userId);
  return reply.send({ categories: data });
}

// ── Admin Mutations ────────────────────────────────────────────────────────────

export async function createUserExpense(request, reply) {
  const data = createExpenseSchema.parse(request.body);
  const expense = await adminService.adminCreateExpense(request.params.userId, data);
  return reply.code(201).send({ expense });
}

export async function updateUserExpense(request, reply) {
  const data = createExpenseSchema.partial().parse(request.body);
  const expense = await adminService.adminUpdateExpense(request.params.userId, request.params.id, data);
  return reply.send({ expense });
}

export async function deleteUserExpense(request, reply) {
  await adminService.adminDeleteExpense(request.params.userId, request.params.id);
  return reply.code(204).send();
}

export async function createUserIncome(request, reply) {
  const data = createIncomeSchema.parse(request.body);
  const income = await adminService.adminCreateIncome(request.params.userId, data);
  return reply.code(201).send({ income });
}

export async function updateUserIncome(request, reply) {
  const data = createIncomeSchema.partial().parse(request.body);
  const income = await adminService.adminUpdateIncome(request.params.userId, request.params.id, data);
  return reply.send({ income });
}

export async function deleteUserIncome(request, reply) {
  await adminService.adminDeleteIncome(request.params.userId, request.params.id);
  return reply.code(204).send();
}

export async function createUserTransaction(request, reply) {
  const data = createTransactionSchema.parse(request.body);
  const transaction = await adminService.adminCreateTransaction(request.params.userId, data);
  return reply.code(201).send({ transaction });
}

export async function updateUserTransaction(request, reply) {
  const data = createTransactionSchema.partial().parse(request.body);
  const transaction = await adminService.adminUpdateTransaction(request.params.userId, request.params.id, data);
  return reply.send({ transaction });
}

export async function deleteUserTransaction(request, reply) {
  await adminService.adminDeleteTransaction(request.params.userId, request.params.id);
  return reply.code(204).send();
}

export async function completeUserTransaction(request, reply) {
  const transaction = await adminService.adminCompleteTransaction(request.params.userId, request.params.id);
  return reply.send({ transaction });
}

export async function createUserCategory(request, reply) {
  const data = createCategorySchema.parse(request.body);
  const category = await adminService.adminCreateCategory(request.params.userId, data);
  return reply.code(201).send({ category });
}

export async function updateUserCategory(request, reply) {
  const data = createCategorySchema.partial().parse(request.body);
  const category = await adminService.adminUpdateCategory(request.params.userId, request.params.id, data);
  return reply.send({ category });
}

export async function deleteUserCategory(request, reply) {
  await adminService.adminDeleteCategory(request.params.userId, request.params.id);
  return reply.code(204).send();
}
