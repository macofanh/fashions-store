<script setup lang="ts">
import { useUIStore } from '@/stores/useUIStore'

const uiStore = useUIStore()

const iconMap = {
    success: 'check_circle',
    error: 'error',
    info: 'info',
    warning: 'warning',
}

const colorMap = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error: 'bg-red-50 border-red-200 text-red-800',
    info: 'bg-primary-light border-primary/30 text-fashion-black',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
}

const iconColorMap = {
    success: 'text-green-500',
    error: 'text-red-500',
    info: 'text-primary',
    warning: 'text-amber-500',
}
</script>

<template>
    <Teleport to="body">
        <div class="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none">
            <TransitionGroup name="toast">
                <div
                    v-for="toast in uiStore.toasts"
                    :key="toast.id"
                    :class="[
                        'flex items-center gap-3 px-5 py-4 border shadow-lg max-w-sm pointer-events-auto',
                        colorMap[toast.type]
                    ]"
                >
                    <span
                        :class="['material-symbols-outlined text-[20px] shrink-0', iconColorMap[toast.type]]"
                        style="font-variation-settings:'FILL' 1"
                    >{{ iconMap[toast.type] }}</span>
                    <p class="text-[11px] font-medium leading-snug flex-grow">{{ toast.message }}</p>
                    <button
                        @click="uiStore.removeToast(toast.id)"
                        class="text-current opacity-40 hover:opacity-100 transition-opacity shrink-0"
                    >
                        <span class="material-symbols-outlined text-[16px]">close</span>
                    </button>
                </div>
            </TransitionGroup>
        </div>
    </Teleport>
</template>

<style scoped>
.toast-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.toast-leave-active { transition: all 0.2s ease; }
.toast-enter-from   { opacity: 0; transform: translateX(20px); }
.toast-leave-to     { opacity: 0; transform: translateX(20px); }
</style>
