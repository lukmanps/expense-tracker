import * as adminController from './admin.controller.js';

export default async function adminRoutes(fastify) {
  fastify.addHook('preHandler', fastify.adminOnly);

  // Overview (all users aggregated)
  fastify.get('/overview', adminController.overview);
  fastify.get('/overview/monthly', adminController.overviewMonthly);

  // User list
  fastify.get('/users', adminController.listUsers);
  fastify.get('/users/:userId', adminController.getUser);

  // Per-user data
  fastify.get('/users/:userId/summary', adminController.userSummary);
  fastify.get('/users/:userId/expenses', adminController.userExpenses);
  fastify.get('/users/:userId/incomes', adminController.userIncomes);
  fastify.get('/users/:userId/transactions', adminController.userTransactions);
  fastify.get('/users/:userId/categories', adminController.userCategoriesList);

  // Per-user stats
  fastify.get('/users/:userId/stats/monthly', adminController.userMonthly);
  fastify.get('/users/:userId/stats/categories', adminController.userCategories);
  fastify.get('/users/:userId/stats/recent', adminController.userRecent);
  fastify.get('/users/:userId/stats/top-expenses', adminController.userTopExpenses);
  fastify.get('/users/:userId/stats/weekly', adminController.userWeekly);
}
