export type NotificationCategory =
  | 'bid'
  | 'arrival'
  | 'payment'
  | 'job'
  | 'emergency'
  | 'promotion';

export interface AppNotification {
  id: string;
  category: NotificationCategory;
  title: string;
  body: string;
  createdAt: string;
  read: boolean;
  relatedRequestId?: string;
}
