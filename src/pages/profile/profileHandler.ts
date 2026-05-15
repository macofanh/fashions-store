import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { profileServices } from './profileServices'
import { membershipService, getTierByPoints } from './membershipService'
import type { Address } from './addressService'
import { addressService } from './addressService'

export type ProfileTab = 'orders' | 'membership' | 'addresses' | 'profile'

export function profileHandler() {
    const router    = useRouter()
    const authStore = useAuthStore()
    const uiStore   = useUIStore()

    // ── State ──────────────────────────────────────────────────────
    const activeTab           = ref<ProfileTab>('orders')
    const orders              = ref<any[]>([])
    const addresses           = ref<Address[]>([])
    const isLoading           = ref(true)
    const isAddressModalOpen  = ref(false)
    const totalPoints         = ref(0)
    const isMembershipLoading = ref(true)

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
    }

    // Gọi khi component mount — chỉ load tab đang active
    const init = () => {
        loadTab(activeTab.value)
    }

    // Khi user bấm sang tab khác mới gọi API của tab đó
    watch(activeTab, (tab) => {
        loadTab(tab)
    })

    const refreshAddresses = async () => {
        const res = await profileServices.getMyAddresses()
        addresses.value = res.data
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
        isAddressModalOpen, modalMode, isSubmitting,
        totalPoints, isMembershipLoading,
        provinces, districts, wards,
        selectedProvinceCode, selectedDistrictCode,
        addressForm,
        // actions
        init,
        openAddressModal, openEditModal,
        handleAddAddress, handleDeleteAddress, handleSetDefault,
        handleLogout,
        // helpers
        formatPrice, formatDate, getStatus,
    }
}
