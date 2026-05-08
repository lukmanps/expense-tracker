import prisma from '../../db/prisma.js';

export async function getDashboardSummary(userId, month) {
  let startOfMonth, endOfMonth, monthLabel;
  if (month === '3months') {
    const now = new Date();
    startOfMonth = new Date(now.getFullYear(), now.getMonth() - 3, 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    monthLabel = 'Last 3 Months';
  } else if (month === '6months') {
    const now = new Date();
    startOfMonth = new Date(now.getFullYear(), now.getMonth() - 6, 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    monthLabel = 'Last 6 Months';
  } else if (month === 'all') {
    startOfMonth = new Date(2000, 0, 1);
    endOfMonth = new Date(2100, 0, 1);
    monthLabel = 'All Time';
  } else if (month) {
    const [y, m] = month.split('-').map(Number);
    startOfMonth = new Date(y, m - 1, 1);
    endOfMonth = new Date(y, m, 0, 23, 59, 59);
    monthLabel = startOfMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  } else {
    const now = new Date();
    startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    monthLabel = now.toLocaleString('default', { month: 'long', year: 'numeric' });
  }

  const [allIncome, allExpense, monthIncome, monthExpense, pendingToReceive, pendingToPay] = await Promise.all([
    prisma.income.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
    prisma.expense.aggregate({
      where: { userId },
      _sum: { amount: true },
    }),
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

  const totalAllIncome = allIncome._sum.amount || 0;
  const totalAllExpense = allExpense._sum.amount || 0;
  const mIncome = monthIncome._sum.amount || 0;
  const mExpense = monthExpense._sum.amount || 0;

  return {
    totalIncome: totalAllIncome,
    totalExpense: totalAllExpense,
    balance: totalAllIncome - totalAllExpense,
    monthIncome: mIncome,
    monthExpense: mExpense,
    monthBalance: mIncome - mExpense,
    pendingToReceive: pendingToReceive._sum.amount || 0,
    pendingToPay: pendingToPay._sum.amount || 0,
    month: monthLabel,
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

export async function getLastWeeklySpending(userId) {
  const now = new Date();
  const days = [];

  for (let i = 13; i >= 7; i--) {
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

export async function getMonthlySummary(userId, numMonths = 6) {
  const now = new Date();
  const count = Math.min(Math.max(parseInt(numMonths) || 6, 1), 12);
  const queries = [];

  for (let i = count - 1; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const endDate = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59);
    queries.push(
      Promise.all([
        prisma.income.aggregate({ where: { userId, date: { gte: date, lte: endDate } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId, date: { gte: date, lte: endDate } }, _sum: { amount: true } }),
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

export async function getMonthWeekly(userId, monthStr) {
  if (monthStr === '3months') return getMonthlySummary(userId, 3);
  if (monthStr === '6months') return getMonthlySummary(userId, 6);
  if (monthStr === 'all') return getMonthlySummary(userId, 12);

  let year, month;
  if (monthStr) {
    [year, month] = monthStr.split('-').map(Number);
    month -= 1; // JS months are 0-indexed
  } else {
    const now = new Date();
    year = now.getFullYear();
    month = now.getMonth();
  }
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [
    { label: 'Week 1', start: 1, end: 7 },
    { label: 'Week 2', start: 8, end: 14 },
    { label: 'Week 3', start: 15, end: 21 },
    { label: 'Week 4', start: 22, end: daysInMonth },
  ];

  return Promise.all(
    weeks.map(({ label, start, end }) => {
      const startDate = new Date(year, month, start);
      const endDate = new Date(year, month, end, 23, 59, 59);
      return Promise.all([
        prisma.income.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
      ]).then(([income, expense]) => ({
        month: label,
        income: income._sum.amount || 0,
        expense: expense._sum.amount || 0,
      }));
    })
  );
}

export async function getLastMonthWeekly(userId) {
  const now = new Date();
  const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
  const month = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const weeks = [
    { label: 'Week 1', start: 1, end: 7 },
    { label: 'Week 2', start: 8, end: 14 },
    { label: 'Week 3', start: 15, end: 21 },
    { label: 'Week 4', start: 22, end: daysInMonth },
  ];

  return Promise.all(
    weeks.map(({ label, start, end }) => {
      const startDate = new Date(year, month, start);
      const endDate = new Date(year, month, end, 23, 59, 59);
      return Promise.all([
        prisma.income.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
        prisma.expense.aggregate({ where: { userId, date: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
      ]).then(([income, expense]) => ({
        month: label,
        income: income._sum.amount || 0,
        expense: expense._sum.amount || 0,
      }));
    })
  );
}

export async function getCategoryBreakdown(userId, monthStr) {
  let dateFilter = {};
  if (monthStr === '3months') {
    const now = new Date();
    dateFilter = { date: { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) } };
  } else if (monthStr === '6months') {
    const now = new Date();
    dateFilter = { date: { gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) } };
  } else if (monthStr === 'all') {
    dateFilter = {};
  } else if (monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    dateFilter = { date: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) } };
  } else {
    const now = new Date();
    dateFilter = { date: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) } };
  }

  const expenses = await prisma.expense.groupBy({
    by: ['categoryId'],
    where: { userId, ...dateFilter },
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

export async function getRecentActivity(userId, limit = 10, month) {
  let dateFilter = {};
  if (month) {
    const [y, m] = month.split('-').map(Number);
    dateFilter = { date: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) } };
  }

  const [recentExpenses, recentIncomes] = await Promise.all([
    prisma.expense.findMany({
      where: { userId, ...dateFilter },
      include: { category: true },
      orderBy: { date: 'desc' },
      take: limit,
    }),
    prisma.income.findMany({
      where: { userId, ...dateFilter },
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

export async function getTopExpenses(userId, limit = 5, monthStr) {
  let dateFilter = {};
  if (monthStr === '3months') {
    const now = new Date();
    dateFilter = { date: { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) } };
  } else if (monthStr === '6months') {
    const now = new Date();
    dateFilter = { date: { gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) } };
  } else if (monthStr === 'all') {
    dateFilter = {};
  } else if (monthStr) {
    const [y, m] = monthStr.split('-').map(Number);
    dateFilter = { date: { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) } };
  } else {
    const now = new Date();
    dateFilter = { date: { gte: new Date(now.getFullYear(), now.getMonth(), 1), lte: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59) } };
  }

  const expenses = await prisma.expense.findMany({
    where: { userId, ...dateFilter },
    include: { category: true },
    orderBy: { amount: 'desc' },
    take: limit,
  });

  return expenses.map((e) => ({
    id: e.id,
    amount: e.amount,
    name: e.notes || e.category.name,
    categoryName: e.category.name,
    icon: e.category.icon,
    color: e.category.color,
    date: e.date,
  }));
}
