import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
    id: number
    message: string
    type: ToastType
    duration?: number
}

export interface ConfirmOptions {
    title?: string
    message: string
    confirmLabel?: string
    cancelLabel?: string
    /** 'danger' = nút xác nhận màu đỏ, 'primary' = màu primary (mặc định) */
    variant?: 'danger' | 'primary'
}

interface ConfirmState extends ConfirmOptions {
    resolve: (value: boolean) => void
}

export const useUIStore = defineStore('ui', () => {
    const toasts = ref<Toast[]>([])
    const isPageLoading = ref(false)
    const confirmState = ref<ConfirmState | null>(null)
    let toastCounter = 0

    function showToast(message: string, type: ToastType = 'info', duration = 3000) {
        const id = ++toastCounter
        toasts.value.push({ id, message, type, duration })
        setTimeout(() => removeToast(id), duration)
        return id
    }

    function removeToast(id: number) {
        toasts.value = toasts.value.filter(t => t.id !== id)
    }

    function success(message: string) { return showToast(message, 'success') }
    function error(message: string) { return showToast(message, 'error', 4000) }
    function info(message: string) { return showToast(message, 'info') }
    function warning(message: string) { return showToast(message, 'warning') }

    /** Hiện popup xác nhận, trả về Promise<boolean> */
    function confirm(options: ConfirmOptions): Promise<boolean> {
        return new Promise((resolve) => {
            confirmState.value = { ...options, resolve }
        })
    }

    function _resolveConfirm(value: boolean) {
        confirmState.value?.resolve(value)
        confirmState.value = null
    }

    return {
        toasts, isPageLoading,
        showToast, removeToast,
        success, error, info, warning,
        confirmState, confirm, _resolveConfirm,
    }
})
