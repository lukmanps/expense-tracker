import api from './api';

export const statsService = {
  dashboard: () => api.get('/stats/dashboard'),
  weekly: () => api.get('/stats/weekly'),
  monthly: () => api.get('/stats/monthly'),
  categoryBreakdown: () => api.get('/stats/categories'),
  recentActivity: (limit) => api.get('/stats/recent', { limit }),
  exportCSV: () => api.get('/stats/export'),
};
