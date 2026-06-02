<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter, type RouteLocationRaw } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCartStore } from '@/stores/useCartStore'

type NavbarSection = 'main' | 'action' | 'guest'

interface NavbarItem {
    key: string
    label: string
    icon: string
    to: RouteLocationRaw
    section: NavbarSection
    adminOnly?: boolean
    showWhenAuthenticated?: boolean
    showWhenGuest?: boolean
    showCartBadge?: boolean
    desktopClass?: string
    mobileClass?: string
}

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()

const isMenuOpen = ref(false)

const navbarItems = computed<NavbarItem[]>(() => [
    {
        key: 'products',
        label: 'Bộ sưu tập',
        icon: 'styler',
        to: { name: 'products' },
        section: 'main',
    },
    {
        key: 'men-products',
        label: 'Nam',
        icon: 'styler',
        to: { name: 'products' },
        section: 'main',
    },
    {
        key: 'women-products',
        label: 'Nữ',
        icon: 'styler',
        to: { name: 'products' },
        section: 'main',
    },
    {
        key: 'admin',
        label: 'Admin Dashboard',
        icon: 'dashboard',
        to: { name: 'admin' },
        section: 'main',
        adminOnly: true,
        desktopClass: '!text-amber-600',
        mobileClass: '!text-amber-600',
    },
    {
        key: 'cart',
        label: 'Giỏ hàngg',
        icon: 'shopping_bag',
        to: { name: 'cart' },
        section: 'action',
        showCartBadge: true,
    },
    {
        key: 'profile',
        label: 'Hồ sơ',
        icon: 'person',
        to: { name: 'profile' },
        section: 'action',
        showWhenAuthenticated: true,
    },
    {
        key: 'login',
        label: 'Đăng nhập',
        icon: 'login',
        to: { name: 'login' },
        section: 'guest',
        showWhenGuest: true,
    },
    {
        key: 'register',
        label: 'Đăng ký',
        icon: 'person_add',
        to: { name: 'register' },
        section: 'guest',
        showWhenGuest: true,
        desktopClass: '!bg-zinc-900 !text-white px-6 py-2.5 hover:!bg-zinc-800 hover:!text-white',
        mobileClass: 'bg-zinc-900 text-white border-zinc-900',
    },
])

const visibleNavbarItems = computed(() =>
    navbarItems.value.filter((item) => {
        if (item.adminOnly && !authStore.isAdmin) return false
        if (item.showWhenAuthenticated && !authStore.isAuthenticated) return false
        if (item.showWhenGuest && authStore.isAuthenticated) return false

        return true
    })
)

const mainNavItems = computed(() =>
    visibleNavbarItems.value.filter((item) => item.section === 'main')
)

const desktopActionItems = computed(() =>
    visibleNavbarItems.value.filter((item) => item.section === 'action')
)

const guestNavItems = computed(() =>
    visibleNavbarItems.value.filter((item) => item.section === 'guest')
)

const mobileNavItems = computed(() =>
    visibleNavbarItems.value.filter((item) => item.section !== 'guest')
)

const profileNavItems = computed(() =>
    desktopActionItems.value.filter((item) => item.key === 'profile')
)

const closeMenu = () => {
    isMenuOpen.value = false
}

const handleLogout = () => {
    authStore.logout()
    closeMenu()
    router.push({ name: 'login' })
}

const toggleMenu = () => {
    isMenuOpen.value = !isMenuOpen.value
}
</script>

