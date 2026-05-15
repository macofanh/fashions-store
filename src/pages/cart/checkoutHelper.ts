import { ref, computed, watch, onBeforeUnmount } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { checkoutServices } from '@/pages/cart/checkoutServices'
import { useShippingConfigStore } from '@/stores/useShippingConfigStore'
import { haversineDistance, calcShippingFee } from '@/lib/distanceHelper'
import type { UserVoucher } from '@/pages/promotions/promotionService'
import type { Address } from '@/pages/profile/addressService'

interface SePayQrSession {
    orderId: number
    orderCode: string
    amount: number
    description: string
    qrUrl: string
}

const SEPAY_ACCOUNT = 'VQRQAICLZ9488'
const SEPAY_BANK = 'MBBank'

function buildSePayQrUrl(amount: number, description: string) {
    const params = new URLSearchParams({
        acc: SEPAY_ACCOUNT,
        bank: SEPAY_BANK,
        amount: String(Math.round(amount)),
        des: description,
    })

    return `https://qr.sepay.vn/img?${params.toString()}`
}

function normalizeTransferText(value: string) {
    return value
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\w\s-]/g, '')
        .replace(/\s+/g, ' ')
        .trim()
}

function buildTransferDescription(customerName: string, orderCode: string) {
    const safeName = normalizeTransferText(customerName)
    const safeOrderCode = normalizeTransferText(orderCode) || orderCode
    return safeName
        ? `${safeName} chuyen tien don ${safeOrderCode}`
        : `chuyen tien don ${safeOrderCode}`
}

function unwrapOrderPayload(response: any) {
    return response?.data?.data ?? response?.data ?? null
}

function extractOrderId(payload: any) {
    const orderId = payload?.order_id ?? payload?.id ?? payload?.order?.order_id ?? payload?.order?.id
    return orderId ? Number(orderId) : null
}

function extractOrderCode(payload: any) {
    return payload?.order_code ?? payload?.code ?? payload?.order?.order_code ?? payload?.order?.code ?? ''
}

function isPaidStatus(value: unknown) {
    return ['PAID', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'DONE', 'FINISHED'].includes(String(value).toUpperCase())
}

function isOrderPaid(orderData: any) {
    if (!orderData) return false

    if (orderData.is_paid === true) return true
    if (orderData.payment_status && isPaidStatus(orderData.payment_status)) return true
    if (orderData.payment_state && isPaidStatus(orderData.payment_state)) return true
    if (orderData.status && isPaidStatus(orderData.status)) return true

    return false
}

