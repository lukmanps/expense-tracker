import prisma from '../../db/prisma.js';

export async function createTransaction(userId, data) {
  return prisma.transaction.create({
    data: { ...data, userId },
    include: { category: true },
  });
}

export async function getTransactions(userId, query) {
  const { page, limit, type, status, search } = query;
  const where = { userId };

  if (type) where.type = type;
  if (status) where.status = status;
  if (search) {
    where.name = { contains: search, mode: 'insensitive' };
  }

  const [items, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      include: { category: true },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return { items, total, page, limit, totalPages: Math.ceil(total / limit) };
}

export async function getTransactionById(userId, id) {
  const transaction = await prisma.transaction.findFirst({
    where: { id, userId },
    include: { category: true },
  });
  if (!transaction) {
    const error = new Error('Transaction not found');
    error.statusCode = 404;
    throw error;
  }
  return transaction;
}

export async function updateTransaction(userId, id, data) {
  const tx = await getTransactionById(userId, id);
  if (tx.status === 'completed') {
    const error = new Error('Cannot edit a completed bill');
    error.statusCode = 400;
    throw error;
  }
  return prisma.transaction.update({
    where: { id },
    data,
    include: { category: true },
  });
}

export async function toggleStatus(userId, id) {
  const tx = await getTransactionById(userId, id);
  const newStatus = tx.status === 'pending' ? 'completed' : 'pending';
  return prisma.transaction.update({
    where: { id },
    data: { status: newStatus },
    include: { category: true },
  });
}

/**
 * Complete a bill: mark as completed AND create the corresponding income/expense entry.
 * - to_pay   → creates an Expense (uses the bill's category if set)
 * - to_receive → creates an Income
 */
export async function completeBill(userId, id) {
  const tx = await getTransactionById(userId, id);

  if (tx.status === 'completed') {
    const error = new Error('Bill is already completed');
    error.statusCode = 400;
    throw error;
  }

  const result = await prisma.$transaction(async (prismaClient) => {
    const updatedTx = await prismaClient.transaction.update({
      where: { id },
      data: { status: 'completed' },
      include: { category: true },
    });

    if (tx.type === 'to_pay') {
      // Use the bill's category if set, otherwise fall back to "Bills" or "Other"
      let catId = tx.categoryId;
      if (!catId) {
        const fallback = await prismaClient.category.findFirst({
          where: {
            OR: [
              { name: 'Bills', isDefault: true },
              { name: 'Other', type: 'expense', isDefault: true },
            ],
          },
          orderBy: { name: 'asc' },
        });
        catId = fallback?.id;
      }

      await prismaClient.expense.create({
        data: {
          amount: tx.amount,
          categoryId: catId,
          date: new Date(),
          notes: `Bill paid: ${tx.name}`,
          userId,
        },
      });
    } else {
      // to_receive → Income
      // Use category name as source if available
      const source = tx.category?.name || 'Other Income';
      await prismaClient.income.create({
        data: {
          amount: tx.amount,
          source,
          date: new Date(),
          notes: `Bill received: ${tx.name}`,
          userId,
        },
      });
    }

    return updatedTx;
  });

  return result;
}

export async function deleteTransaction(userId, id) {
  await getTransactionById(userId, id);
  return prisma.transaction.delete({ where: { id } });
}
