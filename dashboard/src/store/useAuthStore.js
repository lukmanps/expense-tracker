import { create } from 'zustand';
import { adminService } from '../services/admin.service.js';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('admin_token') || null,
  isAuthenticated: false,
  isLoading: true,

  login: async (phone, password) => {
    const data = await adminService.login(phone, password);
    localStorage.setItem('admin_token', data.token);
    set({ token: data.token, user: data.user, isAuthenticated: true });
    return data;
  },

  logout: () => {
    localStorage.removeItem('admin_token');
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    const token = get().token;
    if (!token) {
      set({ isLoading: false, isAuthenticated: false });
      return;
    }
    try {
      const data = await adminService.getMe();
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('admin_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },
}));

export default useAuthStore;
