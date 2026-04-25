import api from './api';

export const statementService = {
  processFile: (file, password) => {
    const formData = new FormData();
    formData.append('file', file);
    if (password) {
      formData.append('password', password);
    }
    return api.upload('/statements/process', formData);
  },

  confirmTransactions: (transactions) =>
    api.post('/statements/confirm', { transactions }),
};
