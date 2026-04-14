import { create } from 'zustand';
import { authService } from '../services/auth.service';
import api from '../services/api';

const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  isAuthenticated: !!localStorage.getItem('token'),
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  login: async ({ phone, password }) => {
    const { user, token } = await authService.login({ phone, password });
    api.setToken(token);
    set({ user, token, isAuthenticated: true });
    return user;
  },

  register: async ({ phone, name, password, email }) => {
    const { user, token } = await authService.register({ phone, name, password, email });
    api.setToken(token);
    set({ user, token, isAuthenticated: true });
    return user;
  },

  logout: () => {
    api.setToken(null);
    set({ user: null, token: null, isAuthenticated: false });
  },

  fetchUser: async () => {
    try {
      const token = get().token || localStorage.getItem('token');
      if (!token) {
        set({ isLoading: false });
        return;
      }
      api.setToken(token);
      const { user } = await authService.getMe();
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      api.setToken(null);
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (data) => {
    const { user } = await authService.updateProfile(data);
    set({ user });
    return user;
  },
}));

export default useAuthStore;
