import { ref } from 'vue'
import { useShippingConfigStore, type ShippingConfig } from '@/stores/useShippingConfigStore'
import { useUIStore } from '@/stores/useUIStore'

export function useShippingConfig() {
    const store    = useShippingConfigStore()
    const uiStore  = useUIStore()

    // Clone để edit, không mutate store trực tiếp
    const form = ref<ShippingConfig>({ ...store.config })

    const isSaving = ref(false)

    const handleSave = async () => {
        isSaving.value = true
        try {
            store.save(form.value)
            uiStore.success('Đã lưu cấu hình giao hàng!')
        } catch {
            uiStore.error('Có lỗi khi lưu cấu hình.')
        } finally {
            isSaving.value = false
        }
    }

    const handleReset = async () => {
        const ok = await uiStore.confirm({
            title: 'Khôi phục mặc định',
            message: 'Bạn có chắc muốn đặt lại toàn bộ cấu hình về mặc định?',
            confirmLabel: 'Khôi phục',
            variant: 'danger',
        })
        if (!ok) return
        store.reset()
        form.value = { ...store.config }
        uiStore.success('Đã khôi phục cấu hình mặc định.')
    }

    const formatCurrency = (val: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(val)

    return {
        store,
        uiStore,
        form,
        isSaving,
        handleSave,
        handleReset,
        formatCurrency
    }
}
