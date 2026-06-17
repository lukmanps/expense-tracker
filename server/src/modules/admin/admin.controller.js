import * as adminService from './admin.service.js';
import { z } from 'zod';

const monthQuery = z.object({ month: z.string().optional() });
const numMonthsQuery = z.object({ months: z.coerce.number().int().min(1).max(12).default(6) });
const paginationQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().optional(),
  month: z.string().optional(),
  categoryId: z.string().optional(),
  source: z.string().optional(),
  type: z.string().optional(),
  status: z.string().optional(),
  recurring: z.coerce.boolean().optional(),
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
  const { month } = monthQuery.parse(request.query);
  const data = await adminService.getDashboardSummary(request.params.userId, month);
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
  const { month } = monthQuery.parse(request.query);
  const data = await adminService.getCategoryBreakdown(request.params.userId, month);
  return reply.send(data);
}

export async function userRecent(request, reply) {
  const { month } = monthQuery.parse(request.query);
  const limit = parseInt(request.query.limit) || 20;
  const result = await adminService.getRecentActivity(request.params.userId, limit, month);
  return reply.send({ data: result });
}

export async function userTopExpenses(request, reply) {
  const { month } = monthQuery.parse(request.query);
  const limit = parseInt(request.query.limit) || 5;
  const data = await adminService.getTopExpenses(request.params.userId, limit, month);
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
