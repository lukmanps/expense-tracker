import api from './api';

export const incomeService = {
  list: (params) => api.get('/incomes', params),
  getById: (id) => api.get(`/incomes/${id}`),
  create: (data) => api.post('/incomes', data),
  update: (id, data) => api.patch(`/incomes/${id}`, data),
  delete: (id) => api.delete(`/incomes/${id}`),
};
