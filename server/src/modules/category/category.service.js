import prisma from '../../db/prisma.js';

export async function getCategories(userId, type) {
  const where = {
    OR: [{ isDefault: true }, { userId }],
  };
  if (type) where.type = type;

  return prisma.category.findMany({
    where,
    orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
  });
}

export async function createCategory(userId, data) {
  return prisma.category.create({
    data: { ...data, userId },
  });
}

export async function updateCategory(userId, id, data) {
  const category = await prisma.category.findFirst({
    where: { id, userId, isDefault: false },
  });
  if (!category) {
    const error = new Error('Category not found or cannot be edited');
    error.statusCode = 404;
    throw error;
  }
  return prisma.category.update({ where: { id }, data });
}

export async function deleteCategory(userId, id) {
  const category = await prisma.category.findFirst({
    where: { id, userId, isDefault: false },
  });
  if (!category) {
    const error = new Error('Category not found or cannot be deleted');
    error.statusCode = 404;
    throw error;
  }
  return prisma.category.delete({ where: { id } });
}
