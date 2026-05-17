import axiosClient from '@/lib/axiosClient'
import { apiEndpoints } from '@/lib/endPoints'

export interface NotificationItem {
    id?: number
    notification_id?: number
    user_id: number
    type: string
    title: string
    body: string
    image_url?: string | null
    ref_type?: string | null
    ref_id?: number | null
    is_read: boolean
    created_at: string
}

export interface NotificationListResponse {
    items: NotificationItem[]
    total: number
    page: number
    page_size: number
    total_pages?: number
}

export interface UnreadCountResponse {
    unread_count: number
}

export interface CreateNotificationPayload {
    user_id: number
    type: string
    title: string
    body: string
    image_url?: string | null
    ref_type?: string | null
    ref_id?: number | null
}

export const notificationService = {
    createNotification: (data: CreateNotificationPayload) =>
        axiosClient.post<NotificationItem>(apiEndpoints.notifications.create, data),

    getMyNotifications: (params?: { page?: number; page_size?: number }) =>
        axiosClient.get<NotificationListResponse>(apiEndpoints.notifications.my, { params }),

    getUnreadCount: () =>
        axiosClient.get<UnreadCountResponse>(apiEndpoints.notifications.unreadCount),

    markAsRead: (id: number) =>
        axiosClient.put<NotificationItem>(apiEndpoints.notifications.markAsRead(id)),

    markAllAsRead: () =>
        axiosClient.put(apiEndpoints.notifications.markAllAsRead),
}
