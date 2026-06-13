<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCartStore } from '@/stores/useCartStore'
import { useUIStore } from '@/stores/useUIStore'
import { APP_NAME } from '@/lib/appConfig'
import { productService } from '@/pages/products/productService'
import type { CategoryItem, NavDropdownItem, NavLink, ProfileMenuItem } from './headerTypes'
import { membershipService, getTierByPoints } from '@/pages/profile/membershipService'
import { profileServices } from '@/pages/profile/profileServices'
import BodyMeasurementsModal from '@/pages/profile/components/BodyMeasurementsModal.vue'
import {
    notificationService,
    type NotificationItem,
} from '@/pages/notifications/notificationService'

const authStore = useAuthStore()
const cartStore = useCartStore()
const uiStore = useUIStore()
const router = useRouter()
const route = useRoute()

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const isNotificationOpen = ref(false)
const notificationRoot = ref<HTMLElement | null>(null)
const totalPoints = ref(0)
const notifications = ref<NotificationItem[]>([])
const categories = ref<CategoryItem[]>([])
const unreadCount = ref(0)
const isLoadingNotifications = ref(false)
const isMarkingAllRead = ref(false)
const isMeasurementsModalOpen = ref(false)
const isSavingMeasurements = ref(false)
const pendingProfileDestination = ref('/profile?tab=profile')
const knownNotificationKeys = ref(new Set<string>())
const hasInitializedNotifications = ref(false)
let notificationPollingTimer: number | null = null
let categoriesRequest: Promise<void> | null = null
const NOTIFICATION_POLLING_INTERVAL = 7000

// Fetch điểm khi đã đăng nhập
const loadRewardHistory = async () => {
    if (!authStore.isAuthenticated) return
    try {
        const res = await membershipService.getRewardHistory()
        totalPoints.value = res.data.reduce((sum, item) => sum + item.points_delta, 0)
    } catch { /* silent */ }
}

const loadCategories = async () => {
    if (categories.value.length > 0) return

    try {
        const res = await productService.getCategories()
        categories.value = Array.isArray(res.data) ? res.data : []
    } catch { /* silent */ }
}

const ensureCategoriesLoaded = () => {
    if (categories.value.length > 0) return Promise.resolve()
    if (categoriesRequest) return categoriesRequest

    categoriesRequest = loadCategories().finally(() => {
        categoriesRequest = null
    })
    return categoriesRequest
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
            notificationService.getMyNotifications({ page: 1, page_size: 8 }),
            notificationService.getUnreadCount(),
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

const toggleNotifications = async () => {
    isNotificationOpen.value = !isNotificationOpen.value

    if (isNotificationOpen.value) {
        await loadNotifications()
    }
}

const markNotificationAsRead = async (notification: NotificationItem) => {
    if (notification.is_read) return

    const notificationId = getNotificationId(notification)
    if (!notificationId) return

    try {
        await notificationService.markAsRead(notificationId)
        notification.is_read = true
        unreadCount.value = Math.max(0, unreadCount.value - 1)
    } catch { /* silent */ }
}

const markAllNotificationsAsRead = async () => {
    if (!unreadCount.value || isMarkingAllRead.value) return

    isMarkingAllRead.value = true
    try {
        await notificationService.markAllAsRead()
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

const formatNotificationTime = (createdAt: string) => {
    const createdDate = new Date(createdAt)
    if (Number.isNaN(createdDate.getTime())) return ''

    return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
    }).format(createdDate)
}

const handleDocumentClick = (event: MouseEvent) => {
    if (!notificationRoot.value?.contains(event.target as Node)) {
        isNotificationOpen.value = false
    }
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    document.addEventListener('click', handleDocumentClick)

    const schedule = window.requestIdleCallback
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 0)

    schedule(() => {
        void loadRewardHistory()
        void loadNotifications()
        if (authStore.isAuthenticated) {
            startNotificationPolling()
        }
    })
})

const currentTier = computed(() => getTierByPoints(totalPoints.value))

// ─── Scroll handler ───────────────────────────────────────────────────────────
const handleScroll = () => {
    isScrolled.value = window.scrollY > 60
}

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
    document.removeEventListener('click', handleDocumentClick)
    stopNotificationPolling()
})

