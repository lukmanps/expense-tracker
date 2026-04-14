import prisma from './prisma.js';
import bcrypt from 'bcryptjs';

const DEFAULT_CATEGORIES = [
  { name: 'Food', icon: 'utensils', color: '#C8E972', type: 'expense' },
  { name: 'Transport', icon: 'car', color: '#94A3B8', type: 'expense' },
  { name: 'Shopping', icon: 'shopping-bag', color: '#F59E0B', type: 'expense' },
  { name: 'Home', icon: 'home', color: '#6366F1', type: 'expense' },
  { name: 'Bills', icon: 'receipt', color: '#EF4444', type: 'expense' },
  { name: 'Entertainment', icon: 'film', color: '#EC4899', type: 'expense' },
  { name: 'Health', icon: 'heart', color: '#F43F5E', type: 'expense' },
  { name: 'Education', icon: 'book-open', color: '#3B82F6', type: 'expense' },
  { name: 'Travel', icon: 'plane', color: '#14B8A6', type: 'expense' },
  { name: 'Other', icon: 'more-horizontal', color: '#78716C', type: 'expense' },
  { name: 'Salary', icon: 'banknote', color: '#22C55E', type: 'income' },
  { name: 'Freelance', icon: 'laptop', color: '#8B5CF6', type: 'income' },
  { name: 'Gift', icon: 'gift', color: '#F97316', type: 'income' },
  { name: 'Investment', icon: 'trending-up', color: '#06B6D4', type: 'income' },
  { name: 'Other Income', icon: 'plus-circle', color: '#78716C', type: 'income' },
];

async function seed() {
  console.log('🌱 Seeding database...');

  // Create default categories
  for (const cat of DEFAULT_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.name.toLowerCase().replace(/\s+/g, '-') + '-default' },
      update: {},
      create: {
        id: cat.name.toLowerCase().replace(/\s+/g, '-') + '-default',
        ...cat,
        isDefault: true,
      },
    });
  }
  console.log(`✅ Created ${DEFAULT_CATEGORIES.length} default categories`);

  // Create demo user
  const hashedPassword = await bcrypt.hash('demo1234', 10);
  const user = await prisma.user.upsert({
    where: { phone: '+1234567890' },
    update: {},
    create: {
      phone: '+1234567890',
      email: 'demo@example.com',
      name: 'Demo User',
      password: hashedPassword,
    },
  });
  console.log(`✅ Created demo user: ${user.phone}`);

  // Create sample incomes
  const incomes = [
    { amount: 5000, source: 'Salary', date: new Date('2026-04-01'), notes: 'Monthly salary', userId: user.id },
    { amount: 1200, source: 'Freelance', date: new Date('2026-04-05'), notes: 'Web project', userId: user.id },
    { amount: 300, source: 'Gift', date: new Date('2026-04-10'), notes: 'Birthday gift', userId: user.id },
  ];
  for (const income of incomes) {
    await prisma.income.create({ data: income });
  }
  console.log(`✅ Created ${incomes.length} sample incomes`);

  // Create sample expenses
  const expenses = [
    { amount: 45.50, categoryId: 'food-default', date: new Date('2026-04-02'), notes: 'Groceries', userId: user.id },
    { amount: 12.00, categoryId: 'transport-default', date: new Date('2026-04-03'), notes: 'Uber ride', userId: user.id },
    { amount: 89.99, categoryId: 'shopping-default', date: new Date('2026-04-04'), notes: 'New shirt', userId: user.id },
    { amount: 150.00, categoryId: 'bills-default', date: new Date('2026-04-05'), notes: 'Electric bill', userId: user.id },
    { amount: 25.00, categoryId: 'entertainment-default', date: new Date('2026-04-06'), notes: 'Movie tickets', userId: user.id },
    { amount: 35.00, categoryId: 'food-default', date: new Date('2026-04-07'), notes: 'Restaurant dinner', userId: user.id },
    { amount: 200.00, categoryId: 'health-default', date: new Date('2026-04-08'), notes: 'Doctor visit', userId: user.id },
    { amount: 15.99, categoryId: 'entertainment-default', date: new Date('2026-04-09'), notes: 'Netflix', recurring: true, userId: user.id },
  ];
  for (const expense of expenses) {
    await prisma.expense.create({ data: expense });
  }
  console.log(`✅ Created ${expenses.length} sample expenses`);

  // Create sample transactions
  const transactions = [
    { type: 'to_receive', name: 'Mikel Borle', amount: 350, dueDate: new Date('2026-04-20'), status: 'pending', userId: user.id },
    { type: 'to_pay', name: 'John Doe', amount: 120, dueDate: new Date('2026-04-15'), status: 'pending', userId: user.id },
    { type: 'to_receive', name: 'Sarah Khan', amount: 75, dueDate: new Date('2026-04-25'), status: 'completed', userId: user.id },
    { type: 'to_pay', name: 'Electricity Co.', amount: 200, dueDate: new Date('2026-04-18'), status: 'pending', userId: user.id },
  ];
  for (const tx of transactions) {
    await prisma.transaction.create({ data: tx });
  }
  console.log(`✅ Created ${transactions.length} sample transactions`);

  console.log('🎉 Seed completed!');
}

seed()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
