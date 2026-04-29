import { create } from 'zustand';
import { api } from '../services/api';
import { supabase } from '../services/supabase';

export const useNotificationStore = create((set, get) => ({
  notifications: [],
  unreadCount: 0,
  subscription: null,

  fetchNotifications: async (userId) => {
    try {
      const data = await api.get('/api/notifications');
      const unread = data.notifications.filter(n => !n.read).length;
      set({ notifications: data.notifications, unreadCount: unread });

      if (userId && !get().subscription) {
        // Setup real-time subscription
        const sub = supabase.channel('public:notifications')
          .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${userId}` }, (payload) => {
            get().addNotification(payload.new);
          })
          .subscribe();
        set({ subscription: sub });
      }
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

  handleRequestAction: async (notificationId, action) => {
    // action is 'accepted' or 'rejected'
    try {
      // Find the join_request ID from the notification or we need an API endpoint
      // Assuming we'll build a specific endpoint for acting on join requests via notification ID
      await api.post(`/api/notifications/${notificationId}/action`, { action });
      // Remove or update the notification visually
      set(state => ({
        notifications: state.notifications.map(n => n.id === notificationId ? { ...n, read: true, type: 'action_taken', message: `Request ${action}` } : n),
        unreadCount: state.notifications.find(n => n.id === notificationId && !n.read) ? Math.max(0, state.unreadCount - 1) : state.unreadCount
      }));
    } catch (err) {
      console.error('Failed to perform action:', err);
    }
  }
}));