watch(
    () => authStore.isAuthenticated,
    async (isAuthenticated) => {
        if (isAuthenticated) {
            await loadNotifications()
            startNotificationPolling()
            return
        }

        stopNotificationPolling()
        notifications.value = []
        unreadCount.value = 0
        knownNotificationKeys.value = new Set()
        hasInitializedNotifications.value = false
    }
)

// ─── Actions ──────────────────────────────────────────────────────────────────
const handleLogout = async () => {
    const confirmed = await uiStore.confirm({
        title: 'Đăng xuất',
        message: 'Bạn có chắc muốn đăng xuất khỏi tài khoản không?',
        confirmLabel: 'Đăng xuất',
        cancelLabel: 'Hủy',
        variant: 'danger',
    })
    if (!confirmed) return

    window.google?.accounts.id.disableAutoSelect()
    authStore.logout()
    cartStore.clearGuestCart()
    isMobileMenuOpen.value = false
    isNotificationOpen.value = false
    notifications.value = []
    unreadCount.value = 0
    knownNotificationKeys.value = new Set()
    hasInitializedNotifications.value = false
    stopNotificationPolling()
    router.push({ name: 'login' })
}

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
}

const toggleMobileMenu = () => {
    isMobileMenuOpen.value = !isMobileMenuOpen.value
    if (isMobileMenuOpen.value) {
        void ensureCategoriesLoaded()
    }
}

const measurementsPromptKey = computed(() =>
    `body-measurements-prompt-seen:${authStore.user?.user_id ?? 'guest'}`
)

const hasBodyMeasurements = computed(() =>
    authStore.user?.height_cm != null && authStore.user?.weight_kg != null
)

const continueToProfile = async () => {
    isMeasurementsModalOpen.value = false
    closeMobileMenu()
    await router.push(pendingProfileDestination.value)
}

const handleProfileNavigation = async (to: string) => {
    pendingProfileDestination.value = to

    if (
        hasBodyMeasurements.value ||
        localStorage.getItem(measurementsPromptKey.value) === 'true'
    ) {
        closeMobileMenu()
        await router.push(to)
        return
    }

    localStorage.setItem(measurementsPromptKey.value, 'true')
    isMeasurementsModalOpen.value = true
}

const saveBodyMeasurements = async (measurements: { height_cm: number; weight_kg: number }) => {
    if (!authStore.user) return

    isSavingMeasurements.value = true
    try {
        const response = await profileServices.updateMyProfile({
            full_name: authStore.user.full_name,
            phone: authStore.user.phone || null,
            ...measurements,
        })
        authStore.hydrateUser({
            ...authStore.user,
            ...response.data,
            height_cm: measurements.height_cm,
            weight_kg: measurements.weight_kg,
        })
        uiStore.success('Đã lưu chiều cao và cân nặng.')
        await continueToProfile()
    } catch (e: any) {
        uiStore.error(e.response?.data?.detail || 'Không thể lưu số đo của bạn.')
    } finally {
        isSavingMeasurements.value = false
    }
}

const isRouteActive = (to: string) => {
    const resolved = router.resolve(to)

    if (resolved.path === '/products') {
        if (resolved.query.gender) {
            return route.path === '/products' && route.query.gender === resolved.query.gender
        }

        if (route.query.gender) {
            return false
        }

        return route.path.startsWith('/products')
    }

    if (resolved.path === '/admin') {
        return route.path.startsWith('/admin')
    }

    if (resolved.path !== route.path) {
        return false
    }

    const expectedTab = resolved.query.tab
    if (expectedTab) {
        return route.query.tab === expectedTab
    }

    return true
}

const normalizeText = (value: string) =>
    value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()

const findGenderRootCategory = (gender: 'male' | 'female') => {
    const expectedSlug = gender === 'male' ? 'nam' : 'nu'
    const expectedName = gender === 'male' ? 'nam' : 'nu'

    return categories.value.find((category) =>
        category.parent_id === null &&
        (category.slug === expectedSlug || normalizeText(category.name) === expectedName)
    )
}

const matchesGenderCategory = (category: CategoryItem, gender: 'male' | 'female') => {
    const normalizedName = normalizeText(category.name)
    const normalizedSlug = normalizeText(category.slug)

    if (category.gender === gender) return true
    return gender === 'male'
        ? normalizedSlug.endsWith('-nam') || normalizedName.includes(' nam')
        : normalizedSlug.endsWith('-nu') || normalizedName.includes(' nu')
}

const buildGenderProductsLink = (gender: 'male' | 'female') => {
    const params = new URLSearchParams({ gender })
    return `/products?${params.toString()}`
}

