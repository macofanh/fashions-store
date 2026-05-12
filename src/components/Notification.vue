<script setup lang="ts">
import { useUIStore } from '@/stores/useUIStore'

const uiStore = useUIStore()

const config = {
    success: {
        icon: 'check_circle',
        iconColor: 'text-emerald-500',
        bar: 'bg-emerald-500',
        bg: 'bg-white',
        title: 'Thành công',
    },
    error: {
        icon: 'error',
        iconColor: 'text-red-500',
        bar: 'bg-red-500',
        bg: 'bg-white',
        title: 'Lỗi',
    },
    warning: {
        icon: 'warning',
        iconColor: 'text-amber-500',
        bar: 'bg-amber-500',
        bg: 'bg-white',
        title: 'Cảnh báo',
    },
    info: {
        icon: 'info',
        iconColor: 'text-primary',
        bar: 'bg-primary',
        bg: 'bg-white',
        title: 'Thông báo',
    },
} as const
</script>

<template>
    <Teleport to="body">
        <div class="fixed top-5 right-5 z-[300] flex flex-col gap-3 pointer-events-none w-[340px]">
            <TransitionGroup name="notif">
                <div
                    v-for="toast in uiStore.toasts"
                    :key="toast.id"
                    :class="[
                        'relative flex items-start gap-3 px-4 py-3.5 rounded-xl shadow-xl border border-zinc-100 pointer-events-auto overflow-hidden',
                        config[toast.type].bg
                    ]"
                >
                    <!-- Colored left bar -->
                    <div :class="['absolute left-0 top-0 bottom-0 w-1 rounded-l-xl', config[toast.type].bar]"></div>

                    <!-- Icon -->
                    <span
                        :class="['material-symbols-outlined text-[22px] shrink-0 mt-0.5 ml-1', config[toast.type].iconColor]"
                        style="font-variation-settings:'FILL' 1"
                    >{{ config[toast.type].icon }}</span>

                    <!-- Text -->
                    <div class="flex-grow min-w-0">
                        <p class="text-[11px] font-bold uppercase tracking-widest text-zinc-400 mb-0.5">
                            {{ config[toast.type].title }}
                        </p>
                        <p class="text-sm text-zinc-800 leading-snug break-words">{{ toast.message }}</p>
                    </div>

                    <!-- Close -->
                    <button
                        @click="uiStore.removeToast(toast.id)"
                        class="shrink-0 text-zinc-300 hover:text-zinc-600 transition-colors mt-0.5"
                        aria-label="Đóng"
                    >
                        <span class="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<style scoped>
.notif-enter-active {
    transition: all 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.notif-leave-active {
    transition: all 0.25s ease;
}
.notif-enter-from {
    opacity: 0;
    transform: translateX(60px) scale(0.95);
}
.notif-leave-to {
    opacity: 0;
    transform: translateX(60px) scale(0.95);
}
.notif-move {
    transition: transform 0.3s ease;
}
</style>
