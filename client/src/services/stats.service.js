import api from './api';

const BASE_URL = import.meta.env.VITE_API_URL || '/api';

export const statsService = {
  dashboard: (month) => api.get('/stats/dashboard', month ? { month } : undefined),
  weekly: () => api.get('/stats/weekly'),
  monthly: (months) => api.get('/stats/monthly', months ? { months } : undefined),
  monthlyWeekly: () => api.get('/stats/monthly-weekly'),
  lastMonthWeekly: () => api.get('/stats/last-month-weekly'),
  categoryBreakdown: (period) => api.get('/stats/categories', period ? { period } : undefined),
  recentActivity: (limit, month) => api.get('/stats/recent', { limit, ...(month ? { month } : {}) }),
  topExpenses: (limit, period) => api.get('/stats/top-expenses', { limit, ...(period ? { period } : {}) }),
  exportCSV: async () => {
    const token = api.getToken();
    const response = await fetch(`${BASE_URL}/stats/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!response.ok) throw new Error('Export failed');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'xpense-export.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