const buildCategoryProductsLink = (categoryId: number) =>
    `/products?category_id=${categoryId}`

const getGenderCategoryLinks = (gender: 'male' | 'female'): NavDropdownItem[] => {
    const rootCategory = findGenderRootCategory(gender)
    const categoryItems = categories.value.filter((category) => {
        if (category.category_id === rootCategory?.category_id) return false
        if (rootCategory && category.parent_id === rootCategory.category_id) return true
        if (rootCategory) return false
        return matchesGenderCategory(category, gender)
    })

    return [
        { label: 'Tất cả', to: buildGenderProductsLink(gender), categoryId: null },
        ...categoryItems.map((category) => ({
            label: category.name,
            to: buildCategoryProductsLink(category.category_id),
            categoryId: category.category_id,
        })),
    ]
}

const isDropdownItemActive = (item: NavDropdownItem) => {
    const resolved = router.resolve(item.to)
    if (route.path !== resolved.path) return false

    const expectedCategoryId = resolved.query.category_id
    if (!expectedCategoryId) {
        if (route.query.gender !== resolved.query.gender) return false
        return !route.query.category_id
    }

    return route.query.category_id === expectedCategoryId
}

// ─── Nav links (desktop + mobile) ─────────────────────────────────────────────
const navLinks = computed<NavLink[]>(() => [
    { label: 'Nam', to: buildGenderProductsLink('male'), children: getGenderCategoryLinks('male') },
    { label: 'Nữ', to: buildGenderProductsLink('female'), children: getGenderCategoryLinks('female') },
    { label: 'Ưu đãi', to: '/vouchers' },
    {
        label: 'Admin',
        to: '/admin',
        condition: authStore.isAdmin || authStore.isStaff,
        extraClass: '!text-amber-600',
    },
])

const isProfileMenuActive = computed(() =>
    profileMenuItems.value.some(item => item.to && isRouteActive(item.to))
)

// ─── Profile dropdown items ────────────────────────────────────────────────────
const profileMenuItems = computed<ProfileMenuItem[]>(() => [
    {
        key: 'profile',
        label: 'Hồ sơ của tôi',
        icon: 'person',
        to: '/profile?tab=profile',
    },
    {
        key: 'vouchers',
        label: 'Voucher của tôi',
        icon: 'local_offer',
        to: '/my-vouchers',
    },
    {
        key: 'orders',
        label: 'Đơn hàng của tôi',
        icon: 'package_2',
        to: '/profile?tab=orders',
    },
    {
        key: 'logout',
        label: 'Đăng xuất',
        icon: 'logout',
        action: handleLogout,
        extraClass: 'text-red-500',
        dividerBefore: true,
    },
])
</script>

