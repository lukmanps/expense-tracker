import prisma from '../../db/prisma.js';

export async function createIncome(userId, data) {
  return prisma.income.create({
    data: { ...data, userId },
  });
}

export async function getIncomes(userId, query) {
  const { page, limit, source, startDate, endDate, search } = query;
  const where = { userId };

  if (source) where.source = source;
  if (startDate || endDate) {
    where.date = {};
    if (startDate) where.date.gte = new Date(startDate);
    if (endDate) where.date.lte = new Date(endDate);
  }
  if (search) {
    where.OR = [
      { source: { contains: search, mode: 'insensitive' } },
      { notes: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.income.findMany({
      where,
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.income.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getIncomeById(userId, id) {
  const income = await prisma.income.findFirst({ where: { id, userId } });
  if (!income) {
    const error = new Error('Income not found');
    error.statusCode = 404;
    throw error;
  }
  return income;
}

export async function updateIncome(userId, id, data) {
  await getIncomeById(userId, id);
  return prisma.income.update({ where: { id }, data });
}

export async function deleteIncome(userId, id) {
  await getIncomeById(userId, id);
  return prisma.income.delete({ where: { id } });
}
