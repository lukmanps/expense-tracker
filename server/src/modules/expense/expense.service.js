import prisma from '../../db/prisma.js';

export async function createExpense(userId, data) {
  return prisma.expense.create({
    data: { ...data, userId },
    include: { category: true },
  });
}

export async function getExpenses(userId, query) {
  const { page, limit, categoryId, startDate, endDate, search, recurring, month } = query;
  const where = { userId };

  if (categoryId) where.categoryId = categoryId;
  if (recurring !== undefined) where.recurring = recurring;
  
  if (month) {
    if (month === '3months') {
      const now = new Date();
      where.date = { gte: new Date(now.getFullYear(), now.getMonth() - 3, 1) };
    } else if (month === '6months') {
      const now = new Date();
      where.date = { gte: new Date(now.getFullYear(), now.getMonth() - 6, 1) };
    } else if (month === 'all') {
      // no date filter
    } else {
      const [y, m] = month.split('-').map(Number);
      where.date = { gte: new Date(y, m - 1, 1), lte: new Date(y, m, 0, 23, 59, 59) };
    }
  } else if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (search) {
    where.OR = [
      { notes: { contains: search, mode: 'insensitive' } },
      { category: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.expense.findMany({
      where,
      include: { category: true },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.expense.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getExpenseById(userId, id) {
  const expense = await prisma.expense.findFirst({
    where: { id, userId },
    include: { category: true },
  });
  if (!expense) {
    const error = new Error('Expense not found');
    error.statusCode = 404;
    throw error;
  }
  return expense;
}

export async function updateExpense(userId, id, data) {
  await getExpenseById(userId, id);
  return prisma.expense.update({
    where: { id },
    data,
    include: { category: true },
  });
}

export async function deleteExpense(userId, id) {
  await getExpenseById(userId, id);
  return prisma.expense.delete({ where: { id } });
}
