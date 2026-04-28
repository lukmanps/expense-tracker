import api from './api';

export const statementService = {
  processFile: (file, password, page = 1) => {
    const formData = new FormData();
    formData.append('file', file);
    if (password) formData.append('password', password);
    formData.append('page', String(page));
    return api.upload('/statements/process', formData);
  },

  confirmTransactions: (transactions) =>
    api.post('/statements/confirm', { transactions }),
};
