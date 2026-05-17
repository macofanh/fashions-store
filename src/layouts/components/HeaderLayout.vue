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
const loadRewardHistory = async () => {
    if (!authStore.isAuthenticated) return
    try {
        const res = await membershipService.getRewardHistory()
        totalPoints.value = res.data.reduce((sum, item) => sum + item.points_delta, 0)
    } catch { /* silent */ }
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })

    const schedule = window.requestIdleCallback
        ? window.requestIdleCallback
        : (cb: () => void) => window.setTimeout(cb, 0)

    schedule(() => {
        void loadRewardHistory()
    })
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
        to: '/profile?tab=profile',
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
