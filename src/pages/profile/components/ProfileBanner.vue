<script setup lang="ts">
import type { ProfileTab } from '../profileHandler'

defineProps<{
    userName: string
    email: string
    orderCount: number
    addressCount: number
    role: string
    activeTab: ProfileTab
}>()

const emit = defineEmits<{
    'update:activeTab': [tab: ProfileTab]
    logout: []
}>()

const navItems: { key: ProfileTab; icon: string; label: string }[] = [
    { key: 'profile',   icon: 'person',      label: 'Hồ sơ'    },
    { key: 'orders',    icon: 'package_2',   label: 'Đơn hàng' },
    { key: 'addresses', icon: 'location_on', label: 'Địa chỉ'  },
]
</script>

<template>
    <!-- Sidebar bên trái -->
    <aside class="w-full md:w-64 flex-shrink-0">

        <!-- User card -->
        <div class="bg-white border border-border-light rounded-xl p-6 mb-4 shadow-sm">
            <div class="flex flex-col items-center text-center gap-3">
                <div class="w-16 h-16 rounded-full bg-primary-light border-2 border-primary/20 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-3xl" style="font-variation-settings:'FILL' 1">person</span>
                </div>
                <div>
                    <h2 class="font-bold text-fashion-black font-display">{{ userName }}</h2>
                    <p class="text-xs text-text-muted font-display mt-0.5">{{ email }}</p>
                    <span class="inline-block mt-2 text-[9px] uppercase tracking-widest font-bold text-primary bg-primary-light px-2.5 py-1 rounded-full font-display capitalize">
                        {{ role }}
                    </span>
                </div>
            </div>

            <!-- Stats -->
            <div class="flex justify-around mt-5 pt-5 border-t border-border-light">
                <div class="text-center">
                    <p class="text-xl font-bold text-fashion-black font-display">{{ orderCount }}</p>
                    <p class="text-[9px] uppercase tracking-widest text-text-muted font-display mt-0.5">Đơn hàng</p>
                </div>
                <div class="w-px bg-border-light"></div>
                <div class="text-center">
                    <p class="text-xl font-bold text-fashion-black font-display">{{ addressCount }}</p>
                    <p class="text-[9px] uppercase tracking-widest text-text-muted font-display mt-0.5">Địa chỉ</p>
                </div>
            </div>
        </div>

        <!-- Nav -->
        <nav class="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
            <button
                v-for="item in navItems"
                :key="item.key"
                @click="emit('update:activeTab', item.key)"
                :class="[
                    'w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium transition-all text-left border-b border-border-light last:border-0 font-display',
                    activeTab === item.key
                        ? 'bg-primary-light text-primary font-bold'
                        : 'text-text-muted hover:bg-fashion-gray hover:text-fashion-black'
                ]"
            >
                <span
                    class="material-symbols-outlined text-[20px]"
                    :style="activeTab === item.key ? 'font-variation-settings:\'FILL\' 1' : ''"
                >{{ item.icon }}</span>
                {{ item.label }}
                <span v-if="activeTab === item.key" class="ml-auto w-1.5 h-1.5 rounded-full bg-primary"></span>
            </button>

            <button
                @click="emit('logout')"
                class="w-full flex items-center gap-3 px-5 py-3.5 text-sm font-medium text-text-muted hover:bg-red-50 hover:text-red-500 transition-all text-left font-display"
            >
                <span class="material-symbols-outlined text-[20px]">logout</span>
                Đăng xuất
            </button>
        </nav>
    </aside>
</template>