export function checkoutHelper() {
    const route     = useRoute()
    const router    = useRouter()
    const authStore = useAuthStore()
    const uiStore   = useUIStore()
    const shippingStore = useShippingConfigStore()

    // ── State ──────────────────────────────────────────────────────
    const cart            = ref<any>(null)
    const myVouchers      = ref<UserVoucher[]>([])
    const selectedVoucher = ref<UserVoucher | null>(null)
    const isLoading       = ref(true)
    const isSubmitting    = ref(false)
    const qrSession       = ref<SePayQrSession | null>(null)
    const qrStatus        = ref<'idle' | 'waiting' | 'paid' | 'failed'>('idle')
    const qrStatusMessage = ref('')

    let qrPollTimer: ReturnType<typeof window.setInterval> | null = null

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
        latitude:       null as number | null,
        longitude:      null as number | null,
    })

    // Địa chỉ đã lưu
    const savedAddresses    = ref<Address[]>([])
    const selectedAddressId = ref<number | null>(null)

    // ── Áp dụng địa chỉ đã lưu vào form ──────────────────────────
    const applyAddress = (addr: Address) => {
        selectedAddressId.value   = addr.address_id
        form.value.recipient_name = addr.recipient_name
        form.value.phone          = addr.phone
        form.value.province       = addr.province
        form.value.district       = addr.district
        form.value.ward           = addr.ward
        form.value.street_address = addr.street_address
        form.value.latitude       = addr.latitude ?? null
        form.value.longitude      = addr.longitude ?? null
        selectedProvinceCode.value = ''
        selectedDistrictCode.value = ''
        districts.value = []
        wards.value     = []
    }

    // Address cascading
    const provinces            = ref<any[]>([])
    const districts            = ref<any[]>([])
    const wards                = ref<any[]>([])
    const selectedProvinceCode = ref<number | ''>('')
    const selectedDistrictCode = ref<number | ''>('')

    const clearQrPoller = () => {
        if (qrPollTimer !== null) {
            window.clearInterval(qrPollTimer)
            qrPollTimer = null
        }
    }

    const resetQrSession = () => {
        clearQrPoller()
        qrSession.value = null
        qrStatus.value = 'idle'
        qrStatusMessage.value = ''
    }

    const watchQrPayment = async (orderId: number) => {
        clearQrPoller()
        qrStatus.value = 'waiting'
        qrStatusMessage.value = 'Đang chờ SePay xác nhận thanh toán...'

        const checkOrder = async () => {
            try {
                const response = await checkoutServices.getOrderDetail(orderId)
                const orderData = unwrapOrderPayload(response)

                if (isOrderPaid(orderData)) {
                    clearQrPoller()
                    qrStatus.value = 'paid'
                    qrStatusMessage.value = 'Thanh toán đã được xác nhận.'
                    uiStore.success('Thanh toán QR thành công!')
                    setTimeout(() => {
                        router.push({ name: 'profile' })
                    }, 1200)
                    return true
                }

                return false
            } catch (error) {
                console.error('Lỗi kiểm tra thanh toán QR:', error)
                return false
            }
        }

        const isPaidImmediately = await checkOrder()
        if (!isPaidImmediately) {
            qrPollTimer = window.setInterval(() => {
                void checkOrder()
            }, 5000)
        }
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

    watch(() => form.value.payment_method, (method) => {
        if (method !== 'QR_CODE') {
            resetQrSession()
        }
    })

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

            cart.value           = cartRes.data
            myVouchers.value     = vouchersRes.data
            provinces.value      = provincesRes.data
            savedAddresses.value = addressesRes.data

            if (!cart.value.items?.length) {
                router.push({ name: 'cart' })
                return
            }

            // Auto-select địa chỉ mặc định
            if (savedAddresses.value.length > 0) {
                const defaultAddr = savedAddresses.value.find(a => a.is_default) ?? savedAddresses.value[0]!
                applyAddress(defaultAddr)
            }

            // Fetch tọa độ cửa hàng chạy nền
            shippingStore.fetchStoreCoords()

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
    const subtotal = computed(() => {
        if (!cart.value?.items) return 0
        return cart.value.items.reduce((s: number, i: any) => s + i.unit_price * i.quantity, 0)
    })

    const distanceKm = computed<number | null>(() => {
        const { latitude: dLat, longitude: dLng } = form.value
        const storeCoords = shippingStore.storeCoords
        if (!dLat || !dLng || !storeCoords) return null
        return haversineDistance(storeCoords.lat, storeCoords.lng, dLat, dLng)
    })

    const shippingResult = computed(() => {
        const cfg = shippingStore.config
        const km  = distanceKm.value
        if (km === null) {
            const isFree = subtotal.value >= cfg.free_shipping_threshold
            return { fee: isFree ? 0 : cfg.base_fee, isFree, outOfRange: false, hasCoords: false }
        }
        return { ...calcShippingFee({
            distanceKm: km,
            subtotal: subtotal.value,
            baseFee: cfg.base_fee,
            pricePerKm: cfg.price_per_km,
            freeThreshold: cfg.free_shipping_threshold,
            maxDistanceKm: cfg.max_distance_km,
        }), hasCoords: true }
    })

    const SHIPPING_FEE = computed(() => shippingResult.value.fee)

    const discountAmount = computed(() => {
        if (!selectedVoucher.value) return 0
        const v = selectedVoucher.value.voucher
        if (subtotal.value < Number(v.min_order_value)) return 0
        if (v.discount_type === 'FIXED_AMOUNT') return Number(v.discount_value)
        if (v.discount_type === 'PERCENT') {
            const amt = subtotal.value * (Number(v.discount_value) / 100)
            return v.max_discount ? Math.min(amt, Number(v.max_discount)) : amt
        }
        if (v.discount_type === 'FREE_SHIP') return SHIPPING_FEE.value
        return 0
    })

    const total = computed(() => Math.max(0, subtotal.value + SHIPPING_FEE.value - discountAmount.value))

    const transferCustomerName = computed(() => {
        const enteredName = form.value.recipient_name.trim()
        if (enteredName) return enteredName
        return authStore.user?.full_name?.trim() || ''
    })

    // ── Actions ────────────────────────────────────────────────────
    const toggleVoucher = (uv: UserVoucher) => {
        if (subtotal.value < Number(uv.voucher.min_order_value)) return
        selectedVoucher.value = selectedVoucher.value?.id === uv.id ? null : uv
    }

    const submitOrder = async () => {
        isSubmitting.value = true
        try {
            const response = await checkoutServices.createOrder({
                payment_method: form.value.payment_method,
                address_snapshot: {
                    recipient_name: form.value.recipient_name,
                    phone:          form.value.phone,
                    province:       form.value.province,
                    district:       form.value.district,
                    ward:           form.value.ward,
                    street_address: form.value.street_address,
                },
                shipping_fee: SHIPPING_FEE.value,
                voucher_id:   selectedVoucher.value?.voucher_id,
                note:         form.value.note,
            })

            if (form.value.payment_method === 'QR_CODE') {
                const payload = unwrapOrderPayload(response)
                const orderId = extractOrderId(payload)
                const orderCode = extractOrderCode(payload)

                if (!orderId || !orderCode) {
                    throw new Error('Không lấy được thông tin đơn hàng QR.')
                }

                qrSession.value = {
                    orderId,
                    orderCode,
                    amount: total.value,
                    description: buildTransferDescription(transferCustomerName.value, orderCode),
                    qrUrl: buildSePayQrUrl(total.value, buildTransferDescription(transferCustomerName.value, orderCode)),
                }
                qrStatus.value = 'waiting'
                qrStatusMessage.value = 'Quét mã QR bên dưới và chuyển khoản đúng số tiền.'
                uiStore.info('Đã tạo mã QR. Vui lòng chuyển khoản để hoàn tất đơn hàng.')
                await watchQrPayment(orderId)
                return
            }

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

    const submitLabel = computed(() => {
        if (qrStatus.value === 'waiting' && qrSession.value) return 'Đang chờ thanh toán'
        if (form.value.payment_method === 'QR_CODE') return 'Tạo mã QR'
        return 'Xác nhận đặt hàng'
    })

    onBeforeUnmount(() => {
        clearQrPoller()
    })

    return {
        cart, myVouchers, selectedVoucher,
        isLoading, isSubmitting,
        qrSession, qrStatus, qrStatusMessage,
        form, provinces, districts, wards,
        selectedProvinceCode, selectedDistrictCode,
        savedAddresses, selectedAddressId,
        subtotal, discountAmount, total,
        SHIPPING_FEE, distanceKm, shippingResult,
        submitLabel,
        init, toggleVoucher, submitOrder, formatPrice,
        applyAddress, resetQrSession,
    }
}
