import { create } from 'zustand';
import { api } from '../services/api';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,

  fetchNotifications: async () => {
    try {
      const data = await api.get('/api/notifications');
      const unread = data.notifications.filter(n => !n.read).length;
      set({ notifications: data.notifications, unreadCount: unread });
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    }
  },

  addNotification: (notification) => {
    set(state => ({
      notifications: [notification, ...state.notifications],
      unreadCount: state.unreadCount + 1,
    }));
  },

  markAsRead: async (id) => {
    try {
      await api.patch(`/api/notifications/${id}/read`);
      set(state => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n),
        unreadCount: Math.max(0, state.unreadCount - 1),
      }));
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  },

  markAllAsRead: async () => {
    try {
      await api.patch('/api/notifications/read-all');
      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
      }));
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  },
}));
