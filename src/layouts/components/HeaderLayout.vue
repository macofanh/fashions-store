<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCartStore } from '@/stores/useCartStore'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()

const isScrolled = ref(false)
const isMobileMenuOpen = ref(false)

const handleScroll = () => {
    isScrolled.value = window.scrollY > 60
}

onMounted(() => {
    window.addEventListener('scroll', handleScroll, { passive: true })
})

onUnmounted(() => {
    window.removeEventListener('scroll', handleScroll)
})

const handleLogout = () => {
    window.google?.accounts.id.disableAutoSelect()
    authStore.logout()
    isMobileMenuOpen.value = false
    router.push({ name: 'login' })
}

const closeMobileMenu = () => {
    isMobileMenuOpen.value = false
}
</script>

<template>
    <!-- Spacer để nội dung không bị header che -->
    <div class="h-[72px]"></div>

    <header
        :class="[
            'fixed top-0 left-0 w-full z-[100] transition-all duration-500',
            isScrolled
                ? 'bg-white/95 backdrop-blur-md border-b border-zinc-100 shadow-sm py-4'
                : 'bg-white border-b border-zinc-100 py-5'
        ]"
    >
        <div class="max-w-[1600px] mx-auto px-6 md:px-12 flex items-center justify-between">

            <!-- LEFT: Navigation (desktop) -->
            <nav class="hidden md:flex items-center gap-10 w-1/3">
                <router-link to="/products" class="nav-link">Bộ sưu tập</router-link>
                <router-link to="/vouchers" class="nav-link">Ưu đãi</router-link>
                <router-link v-if="authStore.isAdmin" to="/admin" class="nav-link text-amber-600">Admin</router-link>
            </nav>

            <!-- CENTER: Logo -->
            <router-link to="/" class="flex flex-col items-center absolute left-1/2 -translate-x-1/2">
                <h1 class="text-2xl md:text-3xl font-serif tracking-tight text-fashion-black leading-none">AZURE</h1>
                <p class="text-[7px] uppercase tracking-[0.5em] text-zinc-400 mt-0.5 font-bold">Editorial</p>
            </router-link>

            <!-- RIGHT: Actions (desktop) -->
            <div class="hidden md:flex items-center gap-6 w-1/3 justify-end">
                <!-- Cart -->
                <router-link to="/cart" class="icon-btn relative">
                    <span class="material-symbols-outlined text-[22px]">shopping_bag</span>
                    <span
                        v-if="cartStore.totalQuantity > 0"
                        class="absolute -top-1.5 -right-1.5 bg-fashion-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold leading-none"
                    >{{ cartStore.totalQuantity }}</span>
                </router-link>

                <!-- Auth -->
                <template v-if="authStore.isAuthenticated">
                    <div class="relative group">
                        <button class="icon-btn flex items-center gap-2">
                            <span class="material-symbols-outlined text-[22px]">person</span>
                            <span class="text-[10px] uppercase tracking-widest font-bold max-w-[80px] truncate">{{ authStore.userName }}</span>
                        </button>
                        <!-- Dropdown -->
                        <div class="absolute right-0 top-full pt-3 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none group-hover:pointer-events-auto">
                            <div class="bg-white border border-zinc-100 shadow-xl py-2 w-52">
                                <router-link to="/profile" class="dropdown-item">
                                    <span class="material-symbols-outlined text-[16px]">person</span>
                                    Hồ sơ của tôi
                                </router-link>
                                <router-link to="/cart" class="dropdown-item">
                                    <span class="material-symbols-outlined text-[16px]">shopping_bag</span>
                                    Giỏ hàng
                                </router-link>
                                <router-link to="/vouchers" class="dropdown-item">
                                    <span class="material-symbols-outlined text-[16px]">local_offer</span>
                                    Voucher của tôi
                                </router-link>
                                <hr class="border-zinc-100 my-1" />
                                <button @click="handleLogout" class="dropdown-item text-red-500 w-full text-left">
                                    <span class="material-symbols-outlined text-[16px]">logout</span>
                                    Đăng xuất
                                </button>
                            </div>
                        </div>
                    </div>
                </template>
                <template v-else>
                    <router-link :to="{ name: 'login' }" class="nav-link">Đăng nhập</router-link>
                    <router-link
                        :to="{ name: 'register' }"
                        class="bg-fashion-black text-white px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-700 transition-colors"
                    >Đăng ký</router-link>
                </template>
            </div>

            <!-- MOBILE: Logo + actions -->
            <div class="flex md:hidden items-center gap-4 ml-auto">
                <router-link to="/cart" class="icon-btn relative">
                    <span class="material-symbols-outlined text-[22px]">shopping_bag</span>
                    <span
                        v-if="cartStore.totalQuantity > 0"
                        class="absolute -top-1.5 -right-1.5 bg-fashion-black text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                    >{{ cartStore.totalQuantity }}</span>
                </router-link>
                <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="icon-btn">
                    <span class="material-symbols-outlined text-[26px]">{{ isMobileMenuOpen ? 'close' : 'menu' }}</span>
                </button>
            </div>
        </div>
    </header>

    <!-- Mobile Menu -->
    <Transition name="mobile-menu">
        <div
            v-if="isMobileMenuOpen"
            class="fixed inset-0 top-[72px] bg-white z-[90] md:hidden flex flex-col p-8 gap-6 border-t border-zinc-100 overflow-y-auto"
        >
            <router-link to="/products" @click="closeMobileMenu" class="mobile-nav-link">Bộ sưu tập</router-link>
            <router-link to="/vouchers" @click="closeMobileMenu" class="mobile-nav-link">Ưu đãi</router-link>
            <router-link v-if="authStore.isAdmin" to="/admin" @click="closeMobileMenu" class="mobile-nav-link text-amber-600">Admin Dashboard</router-link>

            <hr class="border-zinc-100" />

            <template v-if="authStore.isAuthenticated">
                <div class="space-y-4">
                    <p class="text-[9px] uppercase tracking-[0.3em] font-bold text-zinc-400">Đang đăng nhập</p>
                    <p class="text-xl font-serif italic text-fashion-black">{{ authStore.userName }}</p>
                    <router-link to="/profile" @click="closeMobileMenu" class="block text-[11px] uppercase tracking-widest font-bold text-zinc-600 hover:text-fashion-black py-2">Hồ sơ của tôi</router-link>
                    <button
                        @click="handleLogout"
                        class="w-full border border-red-200 text-red-500 py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-red-50 transition-colors"
                    >Đăng xuất</button>
                </div>
            </template>
            <template v-else>
                <div class="flex flex-col gap-3">
                    <router-link :to="{ name: 'login' }" @click="closeMobileMenu" class="w-full border border-fashion-black py-4 text-[10px] uppercase tracking-widest font-bold text-center hover:bg-zinc-50 transition-colors">Đăng nhập</router-link>
                    <router-link :to="{ name: 'register' }" @click="closeMobileMenu" class="w-full bg-fashion-black text-white py-4 text-[10px] uppercase tracking-widest font-bold text-center hover:bg-zinc-700 transition-colors">Đăng ký</router-link>
                </div>
            </template>
        </div>
    </Transition>
</template>

<style scoped>
@reference "../../assets/main.css";

.nav-link {
    @apply text-[10px] uppercase tracking-[0.2em] font-bold text-fashion-black transition-colors hover:text-zinc-500;
}

.icon-btn {
    @apply text-fashion-black transition-colors hover:text-zinc-500 cursor-pointer;
}

.dropdown-item {
    @apply flex items-center gap-2 px-5 py-2.5 text-[10px] uppercase tracking-widest font-bold text-zinc-600 hover:bg-zinc-50 hover:text-fashion-black transition-colors;
}

.mobile-nav-link {
    @apply text-2xl font-serif italic text-fashion-black hover:text-zinc-500 transition-colors;
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
