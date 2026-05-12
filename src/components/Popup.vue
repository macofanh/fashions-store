<script setup lang="ts">
import { useUIStore } from '@/stores/useUIStore'

const uiStore = useUIStore()
</script>

<template>
    <Teleport to="body">
        <Transition name="popup">
            <div
                v-if="uiStore.confirmState"
                class="fixed inset-0 z-[400] flex items-center justify-center p-4"
                @click.self="uiStore._resolveConfirm(false)"
            >
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-fashion-black/50 backdrop-blur-sm"></div>

                <!-- Dialog -->
                <div class="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 flex flex-col gap-5">

                    <!-- Icon -->
                    <div :class="[
                        'w-12 h-12 rounded-full flex items-center justify-center mx-auto',
                        uiStore.confirmState.variant === 'danger' ? 'bg-red-50' : 'bg-primary-light'
                    ]">
                        <span
                            :class="[
                                'material-symbols-outlined text-[26px]',
                                uiStore.confirmState.variant === 'danger' ? 'text-red-500' : 'text-primary'
                            ]"
                            style="font-variation-settings:'FILL' 1"
                        >
                            {{ uiStore.confirmState.variant === 'danger' ? 'warning' : 'help' }}
                        </span>
                    </div>

                    <!-- Text -->
                    <div class="text-center space-y-1.5">
                        <h3 class="text-base font-bold text-fashion-black">
                            {{ uiStore.confirmState.title ?? 'Xác nhận' }}
                        </h3>
                        <p class="text-sm text-text-muted leading-relaxed">
                            {{ uiStore.confirmState.message }}
                        </p>
                    </div>

                    <!-- Actions -->
                    <div class="flex gap-3">
                        <button
                            @click="uiStore._resolveConfirm(false)"
                            class="flex-1 py-2.5 rounded-lg border border-border-light text-sm font-medium text-text-muted hover:bg-fashion-gray transition-colors"
                        >
                            {{ uiStore.confirmState.cancelLabel ?? 'Hủy' }}
                        </button>
                        <button
                            @click="uiStore._resolveConfirm(true)"
                            :class="[
                                'flex-1 py-2.5 rounded-lg text-sm font-bold text-white transition-colors',
                                uiStore.confirmState.variant === 'danger'
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-primary hover:bg-primary-dark'
                            ]"
                        >
                            {{ uiStore.confirmState.confirmLabel ?? 'Xác nhận' }}
                        </button>
                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.popup-enter-active {
    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
}
.popup-leave-active {
    transition: all 0.2s ease;
}
.popup-enter-from,
.popup-leave-to {
    opacity: 0;
}
.popup-enter-from :deep(.relative.bg-white) {
    transform: scale(0.92) translateY(12px);
}
.popup-leave-to :deep(.relative.bg-white) {
    transform: scale(0.95);
}
</style>
