import api from './api.js';

export const adminService = {
  // Auth (reuses regular auth endpoints)
  login: (phone, password) => api.post('/auth/login', { phone, password }),
  getMe: () => api.get('/auth/me'),

  // Overview
  overview: (month) => api.get('/admin/overview', { month }),
  overviewMonthly: (months) => api.get('/admin/overview/monthly', { months }),

  // Users (accounts)
  listUsers: () => api.get('/admin/users'),
  getUser: (userId) => api.get(`/admin/users/${userId}`),

  // Per-user data (read)
  userSummary: (userId, month) => api.get(`/admin/users/${userId}/summary`, { month }),
  userExpenses: (userId, params) => api.get(`/admin/users/${userId}/expenses`, params),
  userIncomes: (userId, params) => api.get(`/admin/users/${userId}/incomes`, params),
  userTransactions: (userId, params) => api.get(`/admin/users/${userId}/transactions`, params),
  userCategories: (userId) => api.get(`/admin/users/${userId}/categories`),

  // Per-user stats
  userMonthly: (userId, months) => api.get(`/admin/users/${userId}/stats/monthly`, { months }),
  userCategoryBreakdown: (userId, month) => api.get(`/admin/users/${userId}/stats/categories`, { month }),
  userRecent: (userId, limit, month) => api.get(`/admin/users/${userId}/stats/recent`, { limit, month }),
  userTopExpenses: (userId, limit, month) => api.get(`/admin/users/${userId}/stats/top-expenses`, { limit, month }),
  userWeekly: (userId) => api.get(`/admin/users/${userId}/stats/weekly`),

  // Per-user mutations (admin write)
  createExpense: (userId, data) => api.post(`/admin/users/${userId}/expenses`, data),
  updateExpense: (userId, id, data) => api.put(`/admin/users/${userId}/expenses/${id}`, data),
  deleteExpense: (userId, id) => api.delete(`/admin/users/${userId}/expenses/${id}`),

  createIncome: (userId, data) => api.post(`/admin/users/${userId}/incomes`, data),
  updateIncome: (userId, id, data) => api.put(`/admin/users/${userId}/incomes/${id}`, data),
  deleteIncome: (userId, id) => api.delete(`/admin/users/${userId}/incomes/${id}`),

  createTransaction: (userId, data) => api.post(`/admin/users/${userId}/transactions`, data),
  updateTransaction: (userId, id, data) => api.put(`/admin/users/${userId}/transactions/${id}`, data),
  deleteTransaction: (userId, id) => api.delete(`/admin/users/${userId}/transactions/${id}`),
  completeTransaction: (userId, id) => api.patch(`/admin/users/${userId}/transactions/${id}/complete`),
};
