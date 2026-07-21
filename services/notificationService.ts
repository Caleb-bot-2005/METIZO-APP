import { apiClient } from './api/client';
import { mockDelay } from './mockDelay';
import { env } from '@/config/env';
import { mockNotifications } from '@/constants/mockData';
import { AppNotification, NotificationCategory } from '@/types/notification';

// Backend DTO from NotificationDtos.Response (category is an uppercase enum name).
interface BackendNotification {
  id: number;
  category: string;
  title: string;
  body: string;
  relatedRequestId: number | null;
  read: boolean;
  createdAt: string;
}

function toNotification(n: BackendNotification): AppNotification {
  return {
    id: String(n.id),
    category: n.category.toLowerCase() as NotificationCategory,
    title: n.title,
    body: n.body,
    createdAt: n.createdAt,
    read: n.read,
    relatedRequestId: n.relatedRequestId != null ? String(n.relatedRequestId) : undefined,
  };
}

// In-memory copy so markRead/markAllRead persist across refetches within a mock
// session instead of the static seed data reverting an item back to unread.
let mockNotificationState: AppNotification[] = mockNotifications.map((n) => ({ ...n }));

export const notificationService = {
  async list(): Promise<AppNotification[]> {
    if (env.useMockData) return mockDelay(mockNotificationState);
    const { data } = await apiClient.get<BackendNotification[]>('/notifications');
    return data.map(toNotification);
  },

  async unreadCount(): Promise<number> {
    if (env.useMockData) return mockDelay(mockNotificationState.filter((n) => !n.read).length);
    const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
    return data.count;
  },

  async markRead(id: string): Promise<void> {
    if (env.useMockData) {
      mockNotificationState = mockNotificationState.map((n) => (n.id === id ? { ...n, read: true } : n));
      return mockDelay(undefined);
    }
    await apiClient.post(`/notifications/${id}/read`);
  },

  async markAllRead(): Promise<void> {
    if (env.useMockData) {
      mockNotificationState = mockNotificationState.map((n) => ({ ...n, read: true }));
      return mockDelay(undefined);
    }
    await apiClient.post('/notifications/read-all');
  },
};
