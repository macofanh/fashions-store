import { defineStore } from 'pinia'
import { ref } from 'vue'

export type ToastType = 'success' | 'error' | 'info' | 'warning'

export interface Toast {
    id: number
    message: string
    type: ToastType
    duration?: number
}

export const useUIStore = defineStore('ui', () => {
    const toasts = ref<Toast[]>([])
    const isPageLoading = ref(false)
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

    return { toasts, isPageLoading, showToast, removeToast, success, error, info, warning }
})
