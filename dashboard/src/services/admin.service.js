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

  // Per-user data
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
};