<template>
    <nav class="bg-white border-b border-zinc-100 sticky top-0 z-[100]">
        <div class="max-w-[1600px] mx-auto px-6 md:px-12 py-5 flex justify-between items-center">
            
            <!-- Logo -->
            <router-link to="/" class="flex flex-col items-center">
                <h1 class="text-2xl font-serif tracking-tight text-zinc-900">AZURE</h1>
                <p class="text-[7px] uppercase tracking-[0.5em] text-zinc-400 -mt-1 font-bold">Editorial</p>
            </router-link>

            <!-- Desktop Menu -->
            <div class="hidden md:flex items-center gap-10">
                <router-link
                    v-for="item in mainNavItems"
                    :key="item.key"
                    :to="item.to"
                    :class="['nav-link inline-flex items-center gap-1.5', item.desktopClass]"
                >
                    <span class="material-symbols-outlined text-[15px]">{{ item.icon }}</span>
                    {{ item.label }}
                </router-link>
            </div>

            <!-- Actions -->
            <div class="hidden md:flex items-center gap-8">
                <!-- Cart Icon -->
                <template v-for="item in desktopActionItems" :key="item.key">
                    <router-link v-if="item.key === 'cart'" :to="item.to" class="relative group">
                        <span class="material-symbols-outlined text-zinc-900 transition-colors group-hover:text-zinc-500">{{ item.icon }}</span>
                        <span v-if="item.showCartBadge && cartStore.totalQuantity > 0" class="absolute -top-2 -right-2 bg-zinc-900 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                            {{ cartStore.totalQuantity }}
                        </span>
                    </router-link>
                </template>

                <!-- Auth Logic -->
                <template v-if="authStore.isAuthenticated">
                    <div class="flex items-center gap-6">
                        <router-link
                            v-for="item in profileNavItems"
                            :key="item.key"
                            :to="item.to"
                            class="flex flex-col items-end group/user"
                        >
                            <span class="text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover/user:text-zinc-600 transition-colors">Chào mừng</span>
                            <span class="text-xs font-medium text-zinc-900 group-hover/user:text-zinc-500 transition-colors">{{ authStore.userName }}</span>
                        </router-link>
                        <button @click="handleLogout" class="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700 transition-colors">Đăng xuất</button>
                    </div>
                </template>
                <template v-else>
                    <div class="flex items-center gap-6">
                        <router-link
                            v-for="item in guestNavItems"
                            :key="item.key"
                            :to="item.to"
                            :class="['nav-link inline-flex items-center gap-1.5', item.desktopClass]"
                        >
                            <span class="material-symbols-outlined text-[15px]">{{ item.icon }}</span>
                            {{ item.label }}
                        </router-link>
                    </div>
                </template>
            </div>

            <!-- Mobile Hamburger Button -->
            <button @click="toggleMenu" class="md:hidden text-zinc-900 focus:outline-none">
                <span class="material-symbols-outlined text-3xl">{{ isMenuOpen ? 'close' : 'menu' }}</span>
            </button>
        </div>

        <!-- Mobile Menu Overlay -->
        <transition name="fade">
            <div v-if="isMenuOpen" class="fixed inset-0 top-[73px] bg-white z-[90] md:hidden p-8 flex flex-col gap-8 border-t border-zinc-100">
                <router-link
                    v-for="item in mobileNavItems"
                    :key="item.key"
                    :to="item.to"
                    :class="['mobile-nav-link flex items-center justify-between gap-4', item.mobileClass]"
                    @click="closeMenu"
                >
                    <span class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-[22px]">{{ item.icon }}</span>
                        <span>{{ item.key === 'profile' ? authStore.userName : item.label }}</span>
                    </span>
                    <span v-if="item.showCartBadge">({{ cartStore.totalQuantity }})</span>
                </router-link>

                <hr class="border-zinc-100" />

                <template v-if="authStore.isAuthenticated">
                    <div class="py-4">
                        <p class="text-[10px] uppercase tracking-widest text-zinc-400 font-bold mb-2">Đang đăng nhập với tư cách</p>
                        <p class="text-lg font-serif font-bold mb-6 italic">{{ authStore.userName }}</p>
                        <button @click="handleLogout" class="w-full border border-red-200 text-red-500 py-4 text-[10px] uppercase tracking-widest font-bold">Đăng xuất</button>
                    </div>
                </template>
                <template v-else>
                    <div class="flex flex-col gap-4">
                        <router-link
                            v-for="item in guestNavItems"
                            :key="item.key"
                            :to="item.to"
                            :class="['w-full border border-zinc-900 py-4 text-[10px] uppercase tracking-widest font-bold text-center inline-flex items-center justify-center gap-2', item.mobileClass]"
                            @click="closeMenu"
                        >
                            <span class="material-symbols-outlined text-[16px]">{{ item.icon }}</span>
                            {{ item.label }}
                        </router-link>
                    </div>
                </template>
            </div>
        </transition>
    </nav>
</template>

<style scoped>
@reference "../../assets/main.css";

.nav-link {
    @apply text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 transition-colors hover:text-zinc-500;
}

.mobile-nav-link {
    @apply text-xl font-serif font-bold text-zinc-900 italic;
}

.fade-enter-active, .fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}
.fade-enter-from, .fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
