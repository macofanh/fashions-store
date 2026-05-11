<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCartStore } from '@/stores/useCartStore'

const authStore = useAuthStore()
const cartStore = useCartStore()
const router = useRouter()

const isMenuOpen = ref(false)

const handleLogout = () => {
    authStore.logout()
    isMenuOpen.value = false
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
                <router-link to="/products" class="nav-link">Bộ sưu tập</router-link>
                <router-link v-if="authStore.isAdmin" to="/admin" class="nav-link text-amber-600">Admin Dashboard</router-link>
            </div>

            <!-- Actions -->
            <div class="hidden md:flex items-center gap-8">
                <!-- Cart Icon -->
                <router-link to="/cart" class="relative group">
                    <span class="material-symbols-outlined text-zinc-900 transition-colors group-hover:text-zinc-500">shopping_bag</span>
                    <span v-if="cartStore.totalQuantity > 0" class="absolute -top-2 -right-2 bg-zinc-900 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                        {{ cartStore.totalQuantity }}
                    </span>
                </router-link>

                <!-- Auth Logic -->
                <template v-if="authStore.isAuthenticated">
                    <div class="flex items-center gap-6">
                        <router-link :to="{ name: 'profile' }" class="flex flex-col items-end group/user">
                            <span class="text-[10px] uppercase tracking-widest text-zinc-400 font-bold group-hover/user:text-zinc-600 transition-colors">Chào mừng</span>
                            <span class="text-xs font-medium text-zinc-900 group-hover/user:text-zinc-500 transition-colors">{{ authStore.userName }}</span>
                        </router-link>
                        <button @click="handleLogout" class="text-[10px] uppercase tracking-widest font-bold text-red-500 hover:text-red-700 transition-colors">Đăng xuất</button>
                    </div>
                </template>
                <template v-else>
                    <div class="flex items-center gap-6">
                        <router-link :to="{ name: 'login' }" class="nav-link">Đăng nhập</router-link>
                        <router-link :to="{ name: 'register' }" class="bg-zinc-900 text-white px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-all">Đăng ký</router-link>
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
                <router-link to="/products" @click="isMenuOpen = false" class="mobile-nav-link">Bộ sưu tập</router-link>
                <router-link v-if="authStore.isAdmin" to="/admin" @click="isMenuOpen = false" class="mobile-nav-link text-amber-600">Admin Dashboard</router-link>
                <router-link to="/cart" @click="isMenuOpen = false" class="mobile-nav-link flex justify-between">
                    Giỏ hàng <span>({{ cartStore.totalQuantity }})</span>
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
                        <router-link :to="{ name: 'login' }" @click="isMenuOpen = false" class="w-full border border-zinc-900 py-4 text-[10px] uppercase tracking-widest font-bold text-center">Đăng nhập</router-link>
                        <router-link :to="{ name: 'register' }" @click="isMenuOpen = false" class="w-full bg-zinc-900 text-white py-4 text-[10px] uppercase tracking-widest font-bold text-center">Đăng ký</router-link>
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
