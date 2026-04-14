import prisma from '../../db/prisma.js';

export async function getDashboardSummary(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const [totalIncome, totalExpense, pendingToReceive, pendingToPay] = await Promise.all([
    prisma.income.aggregate({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'to_receive', status: 'pending' },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, type: 'to_pay', status: 'pending' },
      _sum: { amount: true },
    }),
  ]);

  const income = totalIncome._sum.amount || 0;
  const expense = totalExpense._sum.amount || 0;

  return {
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense,
    pendingToReceive: pendingToReceive._sum.amount || 0,
    pendingToPay: pendingToPay._sum.amount || 0,
    month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
  };
}

export async function getWeeklySpending(userId) {
  const now = new Date();
  const days = [];

  for (let i = 6; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59);

    const result = await prisma.expense.aggregate({
      where: { userId, date: { gte: dayStart, lte: dayEnd } },
      _sum: { amount: true },
    });

    days.push({
      date: dayStart.toISOString().split('T')[0],
      day: dayStart.toLocaleDateString('en', { weekday: 'short' }),
      amount: result._sum.amount || 0,
    });
  }

  return days;
}

export async function getMonthlySummary(userId) {
  const now = new Date();
  const months = [];

  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);

    const [income, expense] = await Promise.all([
      prisma.income.aggregate({
        where: { userId, date: { gte: date, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.expense.aggregate({
        where: { userId, date: { gte: date, lte: endDate } },
        _sum: { amount: true },
      }),
    ]);

    months.push({
      month: date.toLocaleDateString('en', { month: 'short' }),
      year: date.getFullYear(),
      income: income._sum.amount || 0,
      expense: expense._sum.amount || 0,
    });
  }

  return months;
}

export async function getCategoryBreakdown(userId) {
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

  const expenses = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: { userId, date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { amount: true },
  });

  const categories = await prisma.category.findMany({
    where: { id: { in: expenses.map((e) => e.categoryId) } },
  });

  const categoryMap = Object.fromEntries(categories.map((c) => [c.id, c]));

  return expenses
    .map((e) => ({
      categoryId: e.categoryId,
      name: categoryMap[e.categoryId]?.name || 'Unknown',
      icon: categoryMap[e.categoryId]?.icon || 'circle',
      color: categoryMap[e.categoryId]?.color || '#78716C',
      amount: e._sum.amount || 0,
    }))
    .sort((a, b) => b.amount - a.amount);
}

export async function getRecentActivity(userId, limit = 10) {
  const [recentExpenses, recentIncomes] = await Promise.all([
    prisma.expense.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: limit,
    }),
    prisma.income.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
      take: limit,
    }),
  ]);

  const activities = [
    ...recentExpenses.map((e) => ({
      id: e.id,
      type: 'expense',
      amount: -e.amount,
      title: e.category.name,
      icon: e.category.icon,
      color: e.category.color,
      notes: e.notes,
      date: e.date,
    })),
    ...recentIncomes.map((i) => ({
      id: i.id,
      type: 'income',
      amount: i.amount,
      title: i.source,
      icon: 'banknote',
      color: '#22C55E',
      notes: i.notes,
      date: i.date,
    })),
  ].sort((a, b) => new Date(b.date) - new Date(a.date));

  return activities.slice(0, limit);
}

export async function exportCSV(userId) {
  const [expenses, incomes] = await Promise.all([
    prisma.expense.findMany({
      where: { userId },
      include: { category: true },
      orderBy: { date: 'desc' },
    }),
    prisma.income.findMany({
      where: { userId },
      orderBy: { date: 'desc' },
    }),
  ]);

  let csv = 'Type,Amount,Category/Source,Date,Notes\n';

  for (const e of expenses) {
    csv += `Expense,${e.amount},"${e.category.name}",${e.date.toISOString().split('T')[0]},"${e.notes || ''}"\n`;
  }
  for (const i of incomes) {
    csv += `Income,${i.amount},"${i.source}",${i.date.toISOString().split('T')[0]},"${i.notes || ''}"\n`;
  }

  return csv;
}
