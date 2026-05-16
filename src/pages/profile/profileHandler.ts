import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { orderService } from '@/pages/cart/orderService'
import { profileServices } from './profileServices'
import { membershipService, getTierByPoints } from './membershipService'
import type { Address } from './addressService'
import { addressService } from './addressService'

export type ProfileTab = 'orders' | 'membership' | 'addresses' | 'profile'

interface SePayQrSession {
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
        ? `Khách hàng ${safeName} chuyển tiền đơn ${safeOrderCode}`
        : `Khách hàng chuyển tiền đơn ${safeOrderCode}`
}

function isPaidStatus(value: unknown) {
    return ['PAID', 'SUCCESS', 'SUCCESSFUL', 'COMPLETED', 'DONE', 'FINISHED'].includes(String(value).toUpperCase())
}

function isOrderPaid(orderData: any) {
    if (!orderData) return false

    if (orderData.is_paid === true) return true
    if (orderData.payment_status && isPaidStatus(orderData.payment_status)) return true
    if (orderData.payment_state && isPaidStatus(orderData.payment_state)) return true
    if (orderData.payment?.status && isPaidStatus(orderData.payment.status)) return true
    if (orderData.status && isPaidStatus(orderData.status)) return true

    return false
}

export function profileHandler() {
    const router    = useRouter()
    const authStore = useAuthStore()
    const uiStore   = useUIStore()

    // ── State ──────────────────────────────────────────────────────
    const activeTab           = ref<ProfileTab>('orders')
    const orders              = ref<any[]>([])
    const addresses           = ref<Address[]>([])
    const isLoading           = ref(true)
    const isOrderDetailLoading = ref(false)
    const isOrderDetailOpen   = ref(false)
    const selectedOrder       = ref<any>(null)
    const orderQrSession      = ref<SePayQrSession | null>(null)
    const orderQrStatusMessage = ref('')
    const isAddressModalOpen  = ref(false)
    const totalPoints         = ref(0)
    const isMembershipLoading = ref(true)
    const isProfileSaving     = ref(false)
    const isAvatarUploading   = ref(false)
    const profileForm         = ref({
        full_name: '',
        phone: '',
    })
    const avatarPreviewUrl    = ref<string | null>(null)

    // Modal mode
    const modalMode        = ref<'add' | 'edit'>('add')
    const editingAddressId = ref<number | null>(null)
    const isSubmitting     = ref(false)

    // Address form
    const provinces            = ref<any[]>([])
    const districts            = ref<any[]>([])
    const wards                = ref<any[]>([])
    const selectedProvinceCode = ref<number | ''>('')
    const selectedDistrictCode = ref<number | ''>('')
    const addressForm = ref({
        recipient_name: '',
        phone:          '',
        province:       '',
        district:       '',
        ward:           '',
        street_address: '',
        is_default:     false,
        latitude:       null as number | null,
        longitude:      null as number | null,
    })

    const syncProfileForm = () => {
        profileForm.value = {
            full_name: authStore.user?.full_name || '',
            phone: authStore.user?.phone || '',
        }
        avatarPreviewUrl.value = authStore.user?.avatar_url || null
    }

    watch(() => authStore.user, () => {
        syncProfileForm()
    }, { immediate: true, deep: true })

    // ── Watchers ───────────────────────────────────────────────────
    watch(selectedProvinceCode, async (val) => {
        addressForm.value.province = provinces.value.find(p => p.code === val)?.name || ''
        addressForm.value.district = ''; addressForm.value.ward = ''
        selectedDistrictCode.value = ''; districts.value = []; wards.value = []
        if (val !== '') {
            const res = await profileServices.getDistricts(val as number)
            districts.value = res.data.districts
        }
    })

    watch(selectedDistrictCode, async (val) => {
        addressForm.value.district = districts.value.find(d => d.code === val)?.name || ''
        addressForm.value.ward = ''; wards.value = []
        if (val !== '') {
            const res = await profileServices.getWards(val as number)
            wards.value = res.data.wards
        }
    })

    // ── Init (lazy-load theo tab) ──────────────────────────────────
    const loadedTabs = new Set<string>()

    const loadTab = async (tab: string) => {
        if (loadedTabs.has(tab)) return
        loadedTabs.add(tab)

        if (tab === 'orders') {
            isLoading.value = true
            try {
                const res = await profileServices.getMyOrders()
                orders.value = res.data
            } catch (e) {
                console.error('Lỗi lấy đơn hàng:', e)
            } finally {
                isLoading.value = false
            }
        }

        if (tab === 'membership') {
            isMembershipLoading.value = true
            try {
                const res = await membershipService.getRewardHistory()
                totalPoints.value = res.data.reduce((sum, item) => sum + item.points_delta, 0)
            } catch (e) {
                console.error('Lỗi lấy điểm thành viên:', e)
            } finally {
                isMembershipLoading.value = false
            }
        }

        if (tab === 'addresses') {
            isLoading.value = true
            try {
                const [addressesRes, provincesRes] = await Promise.all([
                    profileServices.getMyAddresses(),
                    profileServices.getProvinces(),
                ])
                addresses.value = addressesRes.data
                provinces.value = provincesRes.data
            } catch (e) {
                console.error('Lỗi lấy địa chỉ:', e)
            } finally {
                isLoading.value = false
            }
        }

        if (tab === 'profile') {
            syncProfileForm()
        }
    }

    // Gọi khi component mount — chỉ load tab đang active
    const init = () => {
        loadTab(activeTab.value)
    }

    const closeOrderDetail = () => {
        isOrderDetailOpen.value = false
        selectedOrder.value = null
        orderQrSession.value = null
        orderQrStatusMessage.value = ''
    }

    const openOrderDetail = async (order: any) => {
        isOrderDetailOpen.value = true
        isOrderDetailLoading.value = true
        selectedOrder.value = order
        orderQrSession.value = null
        orderQrStatusMessage.value = ''

        try {
            const res = await orderService.getOrderDetail(order.order_id)
            const detail = res.data
            selectedOrder.value = detail

            if (detail?.payment_method === 'QR_CODE' && !isOrderPaid(detail)) {
                const orderCode = detail.order_code || order.order_code || ''
                const totalAmount = Number(detail.total_amount ?? detail.total ?? 0)
                const customerName = detail.address_snapshot?.recipient_name || authStore.user?.full_name || ''
                const description = buildTransferDescription(customerName, orderCode)

                orderQrSession.value = {
                    orderCode,
                    amount: totalAmount,
                    description,
                    qrUrl: buildSePayQrUrl(totalAmount, description),
                }
                orderQrStatusMessage.value = 'Đơn hàng này đang chờ thanh toán. Quét mã QR bên dưới để thanh toán.'
            }
        } catch (e) {
            console.error('Lỗi lấy chi tiết đơn hàng:', e)
            uiStore.error('Không lấy được chi tiết đơn hàng.')
        } finally {
            isOrderDetailLoading.value = false
        }
    }

    // Khi user bấm sang tab khác mới gọi API của tab đó
    watch(activeTab, (tab) => {
        loadTab(tab)
    })

    const refreshAddresses = async () => {
        const res = await profileServices.getMyAddresses()
        addresses.value = res.data
    }

    const handleSaveProfile = async () => {
        const fullName = profileForm.value.full_name.trim()
        if (!fullName) {
            uiStore.warning('Vui lòng nhập họ và tên.')
            return
        }

        isProfileSaving.value = true
        try {
            const response = await profileServices.updateMyProfile({
                full_name: fullName,
                phone: profileForm.value.phone.trim() || null,
            })

            authStore.hydrateUser({
                ...(authStore.user as any),
                ...response.data,
            })
            syncProfileForm()
            uiStore.success('Cập nhật hồ sơ thành công!')
        } catch (e: any) {
            uiStore.error(e.response?.data?.detail || 'Không thể cập nhật hồ sơ.')
        } finally {
            isProfileSaving.value = false
        }
    }

    const handleAvatarChange = async (file: File) => {
        if (!file) return

        const previousAvatar = avatarPreviewUrl.value
        const temporaryPreview = URL.createObjectURL(file)
        avatarPreviewUrl.value = temporaryPreview
        isAvatarUploading.value = true

        try {
            const response = await profileServices.updateMyAvatar(file)
            authStore.hydrateUser({
                ...(authStore.user as any),
                ...response.data,
            })
            avatarPreviewUrl.value = response.data.avatar_url || temporaryPreview
            uiStore.success('Cập nhật avatar thành công!')
        } catch (e: any) {
            avatarPreviewUrl.value = previousAvatar || authStore.user?.avatar_url || null
            uiStore.error(e.response?.data?.detail || 'Không thể cập nhật avatar.')
        } finally {
            isAvatarUploading.value = false
            if (avatarPreviewUrl.value !== temporaryPreview) {
                URL.revokeObjectURL(temporaryPreview)
            }
        }
    }

    const resetForm = () => {
        addressForm.value = {
            recipient_name: '', phone: '', province: '', district: '', ward: '',
            street_address: '', is_default: false, latitude: null, longitude: null,
        }
        selectedProvinceCode.value = ''
        selectedDistrictCode.value = ''
        districts.value = []
        wards.value = []
    }

    // ── Mở modal thêm ─────────────────────────────────────────────
    const openAddressModal = () => {
        modalMode.value = 'add'
        editingAddressId.value = null
        resetForm()
        isAddressModalOpen.value = true
    }

    // ── Mở modal sửa ──────────────────────────────────────────────
    const openEditModal = (addr: Address) => {
        modalMode.value = 'edit'
        editingAddressId.value = addr.address_id
        addressForm.value = {
            recipient_name: addr.recipient_name,
            phone:          addr.phone,
            province:       addr.province,
            district:       addr.district,
            ward:           addr.ward,
            street_address: addr.street_address,
            is_default:     addr.is_default,
            latitude:       addr.latitude ?? null,
            longitude:      addr.longitude ?? null,
        }
        selectedProvinceCode.value = ''
        selectedDistrictCode.value = ''
        districts.value = []
        wards.value = []
        isAddressModalOpen.value = true
    }

    // ── Submit (thêm hoặc sửa) ─────────────────────────────────────
    const handleAddAddress = async () => {
        isSubmitting.value = true
        try {
            if (modalMode.value === 'edit' && editingAddressId.value) {
                await addressService.updateAddress(editingAddressId.value, addressForm.value)
                uiStore.success('Cập nhật địa chỉ thành công!')
            } else {
                await profileServices.addAddress(addressForm.value)
                uiStore.success('Thêm địa chỉ thành công!')
            }
            isAddressModalOpen.value = false
            await refreshAddresses()
        } catch (e: any) {
            uiStore.error(e.response?.data?.detail || 'Có lỗi xảy ra.')
        } finally {
            isSubmitting.value = false
        }
    }

    // ── Xóa địa chỉ ───────────────────────────────────────────────
    const handleDeleteAddress = async (addr: Address) => {
        const ok = await uiStore.confirm({
            title: 'Xóa địa chỉ',
            message: `Bạn có chắc muốn xóa địa chỉ của "${addr.recipient_name}"?`,
            confirmLabel: 'Xóa',
            variant: 'danger',
        })
        if (!ok) return
        try {
            await addressService.deleteAddress(addr.address_id)
            uiStore.success('Đã xóa địa chỉ.')
            await refreshAddresses()
        } catch (e: any) {
            uiStore.error(e.response?.data?.detail || 'Lỗi khi xóa địa chỉ.')
        }
    }

    // ── Đặt mặc định ──────────────────────────────────────────────
    const handleSetDefault = async (addr: Address) => {
        try {
            await addressService.setDefault(addr.address_id)
            uiStore.success('Đã đặt làm địa chỉ mặc định.')
            await refreshAddresses()
        } catch (e: any) {
            uiStore.error(e.response?.data?.detail || 'Lỗi khi đặt mặc định.')
        }
    }

    // ── Đăng xuất ─────────────────────────────────────────────────
    const handleLogout = async () => {
        const confirmed = await uiStore.confirm({
            title: 'Đăng xuất',
            message: 'Bạn có chắc muốn đăng xuất khỏi tài khoản không?',
            confirmLabel: 'Đăng xuất',
            cancelLabel: 'Hủy',
            variant: 'danger',
        })
        if (!confirmed) return
        authStore.logout()
        router.push({ name: 'login' })
    }

    // ── Helpers ────────────────────────────────────────────────────
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

    const statusConfig: Record<string, { label: string; classes: string; dot: string }> = {
        PENDING:   { label: 'Chờ xác nhận', classes: 'bg-amber-50 text-amber-700 border border-amber-100',    dot: 'bg-amber-500 animate-pulse' },
        CONFIRMED: { label: 'Đã xác nhận',  classes: 'bg-blue-50 text-blue-700 border border-blue-100',       dot: 'bg-blue-500' },
        SHIPPING:  { label: 'Đang giao',    classes: 'bg-indigo-50 text-indigo-700 border border-indigo-100', dot: 'bg-indigo-500' },
        DELIVERED: { label: 'Đã giao',      classes: 'bg-green-50 text-green-700 border border-green-100',    dot: 'bg-green-500' },
        CANCELLED: { label: 'Đã hủy',       classes: 'bg-red-50 text-red-700 border border-red-100',          dot: 'bg-red-500' },
    }

    const getStatus = (status: string) =>
        statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' }

    return {
        // state
        activeTab, orders, addresses, isLoading,
        isOrderDetailLoading, isOrderDetailOpen,
        selectedOrder, orderQrSession, orderQrStatusMessage,
        isAddressModalOpen, modalMode, isSubmitting,
        isProfileSaving, isAvatarUploading,
        profileForm, avatarPreviewUrl,
        totalPoints, isMembershipLoading,
        provinces, districts, wards,
        selectedProvinceCode, selectedDistrictCode,
        addressForm,
        // actions
        init,
        openOrderDetail,
        closeOrderDetail,
        openAddressModal, openEditModal,
        handleSaveProfile, handleAvatarChange,
        handleAddAddress, handleDeleteAddress, handleSetDefault,
        handleLogout,
        // helpers
        formatPrice, formatDate, getStatus,
    }
}
