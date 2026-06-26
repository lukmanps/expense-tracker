import * as adminController from './admin.controller.js';

export default async function adminRoutes(fastify) {
  fastify.addHook('preHandler', fastify.adminOnly);

  // Overview (all users aggregated)
  fastify.get('/overview', adminController.overview);
  fastify.get('/overview/monthly', adminController.overviewMonthly);

  // User list
  fastify.get('/users', adminController.listUsers);
  fastify.get('/users/:userId', adminController.getUser);

  // Per-user data (read)
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

  // Per-user mutations (admin write)
  fastify.post('/users/:userId/expenses', adminController.createUserExpense);
  fastify.put('/users/:userId/expenses/:id', adminController.updateUserExpense);
  fastify.delete('/users/:userId/expenses/:id', adminController.deleteUserExpense);

  fastify.post('/users/:userId/incomes', adminController.createUserIncome);
  fastify.put('/users/:userId/incomes/:id', adminController.updateUserIncome);
  fastify.delete('/users/:userId/incomes/:id', adminController.deleteUserIncome);

  fastify.post('/users/:userId/transactions', adminController.createUserTransaction);
  fastify.put('/users/:userId/transactions/:id', adminController.updateUserTransaction);
  fastify.delete('/users/:userId/transactions/:id', adminController.deleteUserTransaction);
  fastify.patch('/users/:userId/transactions/:id/complete', adminController.completeUserTransaction);
}
