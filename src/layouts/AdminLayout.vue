<script setup lang="ts">
import { ref } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()
const router = useRouter()
const route = useRoute()
const isMobileMenuOpen = ref(false)

const menuItems = [
    { name: 'Tổng quan',       icon: 'dashboard',           routeName: 'admin-overview'  },
    { name: 'Sản phẩm',        icon: 'inventory_2',         routeName: 'admin-products'  },
    { name: 'Kho hàng',        icon: 'swap_horiz',          routeName: 'admin-inventory' },
    { name: 'Đơn hàng',        icon: 'shopping_cart',       routeName: 'admin-orders'    },
    { name: 'Người dùng',      icon: 'group',               routeName: 'admin-users'     },
    { name: 'Voucher',         icon: 'confirmation_number', routeName: 'admin-vouchers'  },
]

const pageTitles: Record<string, string> = {
    'admin-overview':  'Tổng quan',
    'admin-products':  'Quản lý Sản phẩm',
    'admin-inventory': 'Quản lý Kho',
    'admin-orders':    'Quản lý Đơn hàng',
    'admin-users':     'Quản lý Người dùng',
    'admin-vouchers':  'Quản lý Voucher',
}

const handleLogout = () => {
    authStore.logout()
    router.push({ name: 'login' })
}
</script>

<template>
    <div class="flex min-h-screen bg-slate-50 font-display antialiased">

        <!-- ── SIDEBAR ─────────────────────────────────────────── -->
        <aside
            :class="['w-64 bg-white border-r border-slate-200 fixed h-full z-50 flex flex-col transition-transform duration-300 shadow-sm',
                isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0']"
        >
            <!-- Logo -->
            <div class="px-6 py-6 border-b border-slate-100">
                <div class="flex items-center gap-3">
                    <div class="w-8 h-8 bg-slate-900 rounded-lg flex items-center justify-center">
                        <span class="material-symbols-outlined text-white text-[16px]">storefront</span>
                    </div>
                    <div>
                        <h1 class="text-sm font-bold text-slate-900 tracking-tight">Azure Admin</h1>
                        <p class="text-[9px] text-slate-400 uppercase tracking-widest">Management</p>
                    </div>
                </div>
            </div>

            <!-- Nav -->
            <nav class="flex-grow px-4 py-6 space-y-1 overflow-y-auto">
                <router-link
                    v-for="item in menuItems"
                    :key="item.routeName"
                    :to="{ name: item.routeName }"
                    @click="isMobileMenuOpen = false"
                    :class="[
                        'flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 group',
                        route.name === item.routeName
                            ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                            : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
                    ]"
                >
                    <span :class="['material-symbols-outlined text-[20px] transition-colors', route.name === item.routeName ? 'text-white' : 'text-slate-400 group-hover:text-slate-700']">
                        {{ item.icon }}
                    </span>
                    <span class="text-[11px] font-semibold tracking-wide">{{ item.name }}</span>
                </router-link>
            </nav>

            <!-- Footer -->
            <div class="px-4 py-4 border-t border-slate-100 space-y-1">
                <router-link
                    to="/"
                    class="flex items-center gap-3 px-3 py-2.5 rounded-xl text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-all"
                >
                    <span class="material-symbols-outlined text-[20px]">open_in_new</span>
                    <span class="text-[11px] font-semibold tracking-wide">Về cửa hàng</span>
                </router-link>
                <button
                    @click="handleLogout"
                    class="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-400 hover:bg-red-50 hover:text-red-600 transition-all"
                >
                    <span class="material-symbols-outlined text-[20px]">logout</span>
                    <span class="text-[11px] font-semibold tracking-wide">Đăng xuất</span>
                </button>
            </div>
        </aside>

        <!-- Mobile overlay -->
        <div
            v-if="isMobileMenuOpen"
            class="fixed inset-0 bg-black/30 z-40 md:hidden"
            @click="isMobileMenuOpen = false"
        ></div>

        <!-- ── MAIN ────────────────────────────────────────────── -->
        <div class="flex-grow md:ml-64 flex flex-col min-h-screen">

            <!-- Topbar -->
            <header class="h-16 bg-white border-b border-slate-200 sticky top-0 z-30 px-6 flex items-center justify-between shadow-sm">
                <!-- Mobile menu toggle -->
                <button @click="isMobileMenuOpen = !isMobileMenuOpen" class="md:hidden p-2 rounded-lg hover:bg-slate-100 transition-colors">
                    <span class="material-symbols-outlined text-slate-600">menu</span>
                </button>

                <!-- Breadcrumb -->
                <div class="hidden md:flex items-center gap-2 text-sm">
                    <span class="text-slate-400">Admin</span>
                    <span class="text-slate-300">/</span>
                    <span class="text-slate-700 font-semibold">{{ pageTitles[route.name as string] || 'Dashboard' }}</span>
                </div>

                <!-- User info -->
                <div class="flex items-center gap-3 ml-auto">
                    <div class="text-right hidden sm:block">
                        <p class="text-sm font-semibold text-slate-800 leading-tight">{{ authStore.userName }}</p>
                        <p class="text-[10px] text-slate-400 uppercase tracking-widest">{{ authStore.user?.role || 'Admin' }}</p>
                    </div>
                    <div class="w-9 h-9 bg-gradient-to-br from-slate-700 to-slate-900 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-sm">
                        {{ authStore.userName?.charAt(0)?.toUpperCase() || 'A' }}
                    </div>
                </div>
            </header>

            <!-- Page content -->
            <main class="flex-grow p-6 md:p-8">
                <router-view />
            </main>
        </div>
    </div>
</template>

<style scoped>
/* font-display đã được khai báo global trong main.css — không cần override */
</style>
