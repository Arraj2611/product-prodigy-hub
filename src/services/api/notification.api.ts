import { apiClient } from './client.js';

export interface Notification {
  id: string;
  userId: string;
  type: 'BOM_GENERATED' | 'SUPPLIERS_FOUND' | 'MARKET_FORECAST_READY' | 'PRICE_FORECAST_READY' | 'PRODUCT_UPDATED' | 'SYSTEM_ALERT';
  title: string;
  message: string;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  readAt?: string;
}

export interface NotificationsResponse {
  notifications: Notification[];
  unreadCount: number;
}

export const notificationApi = {
  getNotifications: async (limit?: number, unreadOnly?: boolean) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', limit.toString());
    if (unreadOnly) params.append('unreadOnly', 'true');
    
    return apiClient.get<{
      success: boolean;
      data: NotificationsResponse;
    }>(`/notifications?${params.toString()}`);
  },

  markAsRead: async (notificationId: string) => {
    return apiClient.patch<{
      success: boolean;
      data: { notification: Notification };
    }>(`/notifications/${notificationId}/read`);
  },

  markAllAsRead: async () => {
    return apiClient.patch<{
      success: boolean;
      data: { count: number };
    }>('/notifications/read-all');
  },

  deleteNotification: async (notificationId: string) => {
    return apiClient.delete<{
      success: boolean;
      message: string;
    }>(`/notifications/${notificationId}`);
  },
};

