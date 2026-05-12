<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCartStore } from '@/stores/useCartStore'
import { useUIStore } from '@/stores/useUIStore'
import { APP_NAME } from '@/lib/appConfig'
import type { NavLink, ProfileMenuItem } from './headerTypes'
import { membershipService, getTierByPoints } from '@/pages/profile/membershipService'

const authStore = useAuthStore()
const cartStore = useCartStore()
const uiStore = useUIStore()
const router = useRouter()

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)
const totalPoints = ref(0)

// Fetch điểm khi đã đăng nhập
onMounted(async () => {
    window.addEventListener('scroll', handleScroll, { passive: true })
    if (authStore.isAuthenticated) {
        try {
            const res = await membershipService.getRewardHistory()
            totalPoints.value = res.data.reduce((sum, item) => sum + item.points_delta, 0)
        } catch { /* silent */ }
    }
})

const currentTier = computed(() => getTierByPoints(totalPoints.value))

// ─── Scroll handler ───────────────────────────────────────────────────────────
const handleScroll = () => {
    isScrolled.value = window.scrollY > 60
}

onUnmounted(() => window.removeEventListener('scroll', handleScroll))

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
    router.push({ name: 'login' })
}

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
}

// ─── Nav links (desktop + mobile) ─────────────────────────────────────────────
const navLinks = computed<NavLink[]>(() => [
    { label: 'Bộ sưu tập', to: '/products' },
    { label: 'Ưu đãi', to: '/vouchers' },
    {
        label: 'Admin',
        to: '/admin',
        condition: authStore.isAdmin || authStore.isStaff,
        extraClass: '!text-amber-600',
    },
])

