import api from './api';

export const transactionService = {
  list: (params) => api.get('/transactions', params),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.patch(`/transactions/${id}`, data),
  toggleStatus: (id) => api.patch(`/transactions/${id}/toggle`, {}),
  complete: (id) => api.patch(`/transactions/${id}/complete`, {}),
  delete: (id) => api.delete(`/transactions/${id}`),
};

