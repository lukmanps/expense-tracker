import * as statsService from './stats.service.js';

export async function dashboard(request, reply) {
  const { month } = request.query;
  const summary = await statsService.getDashboardSummary(request.user.id, month);
  return reply.send(summary);
}

export async function weekly(request, reply) {
  const data = await statsService.getWeeklySpending(request.user.id);
  return reply.send({ data });
}

export async function lastWeekly(request, reply) {
  const data = await statsService.getLastWeeklySpending(request.user.id);
  return reply.send({ data });
}

export async function monthly(request, reply) {
  const months = parseInt(request.query.months) || 6;
  const data = await statsService.getMonthlySummary(request.user.id, months);
  return reply.send({ data });
}

export async function monthlyWeekly(request, reply) {
  const { month } = request.query;
  const data = await statsService.getMonthWeekly(request.user.id, month);
  return reply.send({ data });
}

export async function lastMonthWeekly(request, reply) {
  const data = await statsService.getLastMonthWeekly(request.user.id);
  return reply.send({ data });
}

export async function categoryBreakdown(request, reply) {
  const { month } = request.query;
  const data = await statsService.getCategoryBreakdown(request.user.id, month);
  return reply.send({ data });
}

export async function recentActivity(request, reply) {
  const limit = parseInt(request.query.limit) || 10;
  const { month } = request.query;
  const data = await statsService.getRecentActivity(request.user.id, limit, month);
  return reply.send({ data });
}

export async function exportData(request, reply) {
  const csv = await statsService.exportCSV(request.user.id);
  reply.header('Content-Type', 'text/csv');
  reply.header('Content-Disposition', 'attachment; filename="expense-tracker-export.csv"');
  return reply.send(csv);
}

export async function topExpenses(request, reply) {
  const limit = parseInt(request.query.limit) || 5;
  const { month } = request.query;
  const data = await statsService.getTopExpenses(request.user.id, limit, month);
  return reply.send({ data });
}
