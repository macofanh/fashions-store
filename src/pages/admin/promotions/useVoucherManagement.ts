import { ref, onMounted } from 'vue'
import { promotionService, type Voucher } from '@/pages/promotions/promotionService'
import { useUIStore } from '@/stores/useUIStore'

type MoneyField = 'discount_value' | 'min_order_value' | 'max_discount'

export function useVoucherManagement() {
    const uiStore = useUIStore()

    const vouchers = ref<Voucher[]>([])
    const isLoading = ref(true)
    const isModalOpen = ref(false)
    const isEditing = ref(false)
    const fieldErrors = ref<Partial<Record<MoneyField | 'discount_type', string>>>({})

    const createEmptyVoucher = (): Partial<Voucher> => ({
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

    const currentVoucher = ref<Partial<Voucher>>(createEmptyVoucher())

    const formatMoneyInput = (value: number | string | null | undefined) => {
        const numericValue = Number(value ?? 0)
        if (Number.isNaN(numericValue)) return '0'
        return new Intl.NumberFormat('vi-VN').format(numericValue)
    }

    const parseMoneyInput = (value: string) => {
        const digitsOnly = value.replace(/[^\d]/g, '')
        return digitsOnly ? Number(digitsOnly) : 0
    }

    const clampPercentValue = (value: number) => Math.max(0, Math.min(100, Math.trunc(value)))

    const clearFieldError = (field: MoneyField | 'discount_type') => {
        delete fieldErrors.value[field]
        fieldErrors.value = { ...fieldErrors.value }
    }

    const validateVoucher = () => {
        fieldErrors.value = {}

        const discountType = currentVoucher.value.discount_type ?? 'PERCENT'
        const discountValue = Number(currentVoucher.value.discount_value ?? 0)
        const minOrderValue = Number(currentVoucher.value.min_order_value ?? 0)
        const maxDiscount = Number(currentVoucher.value.max_discount ?? 0)

        if (discountType === 'PERCENT') {
            if (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > 100) {
                fieldErrors.value.discount_value = 'Giá trị phần trăm phải từ 0 đến 100.'
            }

            if (maxDiscount < 0) {
                fieldErrors.value.max_discount = 'Giảm tối đa không được nhỏ hơn 0.'
            }
        } else if (discountType === 'FIXED_AMOUNT') {
            if (!Number.isFinite(discountValue) || discountValue < 0) {
                fieldErrors.value.discount_value = 'Giá trị tiền phải từ 0 trở lên.'
            }
        }

        if (!Number.isFinite(minOrderValue) || minOrderValue < 0) {
            fieldErrors.value.min_order_value = 'Đơn tối thiểu phải từ 0 trở lên.'
        }

        return Object.keys(fieldErrors.value).length === 0
    }

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
        currentVoucher.value = createEmptyVoucher()
        fieldErrors.value = {}
        isModalOpen.value = true
    }

    const openEditModal = (v: Voucher) => {
        isEditing.value = true
        currentVoucher.value = {
            ...v,
            start_date: v.start_date.split('T')[0],
            end_date: v.end_date.split('T')[0]
        }
        fieldErrors.value = {}
        isModalOpen.value = true
    }

    const handleDiscountTypeChange = () => {
        currentVoucher.value.discount_value = 0
        currentVoucher.value.max_discount = 0
        clearFieldError('discount_value')
        clearFieldError('max_discount')
        clearFieldError('discount_type')
    }

    const updateMoneyField = (field: MoneyField, event: Event) => {
        const target = event.target as HTMLInputElement | null
        if (!target) return
        currentVoucher.value[field] = parseMoneyInput(target.value)
        clearFieldError(field)
    }

    const updateDiscountValue = (event: Event) => {
        const target = event.target as HTMLInputElement | null
        if (!target) return

        const parsedValue = parseMoneyInput(target.value)
        if (currentVoucher.value.discount_type === 'PERCENT') {
            currentVoucher.value.discount_value = parsedValue
            clearFieldError('discount_value')
            return
        }

        currentVoucher.value.discount_value = parsedValue
        clearFieldError('discount_value')
    }

    const normalizeVoucherPayload = () => {
        const discountType = currentVoucher.value.discount_type ?? 'PERCENT'

        return {
            ...currentVoucher.value,
            discount_type: discountType,
            discount_value: Number(currentVoucher.value.discount_value ?? 0),
            min_order_value: Number(currentVoucher.value.min_order_value ?? 0),
            max_discount: discountType === 'PERCENT'
                ? Number(currentVoucher.value.max_discount ?? 0)
                : 0
        }
    }

    const handleSubmit = async () => {
        try {
            if (!validateVoucher()) {
                uiStore.error('Vui lòng kiểm tra lại các trường đang báo lỗi.')
                return
            }

            const payload = normalizeVoucherPayload()

            if (isEditing.value && currentVoucher.value.voucher_id) {
                await promotionService.updateVoucher(currentVoucher.value.voucher_id, payload)
                uiStore.success('Cập nhật voucher thành công!')
            } else {
                await promotionService.createVoucher(payload)
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
        fieldErrors,
        formatMoneyInput,
        fetchVouchers,
        openCreateModal,
        openEditModal,
        handleDiscountTypeChange,
        clearFieldError,
        updateMoneyField,
        updateDiscountValue,
        handleSubmit,
        deleteVoucher,
        formatPrice
    }
}
