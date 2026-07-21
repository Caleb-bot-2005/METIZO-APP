import { create } from 'zustand';
import { AppNotification } from '@/types/notification';

interface NotificationState {
  notifications: AppNotification[];
  setNotifications: (notifications: AppNotification[]) => void;
  addNotification: (notification: AppNotification) => void;
  markAllRead: () => void;
  markOneRead: (id: string) => void;
  unreadCount: () => number;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  // Merges the fetched feed with anything added locally (e.g. a just-submitted job)
  // that the feed doesn't know about yet, instead of overwriting it.
  setNotifications: (notifications) =>
    set((s) => {
      const fetchedIds = new Set(notifications.map((n) => n.id));
      const localOnly = s.notifications.filter((n) => !fetchedIds.has(n.id));
      return { notifications: [...localOnly, ...notifications] };
    }),
  addNotification: (notification) => set((s) => ({ notifications: [notification, ...s.notifications] })),
  markAllRead: () => set((s) => ({ notifications: s.notifications.map((n) => ({ ...n, read: true })) })),
  markOneRead: (id) =>
    set((s) => ({ notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)) })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}));
