import * as statsService from './stats.service.js';

export async function dashboard(request, reply) {
  const summary = await statsService.getDashboardSummary(request.user.id);
  return reply.send(summary);
}

export async function weekly(request, reply) {
  const data = await statsService.getWeeklySpending(request.user.id);
  return reply.send({ data });
}

export async function monthly(request, reply) {
  const data = await statsService.getMonthlySummary(request.user.id);
  return reply.send({ data });
}

export async function categoryBreakdown(request, reply) {
  const data = await statsService.getCategoryBreakdown(request.user.id);
  return reply.send({ data });
}

export async function recentActivity(request, reply) {
  const limit = parseInt(request.query.limit) || 10;
  const data = await statsService.getRecentActivity(request.user.id, limit);
  return reply.send({ data });
}

export async function exportData(request, reply) {
  const csv = await statsService.exportCSV(request.user.id);
  reply.header('Content-Type', 'text/csv');
  reply.header('Content-Disposition', 'attachment; filename="expense-tracker-export.csv"');
  return reply.send(csv);
}
