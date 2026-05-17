import { ref, onMounted } from 'vue'
import { promotionService, type Voucher } from '@/pages/promotions/promotionService'
import { useUIStore } from '@/stores/useUIStore'

export function useVoucherManagement() {
    const uiStore = useUIStore()

    const vouchers = ref<Voucher[]>([])
    const isLoading = ref(true)
    const isModalOpen = ref(false)
    const isEditing = ref(false)

    const currentVoucher = ref<Partial<Voucher>>({
        code: '',
        name: '',
        discount_type: 'PERCENT',
        discount_value: 0,
        min_order_value: 0,
        max_discount: 0,
        usage_limit: 100,
        required_tier: null,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true
    })

    const fetchVouchers = async () => {
        isLoading.value = true
        try {
            const response = await promotionService.getVouchers({ include_inactive: true })
            vouchers.value = response.data
        } catch (error) {
            console.error('Lỗi lấy danh sách voucher:', error)
        } finally {
            isLoading.value = false
        }
    }

    onMounted(fetchVouchers)

    const openCreateModal = () => {
        isEditing.value = false
        currentVoucher.value = {
            code: '',
            name: '',
            discount_type: 'PERCENT',
            discount_value: 0,
            min_order_value: 0,
            max_discount: 0,
            usage_limit: 100,
            required_tier: null,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            is_active: true
        }
        isModalOpen.value = true
    }

    const openEditModal = (v: Voucher) => {
        isEditing.value = true
        currentVoucher.value = { ...v, 
            start_date: v.start_date.split('T')[0], 
            end_date: v.end_date.split('T')[0] 
        }
        isModalOpen.value = true
    }

    const handleSubmit = async () => {
        try {
            if (isEditing.value && currentVoucher.value.voucher_id) {
                await promotionService.updateVoucher(currentVoucher.value.voucher_id, currentVoucher.value)
                uiStore.success('Cập nhật voucher thành công!')
            } else {
                await promotionService.createVoucher(currentVoucher.value)
                uiStore.success('Tạo voucher thành công!')
            }
            isModalOpen.value = false
            fetchVouchers()
        } catch (error: any) {
            uiStore.error(error.response?.data?.detail || 'Có lỗi xảy ra.')
        }
    }

    const deleteVoucher = async (id: number) => {
        const confirmed = await uiStore.confirm({
            title: 'Xóa voucher',
            message: 'Bạn có chắc chắn muốn xóa voucher này?',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            variant: 'danger',
        })
        if (!confirmed) return
        try {
            await promotionService.deleteVoucher(id)
            uiStore.success('Xóa voucher thành công!')
            fetchVouchers()
        } catch (error) {
            console.error('Lỗi xóa voucher:', error)
        }
    }

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
    }

    return {
        uiStore,
        vouchers,
        isLoading,
        isModalOpen,
        isEditing,
        currentVoucher,
        fetchVouchers,
        openCreateModal,
        openEditModal,
        handleSubmit,
        deleteVoucher,
        formatPrice
    }
}
