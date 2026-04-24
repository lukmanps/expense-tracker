import prisma from './prisma.js';

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