<template>
    <!-- Spacer -->
    <div class="h-[65px]"></div>

    <header
        :class="[
            'fixed top-0 left-0 w-full z-[100] transition-all duration-300',
            isScrolled
                ? 'bg-background-light/95 backdrop-blur-sm border-b border-border-light shadow-sm py-3'
                : 'bg-background-light/95 backdrop-blur-sm border-b border-border-light py-4'
        ]"
    >
        <div class="max-w-[1440px] mx-auto px-6 flex items-center justify-between">

            <!-- LEFT: Logo + Nav -->
            <div class="flex items-center gap-12">
                <!-- Logo -->
                <router-link to="/" class="flex items-center gap-3 group">
                    <img src="@/assets/images/luxu-logo.svg" alt="Logo" class="h-8 w-auto" />
                    <span class="text-xl font-bold tracking-tight text-fashion-black">{{ APP_NAME }}</span>
                </router-link>

                <!-- Desktop Nav -->
                <nav class="hidden md:flex items-center gap-8">
                    <template v-for="link in navLinks" :key="link.to">
                        <div
                            v-if="link.condition !== false"
                            class="relative group/nav"
                            @mouseenter="link.children?.length && ensureCategoriesLoaded()"
                            @focusin="link.children?.length && ensureCategoriesLoaded()"
                        >
                            <router-link
                                :to="link.to"
                                :class="['nav-link', isRouteActive(link.to) ? 'nav-link-active' : '', link.extraClass]"
                            >{{ link.label }}</router-link>

                            <div
                                v-if="link.children?.length"
                                class="absolute left-1/2 top-full z-30 min-w-56 -translate-x-1/2 pt-3 opacity-0 invisible transition-all duration-200 pointer-events-none group-hover/nav:opacity-100 group-hover/nav:visible group-hover/nav:pointer-events-auto"
                            >
                                <div class="overflow-hidden rounded-lg border border-border-light bg-white py-2 shadow-xl">
                                    <router-link
                                        v-for="child in link.children"
                                        :key="child.to"
                                        :to="child.to"
                                        :class="['nav-dropdown-item', isDropdownItemActive(child) ? 'nav-dropdown-item-active' : '']"
                                    >
                                        {{ child.label }}
                                    </router-link>
                                </div>
                            </div>
                        </div>
                    </template>
                </nav>
            </div>

            <!-- RIGHT: Icons -->
            <div class="flex items-center gap-6">
                <!-- Icon buttons -->
                <div class="flex items-center gap-1">
                    <!-- Cart -->
                    <router-link
                        to="/cart"
                        :class="['icon-btn relative', isRouteActive('/cart') ? 'icon-btn-active' : '']"
                    >
                        <span class="material-symbols-outlined text-[24px]">shopping_bag</span>
                        <span
                            v-if="cartStore.totalQuantity > 0"
                            class="absolute -top-1 -right-1 bg-primary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none"
                        >{{ cartStore.totalQuantity }}</span>
                    </router-link>

                    <!-- Auth: logged in -->
                    <template v-if="authStore.isAuthenticated">
                        <!-- Notifications -->
                        <div ref="notificationRoot" class="relative">
                            <button
                                class="icon-btn"
                                aria-label="Thông báo"
                                @click.stop="toggleNotifications"
                            >
                                <span class="material-symbols-outlined text-[24px]">notifications</span>
                                <span
                                    v-if="unreadCount > 0"
                                    class="absolute -top-1 -right-1 min-w-4 h-4 px-1 bg-primary text-white text-[8px] rounded-full flex items-center  font-bold leading-none"
                                >{{ unreadCount > 99 ? '99+' : unreadCount }}</span>
                            </button>

                            <Transition name="notification-panel">
                                <div
                                    v-if="isNotificationOpen"
                                    class="absolute right-0 top-full pt-3 z-20"
                                >
                                    <div class="w-[360px] max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-border-light bg-white shadow-xl">
                                        <div class="flex items-center justify-between gap-4 border-b border-border-light px-4 py-3">
                                            <div>
                                                <p class="text-sm font-bold text-fashion-black">Thông báo</p>
                                                <p class="text-xs text-text-muted">{{ unreadCount }} chưa đọc</p>
                                            </div>
                                            <button
                                                class="text-xs font-medium text-primary transition-colors hover:text-primary-dark disabled:cursor-not-allowed disabled:text-zinc-300"
                                                :disabled="!unreadCount || isMarkingAllRead"
                                                @click="markAllNotificationsAsRead"
                                            >
                                                Đánh dấu tất cả đã đọc
                                            </button>
                                        </div>

                                        <div class="max-h-[420px] overflow-y-auto">
                                            <div
                                                v-if="isLoadingNotifications"
                                                class="px-4 py-8 text-center text-sm text-text-muted"
                                            >
                                                Đang tải thông báo...
                                            </div>

                                            <div
                                                v-else-if="notifications.length === 0"
                                                class="px-4 py-8 text-center text-sm text-text-muted"
                                            >
                                                Chưa có thông báo nào
                                            </div>

                                            <button
                                                v-for="notification in notifications"
                                                v-else
                                                :key="getNotificationId(notification) ?? `${notification.created_at}-${notification.title}`"
                                                class="notification-item"
                                                @click="markNotificationAsRead(notification)"
                                            >
                                                <img
                                                    v-if="notification.image_url"
                                                    :src="notification.image_url"
                                                    :alt="notification.title"
                                                    class="h-10 w-10 shrink-0 rounded object-cover"
                                                />
                                                <span
                                                    v-else
                                                    class="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary-light text-primary"
                                                >
                                                    <span class="material-symbols-outlined text-[20px] leading-none">notifications</span>
                                                </span>

                                                <span class="min-w-0 flex-1 text-left">
                                                    <span class="flex items-start justify-between gap-3">
                                                        <span class="text-sm font-medium leading-snug text-fashion-black">{{ notification.title }}</span>
                                                        <span
                                                            v-if="!notification.is_read"
                                                            class="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary"
                                                        ></span>
                                                    </span>
                                                    <span class="mt-1 block text-xs leading-relaxed text-zinc-500">{{ notification.body }}</span>
                                                    <span class="mt-1 block text-[11px] text-text-muted">{{ formatNotificationTime(notification.created_at) }}</span>
                                                </span>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </Transition>
                        </div>

                        <div class="relative group">
                            <button :class="['icon-btn', isProfileMenuActive ? 'icon-btn-active' : '']">
                                <span class="material-symbols-outlined text-[24px]">person</span>
                            </button>
                            <!-- Dropdown -->
                            <div class="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                                <div class="bg-white border border-border-light shadow-xl rounded-lg py-2 w-52">
                                    <!-- User info -->
                                    <div class="px-4 py-2 border-b border-border-light mb-1 flex justify-start items-center gap-5">
                                        <p class="text-xs font-bold text-fashion-black truncate">{{ authStore.userName }}</p>
                                        <p :class="['text-[10px] font-medium mt-0.5 flex items-center gap-1', currentTier.color]">
                                            <span class="material-symbols-outlined text-[12px]">{{ currentTier.icon }}</span>
                                            {{ currentTier.label }}
                                        </p>
                                    </div>

                                    <!-- Menu items -->
                                    <template v-for="item in profileMenuItems" :key="item.key">
                                        <hr v-if="item.dividerBefore" class="border-border-light my-1" />

                                        <!-- Router link item -->
                                        <router-link
                                            v-if="item.to"
                                            :to="item.to"
                                            @click.prevent="item.key === 'profile' ? handleProfileNavigation(item.to) : router.push(item.to)"
                                            :class="['dropdown-item', isRouteActive(item.to) ? 'dropdown-item-active' : '', item.extraClass]"
                                        >
                                            <span class="material-symbols-outlined text-[16px]">{{ item.icon }}</span>
                                            {{ item.label }}
                                        </router-link>

                                        <!-- Action button item -->
                                        <button
                                            v-else-if="item.action"
                                            @click="item.action"
                                            :class="['dropdown-item w-full text-left', item.extraClass]"
                                        >
                                            <span class="material-symbols-outlined text-[16px]">{{ item.icon }}</span>
                                            {{ item.label }}
                                        </button>
                                    </template>
                                </div>
                            </div>
                        </div>
                    </template>

                    <!-- Auth: guest -->
                    <template v-else>
                        <router-link :to="{ name: 'login' }" class="icon-btn">
                            <span class="material-symbols-outlined text-[24px]">person</span>
                        </router-link>
                    </template>

                    <!-- Mobile hamburger -->
                    <button @click="toggleMobileMenu" class="icon-btn md:hidden ml-1">
                        <span class="material-symbols-outlined text-[26px]">{{ isMobileMenuOpen ? 'close' : 'menu' }}</span>
                    </button>
                </div>
            </div>
        </div>
    </header>

    <!-- Mobile Menu -->
    <Transition name="mobile-menu">
        <div
            v-if="isMobileMenuOpen"
            class="fixed inset-0 top-[65px] bg-background-light z-[90] md:hidden flex flex-col p-8 gap-6 border-t border-border-light overflow-y-auto"
        >
            <template v-for="link in navLinks" :key="link.to">
                <div v-if="link.condition !== false">
                    <router-link
                        :to="link.to"
                        @click="closeMobileMenu"
                        :class="['mobile-nav-link block', isRouteActive(link.to) ? 'mobile-nav-link-active' : '', link.extraClass]"
                    >{{ link.label }}</router-link>

                    <div
                        v-if="link.children?.length"
                        class="mt-1 grid gap-1 pl-4"
                    >
                        <router-link
                            v-for="child in link.children"
                            :key="child.to"
                            :to="child.to"
                            @click="closeMobileMenu"
                            :class="['mobile-nav-child-link', isDropdownItemActive(child) ? 'mobile-nav-child-link-active' : '']"
                        >
                            {{ child.label }}
                        </router-link>
                    </div>
                </div>
            </template>

            <hr class="border-border-light" />

            <template v-if="authStore.isAuthenticated">
                <div class="space-y-1">
                    <p class="text-[9px] uppercase tracking-[0.3em] font-bold text-text-muted mb-3">Đang đăng nhập</p>
                    <p class="text-lg font-bold text-fashion-black mb-1">{{ authStore.userName }}</p>
                    <p :class="['text-xs font-medium mb-4 flex items-center gap-1', currentTier.color]">
                        <span class="material-symbols-outlined text-[14px]">{{ currentTier.icon }}</span>
                        {{ currentTier.label }}
                    </p>

                    <template v-for="item in profileMenuItems" :key="item.key">
                        <hr v-if="item.dividerBefore" class="border-border-light my-2" />

                        <router-link
                            v-if="item.to"
                            :to="item.to"
                            @click.prevent="item.key === 'profile' ? handleProfileNavigation(item.to) : (closeMobileMenu(), router.push(item.to))"
                            :class="[
                                'flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                isRouteActive(item.to)
                                    ? 'bg-primary/10 text-primary'
                                    : (item.extraClass ?? 'text-fashion-black hover:text-primary')
                            ]"
                        >
                            <span class="material-symbols-outlined text-[18px]">{{ item.icon }}</span>
                            {{ item.label }}
                        </router-link>

                        <button
                            v-else-if="item.action"
                            @click="item.action"
                            :class="['w-full flex items-center gap-2 py-2 text-sm font-medium transition-colors', item.extraClass ?? 'text-fashion-black']"
                        >
                            <span class="material-symbols-outlined text-[18px]">{{ item.icon }}</span>
                            {{ item.label }}
                        </button>
                    </template>
                </div>
            </template>
            <template v-else>
                <div class="flex flex-col gap-3">
                    <router-link :to="{ name: 'login' }" @click="closeMobileMenu" class="w-full border border-fashion-black py-3 text-sm font-medium text-center hover:bg-border-light transition-colors rounded">Đăng nhập</router-link>
                    <router-link :to="{ name: 'register' }" @click="closeMobileMenu" class="w-full bg-fashion-black text-white py-3 text-sm font-medium text-center hover:bg-zinc-700 transition-colors rounded">Đăng ký</router-link>
                </div>
            </template>
        </div>
    </Transition>

    <BodyMeasurementsModal
        :is-open="isMeasurementsModalOpen"
        :initial-height="authStore.user?.height_cm"
        :initial-weight="authStore.user?.weight_kg"
        :is-saving="isSavingMeasurements"
        @save="saveBodyMeasurements"
        @defer="continueToProfile"
    />
