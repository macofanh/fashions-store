<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()

const menuItems = [
    { name: 'Tổng quan', icon: 'dashboard', routeName: 'admin-overview' },
    { name: 'Quản lý Sản phẩm', icon: 'inventory_2', routeName: 'admin-products' },
    { name: 'Quản lý Kho', icon: 'swap_horiz', routeName: 'admin-inventory' },
    { name: 'Quản lý Đơn hàng', icon: 'shopping_cart', routeName: 'admin-orders' },
    { name: 'Quản lý Người dùng', icon: 'group', routeName: 'admin-users' },
    { name: 'Quản lý Voucher', icon: 'confirmation_number', routeName: 'admin-vouchers' },
]

const handleLogout = () => {
    authStore.logout()
    router.push({ name: 'login' })
}
</script>

<template>
    <div class="flex min-h-screen bg-zinc-50 font-body antialiased">
        <!-- SIDEBAR CỐ ĐỊNH -->
        <aside class="w-72 bg-zinc-900 text-white fixed h-full z-50 flex flex-col">
            <!-- Sidebar Header -->
            <div class="p-8 border-b border-white/5">
                <h1 class="text-xl serif-text tracking-tighter italic">Azure Admin</h1>
                <p class="text-[8px] uppercase tracking-[0.4em] text-zinc-500 mt-1">Management Suite</p>
            </div>

            <!-- Navigation Links -->
            <nav class="flex-grow p-6 space-y-2 mt-4">
                <router-link 
                    v-for="item in menuItems" 
                    :key="item.routeName"
                    :to="{ name: item.routeName }"
                    :class="[
                        'flex items-center gap-4 px-4 py-4 rounded-lg transition-all duration-300 group',
                        route.name === item.routeName ? 'bg-white text-zinc-900 shadow-lg shadow-black/20' : 'text-zinc-400 hover:bg-white/5 hover:text-white'
                    ]"
                >
                    <span class="material-symbols-outlined text-xl">{{ item.icon }}</span>
                    <span class="text-[11px] uppercase tracking-widest font-bold">{{ item.name }}</span>
                </router-link>
            </nav>

            <!-- Sidebar Footer -->
            <div class="p-6 border-t border-white/5">
                <router-link to="/" class="flex items-center gap-4 px-4 py-4 text-zinc-500 hover:text-white transition-colors">
                    <span class="material-symbols-outlined text-xl">store</span>
                    <span class="text-[10px] uppercase tracking-widest font-bold">Về cửa hàng</span>
                </router-link>
            </div>
        </aside>

        <!-- MAIN CONTENT AREA -->
        <div class="flex-grow ml-72 flex flex-col">
            <!-- HEADER PHÍA TRÊN -->
            <header class="h-20 bg-white border-b border-zinc-200 sticky top-0 z-40 px-10 flex justify-between items-center">
                <div>
                    <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400">Trang quản trị / <span class="text-zinc-900">{{ route.name }}</span></h2>
                </div>

                <div class="flex items-center gap-8">
                    <div class="flex items-center gap-4 text-right">
                        <div>
                            <p class="text-[11px] font-bold text-zinc-900">{{ authStore.userName }}</p>
                            <p class="text-[9px] uppercase tracking-widest text-zinc-400 font-medium">Quản trị viên</p>
                        </div>
                        <div class="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200">
                            <span class="material-symbols-outlined text-zinc-400">person</span>
                        </div>
                    </div>
                    
                    <button @click="handleLogout" class="text-zinc-400 hover:text-red-500 transition-colors">
                        <span class="material-symbols-outlined">logout</span>
                    </button>
                </div>
            </header>

            <!-- NỘI DUNG THAY ĐỔI THEO ROUTE -->
            <main class="p-10">
                <router-view />
            </main>
        </div>
    </div>
</template>

<style scoped>
.serif-text {
    font-family: 'Playfair Display', serif;
}
</style>