// ─── Profile dropdown items ────────────────────────────────────────────────────
const profileMenuItems = computed<ProfileMenuItem[]>(() => [
    {
        key: 'profile',
        label: 'Hồ sơ của tôi',
        icon: 'person',
        to: '/profile',
    },
    {
        key: 'cart',
        label: 'Giỏ hàng',
        icon: 'shopping_bag',
        to: '/cart',
    },
    {
        key: 'vouchers',
        label: 'Voucher của tôi',
        icon: 'local_offer',
        to: '/vouchers',
    },
    {
        key: 'orders',
        label: 'Đơn hàng của tôi',
        icon: 'package_2',
        to: '/orders',
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
                    <div class="w-8 h-8 text-primary">
                        <svg class="w-full h-full" fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                            <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor"/>
                            <path clip-rule="evenodd" d="M7.24189 26.4066C7.31369 26.4411 7.64204 26.5637 8.52504 26.3738C9.59462 26.1438 11.0343 25.5311 12.7183 24.4963C14.7583 23.2426 17.0256 21.4503 19.238 19.238C21.4503 17.0256 23.2426 14.7583 24.4963 12.7183C25.5311 11.0343 26.1438 9.59463 26.3738 8.52504C26.5637 7.64204 26.4411 7.31369 26.4066 7.24189C26.345 7.21246 26.143 7.14535 25.6664 7.1918C24.9745 7.25925 23.9954 7.5498 22.7699 8.14278C20.3369 9.32007 17.3369 11.4915 14.4142 14.4142C11.4915 17.3369 9.32007 20.3369 8.14278 22.7699C7.5498 23.9954 7.25925 24.9745 7.1918 25.6664C7.14534 26.143 7.21246 26.345 7.24189 26.4066ZM29.9001 10.7285C29.4519 12.0322 28.7617 13.4172 27.9042 14.8126C26.465 17.1544 24.4686 19.6641 22.0664 22.0664C19.6641 24.4686 17.1544 26.465 14.8126 27.9042C13.4172 28.7617 12.0322 29.4519 10.7285 29.9001L21.5754 40.747C21.6001 40.7606 21.8995 40.931 22.8729 40.7217C23.9424 40.4916 25.3821 39.879 27.0661 38.8441C29.1062 37.5904 31.3734 35.7982 33.5858 33.5858C35.7982 31.3734 37.5904 29.1062 38.8441 27.0661C39.879 25.3821 40.4916 23.9425 40.7216 22.8729C40.931 21.8995 40.7606 21.6001 40.747 21.5754L29.9001 10.7285ZM29.2403 4.41187L43.5881 18.7597C44.9757 20.1473 44.9743 22.1235 44.6322 23.7139C44.2714 25.3919 43.4158 27.2666 42.252 29.1604C40.8128 31.5022 38.8165 34.012 36.4142 36.4142C34.012 38.8165 31.5022 40.8128 29.1604 42.252C27.2666 43.4158 25.3919 44.2714 23.7139 44.6322C22.1235 44.9743 20.1473 44.9757 18.7597 43.5881L4.41187 29.2403C3.29027 28.1187 3.08209 26.5973 3.21067 25.2783C3.34099 23.9415 3.8369 22.4852 4.54214 21.0277C5.96129 18.0948 8.43335 14.7382 11.5858 11.5858C14.7382 8.43335 18.0948 5.9613 21.0277 4.54214C22.4852 3.8369 23.9415 3.34099 25.2783 3.21067C26.5973 3.08209 28.1187 3.29028 29.2403 4.41187Z" fill="currentColor" fill-rule="evenodd"/>
                        </svg>
                    </div>
                    <span class="text-xl font-bold tracking-tight text-fashion-black">{{ APP_NAME }}</span>
                </router-link>

                <!-- Desktop Nav -->
                <nav class="hidden md:flex items-center gap-8">
                    <template v-for="link in navLinks" :key="link.to">
                        <router-link
                            v-if="link.condition !== false"
                            :to="link.to"
                            :class="['nav-link', link.extraClass]"
                        >{{ link.label }}</router-link>
                    </template>
                </nav>
            </div>

            <!-- RIGHT: Search + Icons -->
            <div class="flex items-center gap-6">
                <!-- Search (desktop) -->
                <div class="hidden lg:flex relative group w-64">
                    <div class="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                        <span class="material-symbols-outlined text-[20px]">search</span>
                    </div>
                    <input
                        class="w-full bg-border-light/50 border-none rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary focus:bg-white transition-all outline-none placeholder:text-text-muted/70"
                        placeholder="Tìm kiếm sản phẩm..."
                        type="text"
                    />
                </div>

                <!-- Icon buttons -->
                <div class="flex items-center gap-1">
                    <!-- Cart -->
                    <router-link to="/cart" class="icon-btn relative">
                        <span class="material-symbols-outlined text-[24px]">shopping_bag</span>
                        <span
                            v-if="cartStore.totalQuantity > 0"
                            class="absolute -top-1 -right-1 bg-primary text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none"
                        >{{ cartStore.totalQuantity }}</span>
                    </router-link>

                    <!-- Auth: logged in -->
                    <template v-if="authStore.isAuthenticated">
                        <div class="relative group">
                            <button class="icon-btn">
                                <span class="material-symbols-outlined text-[24px]">person</span>
                            </button>
                            <!-- Dropdown -->
                            <div class="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                                <div class="bg-white border border-border-light shadow-xl rounded-lg py-2 w-52">
                                    <!-- User info -->
                                    <div class="px-4 py-2 border-b border-border-light mb-1">
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
                                            :class="['dropdown-item', item.extraClass]"
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

                    <!-- Wishlist -->
                    <button class="icon-btn">
                        <span class="material-symbols-outlined text-[24px]">favorite</span>
                    </button>

                    <!-- Mobile hamburger -->
                    <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="icon-btn md:hidden ml-1">
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
            <!-- Search mobile -->
            <div class="relative">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px]">search</span>
                <input
                    class="w-full bg-white border border-border-light rounded-full py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-1 focus:ring-primary placeholder:text-text-muted/70"
                    placeholder="Tìm kiếm sản phẩm..."
                    type="text"
                />
            </div>

            <hr class="border-border-light" />

            <template v-for="link in navLinks" :key="link.to">
                <router-link
                    v-if="link.condition !== false"
                    :to="link.to"
                    @click="closeMobileMenu"
                    :class="['mobile-nav-link', link.extraClass]"
                >{{ link.label }}</router-link>
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
                            @click="closeMobileMenu"
                            :class="['flex items-center gap-2 py-2 text-sm font-medium hover:text-primary transition-colors', item.extraClass ?? 'text-fashion-black']"
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
</template>

<style scoped>
@reference "../../assets/main.css";

.nav-link {
    @apply text-sm font-medium text-fashion-black hover:text-primary transition-colors;
}

.icon-btn {
    @apply p-2 rounded-full hover:bg-border-light text-fashion-black transition-colors cursor-pointer relative;
}

.dropdown-item {
    @apply flex items-center gap-2 px-4 py-2.5 text-sm text-zinc-600 hover:bg-border-light hover:text-fashion-black transition-colors;
}

.mobile-nav-link {
    @apply text-lg font-medium text-fashion-black hover:text-primary transition-colors;
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
