import prisma from '../../db/prisma.js';
import { getDashboardSummary, getMonthlySummary, getCategoryBreakdown, getRecentActivity, getTopExpenses, getWeeklySpending } from '../stats/stats.service.js';
import { getExpenses, createExpense, updateExpense, deleteExpense } from '../expense/expense.service.js';
import { getIncomes, createIncome, updateIncome, deleteIncome } from '../income/income.service.js';
import { getTransactions, createTransaction, updateTransaction, deleteTransaction, completeBill } from '../transactions/transactions.service.js';

export async function getAllUsers() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, phone: true, email: true, avatar: true, createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Attach aggregate totals to each user
  const usersWithTotals = await Promise.all(
    users.map(async (user) => {
      const [incomeAgg, expenseAgg, pendingToPay, pendingToReceive] = await Promise.all([
        prisma.income.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId: user.id }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { userId: user.id, type: 'to_pay', status: 'pending' }, _sum: { amount: true } }),
        prisma.transaction.aggregate({ where: { userId: user.id, type: 'to_receive', status: 'pending' }, _sum: { amount: true } }),
      ]);
      const totalIncome = incomeAgg._sum.amount || 0;
      const totalExpense = expenseAgg._sum.amount || 0;
      return {
        ...user,
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        pendingToPay: pendingToPay._sum.amount || 0,
        pendingToReceive: pendingToReceive._sum.amount || 0,
      };
    })
  );

  return usersWithTotals;
}

export async function getOverview(month) {
  const users = await prisma.user.findMany({ select: { id: true } });
  const userIds = users.map((u) => u.id);

  let dateFilter = {};
  if (month && month !== 'all') {
    const [y, m] = month.split('-').map(Number);
    dateFilter = { date: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) } };
  }

  const [totalIncome, totalExpense, monthIncome, monthExpense] = await Promise.all([
    prisma.income.aggregate({ where: { userId: { in: userIds } }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { userId: { in: userIds } }, _sum: { amount: true } }),
    prisma.income.aggregate({ where: { userId: { in: userIds }, ...dateFilter }, _sum: { amount: true } }),
    prisma.expense.aggregate({ where: { userId: { in: userIds }, ...dateFilter }, _sum: { amount: true } }),
  ]);

  return {
    totalIncome: totalIncome._sum.amount || 0,
    totalExpense: totalExpense._sum.amount || 0,
    balance: (totalIncome._sum.amount || 0) - (totalExpense._sum.amount || 0),
    monthIncome: monthIncome._sum.amount || 0,
    monthExpense: monthExpense._sum.amount || 0,
    monthBalance: (monthIncome._sum.amount || 0) - (monthExpense._sum.amount || 0),
    userCount: users.length,
  };
}

export async function getOverviewMonthly(numMonths = 6) {
  const users = await prisma.user.findMany({ select: { id: true } });
  const userIds = users.map((u) => u.id);
  const now = new Date();
  const count = Math.min(Math.max(parseInt(numMonths) || 6, 1), 12);
  const queries = [];

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    queries.push(
      Promise.all([
        prisma.income.aggregate({ where: { userId: { in: userIds }, date: { gte: date, lte: endDate } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId: { in: userIds }, date: { gte: date, lte: endDate } }, _sum: { amount: true } }),
      ]).then(([income, expense]) => ({
        month: date.toLocaleDateString('en', { month: 'short' }),
        year: date.getFullYear(),
        income: income._sum.amount || 0,
        expense: expense._sum.amount || 0,
      }))
    );
  }

  return Promise.all(queries);
}

// Re-export read delegates
export { getDashboardSummary, getMonthlySummary, getCategoryBreakdown, getRecentActivity, getTopExpenses, getWeeklySpending, getExpenses, getIncomes, getTransactions };

export async function getUserById(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, phone: true, email: true, avatar: true, createdAt: true },
  });
}

export async function getUserCategories(userId) {
  return prisma.category.findMany({
    where: { OR: [{ userId }, { isDefault: true }] },
    orderBy: { name: 'asc' },
  });
}

// ── Admin Mutations ────────────────────────────────────────────────────────────

export async function adminCreateExpense(userId, data) {
  return createExpense(userId, { ...data, date: new Date(data.date) });
}

export async function adminUpdateExpense(userId, id, data) {
  const parsed = { ...data };
  if (parsed.date) parsed.date = new Date(parsed.date);
  return updateExpense(userId, id, parsed);
}

export async function adminDeleteExpense(userId, id) {
  return deleteExpense(userId, id);
}

export async function adminCreateIncome(userId, data) {
  return createIncome(userId, { ...data, date: new Date(data.date) });
}

export async function adminUpdateIncome(userId, id, data) {
  const parsed = { ...data };
  if (parsed.date) parsed.date = new Date(parsed.date);
  return updateIncome(userId, id, parsed);
}

export async function adminDeleteIncome(userId, id) {
  return deleteIncome(userId, id);
}

export async function adminCreateTransaction(userId, data) {
  const parsed = { ...data };
  if (parsed.dueDate) parsed.dueDate = new Date(parsed.dueDate);
  return createTransaction(userId, parsed);
}

export async function adminUpdateTransaction(userId, id, data) {
  const parsed = { ...data };
  if (parsed.dueDate) parsed.dueDate = new Date(parsed.dueDate);
  return updateTransaction(userId, id, parsed);
}

export async function adminDeleteTransaction(userId, id) {
  return deleteTransaction(userId, id);
}

export async function adminCompleteTransaction(userId, id) {
  return completeBill(userId, id);
}
