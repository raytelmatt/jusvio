import { databases, DATABASE_ID, COLLECTIONS, account, Query } from '@/react-app/lib/backend';
import type { BackendUser } from '@/react-app/lib/backend/types';

export type NotificationType = 'deadline' | 'hearing' | 'payment' | 'document' | 'message' | 'system';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  is_read: boolean;
  priority: NotificationPriority;
  action_url?: string;
  created_at: string; // mapped from $createdAt
  related_matter_id?: string;
}

type NotificationDocument = {
  $id?: string;
  $createdAt?: string;
  created_at?: string;
  title?: string;
  message?: string;
  type?: NotificationType;
  is_read?: boolean;
  priority?: NotificationPriority;
  action_url?: string;
  related_matter_id?: string;
  user_id?: string;
};

let cachedUserId: string | null = null;

async function ensureUserId(): Promise<string> {
  if (cachedUserId) return cachedUserId;
  const me = (await account.get()) as unknown as BackendUser | null;
  cachedUserId = me?.$id ?? '';
  return cachedUserId;
}

function mapDoc(doc: NotificationDocument): NotificationItem {
  return {
    id: String(doc.$id || ''),
    title: doc.title ?? '',
    message: doc.message ?? '',
    type: (doc.type as NotificationType) ?? 'system',
    is_read: Boolean(doc.is_read),
    priority: (doc.priority as NotificationPriority) ?? 'low',
    action_url: doc.action_url ?? undefined,
    created_at: doc.created_at || doc.$createdAt || new Date().toISOString(),
    related_matter_id: doc.related_matter_id ?? undefined,
  };
}

export async function fetchNotifications(filter: 'all' | 'unread' = 'all'): Promise<{ notifications: NotificationItem[]; unreadCount: number; }> {
  const userId = await ensureUserId();

  const baseQueries = [
    Query.equal('user_id', userId),
    Query.orderDesc('created_at'),
    Query.limit(50),
  ];
  const listQueries = filter === 'unread' ? [...baseQueries, Query.equal('is_read', false)] : baseQueries;

  const [listRes, unreadRes] = await Promise.all([
    databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, listQueries),
    databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, [
      Query.equal('user_id', userId),
      Query.equal('is_read', false),
      Query.limit(1),
    ]),
  ]);

  const notifications = (listRes.documents || []).map(doc => mapDoc(doc as NotificationDocument));
  const unreadCount = unreadRes.total ?? (unreadRes.documents?.length ?? 0);
  return { notifications, unreadCount };
}

export async function getUnreadCount(): Promise<number> {
  const userId = await ensureUserId();
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, [
    Query.equal('user_id', userId),
    Query.equal('is_read', false),
    Query.limit(1),
  ]);
  return res.total ?? (res.documents?.length ?? 0);
}

export async function markAsRead(notificationId: string): Promise<void> {
  await databases.updateDocument(DATABASE_ID, COLLECTIONS.notifications, notificationId, { is_read: true });
}

export async function markAllAsRead(): Promise<void> {
  const userId = await ensureUserId();
  const res = await databases.listDocuments(DATABASE_ID, COLLECTIONS.notifications, [
    Query.equal('user_id', userId),
    Query.equal('is_read', false),
    Query.limit(100),
  ]);
  await Promise.all((res.documents || []).map((d) => databases.updateDocument(DATABASE_ID, COLLECTIONS.notifications, d.$id, { is_read: true })));
}

export async function deleteNotification(notificationId: string): Promise<void> {
  await databases.deleteDocument(DATABASE_ID, COLLECTIONS.notifications, notificationId);
}
