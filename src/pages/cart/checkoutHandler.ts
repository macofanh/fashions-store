import { ref, computed, watch, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { checkoutServices } from './checkoutServices'
import type { UserVoucher } from '@/pages/promotions/promotionService'
import type { Address } from '@/pages/profile/addressService'

export function checkoutHandler() {
    const route     = useRoute()
    const router    = useRouter()
    const authStore = useAuthStore()
    const uiStore   = useUIStore()

    // ── State ──────────────────────────────────────────────────────
    const cart            = ref<any>(null)
    const myVouchers      = ref<UserVoucher[]>([])
    const selectedVoucher = ref<UserVoucher | null>(null)
    const isLoading       = ref(true)
    const isSubmitting    = ref(false)

    // Địa chỉ đã lưu
    const savedAddresses    = ref<Address[]>([])
    const selectedAddressId = ref<number | null>(null)

    // Form — họ tên + SĐT lấy từ auth store
    const form = ref({
        recipient_name: authStore.user?.full_name || '',
        phone:          (authStore.user as any)?.phone || '',
        province:       '',
        district:       '',
        ward:           '',
        street_address: '',
        payment_method: 'COD',
        note:           '',
    })

    // Address cascading
    const provinces            = ref<any[]>([])
    const districts            = ref<any[]>([])
    const wards                = ref<any[]>([])
    const selectedProvinceCode = ref<number | ''>('')
    const selectedDistrictCode = ref<number | ''>('')

    // ── Áp dụng địa chỉ đã lưu vào form ──────────────────────────
    const applyAddress = (addr: Address) => {
        selectedAddressId.value = addr.address_id
        form.value.recipient_name = addr.recipient_name
        form.value.phone          = addr.phone
        form.value.province       = addr.province
        form.value.district       = addr.district
        form.value.ward           = addr.ward
        form.value.street_address = addr.street_address
        // Reset cascading selects — không cần load lại vì đã có text đầy đủ
        selectedProvinceCode.value = ''
        selectedDistrictCode.value = ''
        districts.value = []
        wards.value     = []
    }

    // ── Watchers ───────────────────────────────────────────────────
    watch(selectedProvinceCode, async (val) => {
        form.value.province = provinces.value.find(p => p.code === val)?.name || ''
        form.value.district = ''; form.value.ward = ''
        selectedDistrictCode.value = ''; districts.value = []; wards.value = []
        if (val !== '') {
            const res = await checkoutServices.getDistricts(val as number)
            districts.value = res.data.districts
        }
    })

    watch(selectedDistrictCode, async (val) => {
        form.value.district = districts.value.find(d => d.code === val)?.name || ''
        form.value.ward = ''; wards.value = []
        if (val !== '') {
            const res = await checkoutServices.getWards(val as number)
            wards.value = res.data.wards
        }
    })

    // Khi user tự nhập form → bỏ chọn địa chỉ đã lưu
    watch(
        () => [form.value.recipient_name, form.value.phone, form.value.street_address],
        () => { selectedAddressId.value = null },
        { flush: 'sync' }
    )

    // ── Init ───────────────────────────────────────────────────────
    const init = async () => {
        isLoading.value = true
        try {
            const [cartRes, vouchersRes, provincesRes, addressesRes] = await Promise.all([
                checkoutServices.getCart(),
                checkoutServices.getMyVouchers(),
                checkoutServices.getProvinces(),
                checkoutServices.getMyAddresses(),
            ])

            cart.value         = cartRes.data
            myVouchers.value   = vouchersRes.data
            provinces.value    = provincesRes.data
            savedAddresses.value = addressesRes.data

            if (!cart.value.items?.length) {
                router.push({ name: 'cart' })
                return
            }

            // Auto-select địa chỉ mặc định (hoặc địa chỉ đầu tiên)
            if (savedAddresses.value.length > 0) {
                const defaultAddr = savedAddresses.value.find(a => a.is_default) ?? savedAddresses.value[0]
                applyAddress(defaultAddr)
            }

            // Auto-select voucher từ query param
            const voucherIdFromQuery = route.query.voucher_id ? Number(route.query.voucher_id) : null
            if (voucherIdFromQuery) {
                const found = myVouchers.value.find(uv => uv.voucher_id === voucherIdFromQuery)
                if (found) selectedVoucher.value = found
            }
        } catch (e) {
            console.error('Lỗi khởi tạo checkout:', e)
        } finally {
            isLoading.value = false
        }
    }

    // ── Computed ───────────────────────────────────────────────────
    const SHIPPING_FEE = 30000

    const subtotal = computed(() => {
        if (!cart.value?.items) return 0
        return cart.value.items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)
    })

    const discountAmount = computed(() => {
        if (!selectedVoucher.value) return 0
        const v = selectedVoucher.value.voucher
        if (subtotal.value < Number(v.min_order_value)) return 0
        if (v.discount_type === 'FIXED_AMOUNT') return Number(v.discount_value)
        if (v.discount_type === 'PERCENT') {
            const amt = subtotal.value * (Number(v.discount_value) / 100)
            return v.max_discount ? Math.min(amt, Number(v.max_discount)) : amt
        }
        if (v.discount_type === 'FREE_SHIP') return SHIPPING_FEE
        return 0
    })

    const total = computed(() => Math.max(0, subtotal.value + SHIPPING_FEE - discountAmount.value))

    // ── Actions ────────────────────────────────────────────────────
    const toggleVoucher = (uv: UserVoucher) => {
        if (subtotal.value < Number(uv.voucher.min_order_value)) return
        selectedVoucher.value = selectedVoucher.value?.id === uv.id ? null : uv
    }

    const submitOrder = async () => {
        isSubmitting.value = true
        try {
            await checkoutServices.createOrder({
                payment_method: form.value.payment_method,
                address_snapshot: {
                    recipient_name: form.value.recipient_name,
                    phone:          form.value.phone,
                    province:       form.value.province,
                    district:       form.value.district,
                    ward:           form.value.ward,
                    street_address: form.value.street_address,
                },
                shipping_fee: SHIPPING_FEE,
                voucher_id:   selectedVoucher.value?.voucher_id,
                note:         form.value.note,
            })
            uiStore.success('Đặt hàng thành công!')
            router.push({ name: 'profile' })
        } catch (e: any) {
            uiStore.error(e.response?.data?.detail || 'Có lỗi xảy ra khi đặt hàng.')
        } finally {
            isSubmitting.value = false
        }
    }

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    return {
        // state
        cart, myVouchers, selectedVoucher,
        isLoading, isSubmitting,
        form, provinces, districts, wards,
        selectedProvinceCode, selectedDistrictCode,
        savedAddresses, selectedAddressId,
        // computed
        subtotal, discountAmount, total,
        SHIPPING_FEE,
        // actions
        init, toggleVoucher, submitOrder, formatPrice, applyAddress,
    }
}