</template>

<style scoped>
@reference "../../assets/main.css";

.nav-link {
    @apply relative rounded-full px-3 py-2 text-sm font-medium text-fashion-black hover:text-primary transition-colors;
}

.nav-link-active {
    @apply bg-primary/10 text-primary;
}

.icon-btn {
    @apply p-2 rounded-full hover:bg-border-light text-fashion-black transition-colors cursor-pointer relative;
}

.icon-btn-active {
    @apply bg-primary/10 text-primary;
}

.dropdown-item {
    @apply flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-600 hover:bg-border-light hover:text-fashion-black transition-colors;
}

.dropdown-item-active {
    @apply bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary;
}

.nav-dropdown-item {
    @apply block px-4 py-2.5 text-sm font-medium text-fashion-black transition-colors hover:bg-border-light hover:text-primary;
}

.nav-dropdown-item-active {
    @apply bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary;
}

.mobile-nav-link {
    @apply rounded-lg px-3 py-2 text-lg font-medium text-fashion-black hover:text-primary transition-colors;
}

.mobile-nav-link-active {
    @apply bg-primary/10 text-primary;
}

.mobile-nav-child-link {
    @apply rounded-lg px-3 py-2 text-sm font-medium text-zinc-600 transition-colors hover:bg-border-light hover:text-primary;
}

.mobile-nav-child-link-active {
    @apply bg-primary/10 text-primary;
}

.notification-item {
    @apply flex w-full items-center gap-3 border-b border-border-light px-4 py-3 text-center transition-colors last:border-b-0 hover:bg-border-light/60;
}

.notification-panel-enter-active,
.notification-panel-leave-active {
    transition: opacity 0.2s ease, transform 0.2s ease;
}

.notification-panel-enter-from,
.notification-panel-leave-to {
    opacity: 0;
    transform: translateY(-6px);
}

.mobile-menu-enter-active,
.mobile-menu-leave-active {
    transition: opacity 0.25s ease, transform 0.25s ease;
}
.mobile-menu-enter-from,
.mobile-menu-leave-to {
    opacity: 0;
    transform: translateY(-8px);
}
</style>
