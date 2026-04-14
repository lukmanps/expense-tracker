import bcrypt from 'bcryptjs';
import prisma from '../../db/prisma.js';

export async function createUser({ phone, name, password, email }) {
  const existing = await prisma.user.findUnique({ where: { phone } });
  if (existing) {
    const error = new Error('Phone number already registered');
    error.statusCode = 409;
    throw error;
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { phone, name, password: hashedPassword, email },
    select: { id: true, phone: true, name: true, email: true, avatar: true, createdAt: true },
  });
  return user;
}

export async function verifyUser({ phone, password }) {
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    const error = new Error('Invalid phone number or password');
    error.statusCode = 401;
    throw error;
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const error = new Error('Invalid phone number or password');
    error.statusCode = 401;
    throw error;
  }

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserById(id) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { id: true, phone: true, name: true, email: true, avatar: true, createdAt: true },
  });
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }
  return user;
}

export async function updateUser(id, data) {
  return prisma.user.update({
    where: { id },
    data,
    select: { id: true, phone: true, name: true, email: true, avatar: true, createdAt: true },
  });
}
