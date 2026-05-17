import { computed, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { getTierByPoints } from '@/pages/profile/membershipService'
import type { NotificationItem } from '@/pages/notifications/notificationService'
import { headerServices } from './headerServices'

const NOTIFICATION_POLLING_INTERVAL = 7000

export function headerHandler() {
    const authStore = useAuthStore()
    const uiStore = useUIStore()

    const totalPoints = ref(0)
    const notifications = ref<NotificationItem[]>([])
    const unreadCount = ref(0)
    const isLoadingNotifications = ref(false)
    const isMarkingAllRead = ref(false)
    const knownNotificationKeys = ref(new Set<string>())
    const hasInitializedNotifications = ref(false)
    let notificationPollingTimer: number | null = null

    const currentTier = computed(() => getTierByPoints(totalPoints.value))

    const loadRewardHistory = async () => {
        if (!authStore.isAuthenticated) return

        try {
            const response = await headerServices.getRewardHistory()
            totalPoints.value = response.data.reduce((sum, item) => sum + item.points_delta, 0)
        } catch { /* silent */ }
    }

    const getNotificationId = (notification: NotificationItem) =>
        notification.notification_id ?? notification.id

    const getNotificationKey = (notification: NotificationItem) =>
        String(getNotificationId(notification) ?? `${notification.created_at}-${notification.title}`)

    const syncKnownNotifications = (items: NotificationItem[]) => {
        knownNotificationKeys.value = new Set(items.map(getNotificationKey))
    }

    const showNewNotificationToasts = (items: NotificationItem[]) => {
        if (!hasInitializedNotifications.value) return

        const newNotifications = items.filter(
            notification => !knownNotificationKeys.value.has(getNotificationKey(notification))
        )

        newNotifications
            .slice()
            .reverse()
            .forEach((notification) => {
                uiStore.info(`${notification.title}: ${notification.body}`)
            })
    }

    const loadNotifications = async (options?: { detectNew?: boolean }) => {
        if (!authStore.isAuthenticated) return

        const shouldShowLoading = !options?.detectNew
        if (shouldShowLoading) {
            isLoadingNotifications.value = true
        }

        try {
            const [notificationsResponse, unreadResponse] = await Promise.all([
                headerServices.getMyNotifications(),
                headerServices.getUnreadNotificationCount(),
            ])

            if (options?.detectNew) {
                showNewNotificationToasts(notificationsResponse.data.items)
            }

            notifications.value = notificationsResponse.data.items
            unreadCount.value = unreadResponse.data.unread_count
            syncKnownNotifications(notificationsResponse.data.items)
            hasInitializedNotifications.value = true
        } catch { /* silent */ }
        finally {
            if (shouldShowLoading) {
                isLoadingNotifications.value = false
            }
        }
    }

    const startNotificationPolling = () => {
        if (notificationPollingTimer !== null) return

        notificationPollingTimer = window.setInterval(() => {
            void loadNotifications({ detectNew: true })
        }, NOTIFICATION_POLLING_INTERVAL)
    }

    const stopNotificationPolling = () => {
        if (notificationPollingTimer === null) return

        window.clearInterval(notificationPollingTimer)
        notificationPollingTimer = null
    }

    const markNotificationAsRead = async (notification: NotificationItem) => {
        if (notification.is_read) return

        const notificationId = getNotificationId(notification)
        if (!notificationId) return

        try {
            await headerServices.markNotificationAsRead(notificationId)
            notification.is_read = true
            unreadCount.value = Math.max(0, unreadCount.value - 1)
        } catch { /* silent */ }
    }

    const markAllNotificationsAsRead = async () => {
        if (!unreadCount.value || isMarkingAllRead.value) return

        isMarkingAllRead.value = true
        try {
            await headerServices.markAllNotificationsAsRead()
            notifications.value = notifications.value.map((notification) => ({
                ...notification,
                is_read: true,
            }))
            unreadCount.value = 0
        } catch { /* silent */ }
        finally {
            isMarkingAllRead.value = false
        }
    }

    const resetNotifications = () => {
        notifications.value = []
        unreadCount.value = 0
        knownNotificationKeys.value = new Set()
        hasInitializedNotifications.value = false
    }

    watch(
        () => authStore.isAuthenticated,
        async (isAuthenticated) => {
            if (isAuthenticated) {
                await Promise.all([loadRewardHistory(), loadNotifications()])
                startNotificationPolling()
                return
            }

            stopNotificationPolling()
            resetNotifications()
            totalPoints.value = 0
        }
    )

    return {
        currentTier,
        notifications,
        unreadCount,
        isLoadingNotifications,
        isMarkingAllRead,
        loadRewardHistory,
        loadNotifications,
        startNotificationPolling,
        stopNotificationPolling,
        getNotificationId,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        resetNotifications,
    }
}
