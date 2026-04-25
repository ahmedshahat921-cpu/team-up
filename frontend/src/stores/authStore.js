import { create } from 'zustand';
import { api } from '../services/api';

export const useAuthStore = create((set, get) => ({
  user: null,
  token: localStorage.getItem('teamup_token') || null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),

  login: async (reg_number, password) => {
    try {
      const data = await api.post('/api/auth/login', { reg_number, password });
      localStorage.setItem('teamup_token', data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  register: async (userData) => {
    try {
      const data = await api.post('/api/auth/register', userData);
      localStorage.setItem('teamup_token', data.token);
      set({ user: data.user, token: data.token, isAuthenticated: true, isLoading: false });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  logout: async () => {
    try {
      await api.post('/api/auth/logout');
    } catch {
      // Ignore logout API errors
    }
    localStorage.removeItem('teamup_token');
    set({ user: null, token: null, isAuthenticated: false, isLoading: false });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('teamup_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    try {
      const data = await api.get('/api/auth/me');
      set({ user: data.user, token, isAuthenticated: true, isLoading: false });
    } catch {
      // Token invalid or backend unreachable – clear auth state
      localStorage.removeItem('teamup_token');
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  },

  updateProfile: async (updates) => {
    try {
      const data = await api.put('/api/auth/profile', updates);
      set({ user: data.user });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  changePassword: async (currentPassword, newPassword) => {
    try {
      await api.post('/api/auth/change-password', { currentPassword, newPassword });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  changeRole: async (role) => {
    try {
      const data = await api.patch('/api/auth/role', { role });
      localStorage.setItem('teamup_token', data.token);
      set({ user: data.user, token: data.token });
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },
}));
