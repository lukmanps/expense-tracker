import api from './api';

export const categoryService = {
  list: (type) => api.get('/categories', type ? { type } : {}),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.patch(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
};
