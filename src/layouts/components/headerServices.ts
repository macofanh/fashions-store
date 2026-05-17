import { membershipService } from '@/pages/profile/membershipService'
import { notificationService } from '@/pages/notifications/notificationService'

export const headerServices = {
    getRewardHistory() {
        return membershipService.getRewardHistory()
    },

    getMyNotifications(page = 1, pageSize = 8) {
        return notificationService.getMyNotifications({ page, page_size: pageSize })
    },

    getUnreadNotificationCount() {
        return notificationService.getUnreadCount()
    },

    markNotificationAsRead(notificationId: number) {
        return notificationService.markAsRead(notificationId)
    },

    markAllNotificationsAsRead() {
        return notificationService.markAllAsRead()
    },
}
