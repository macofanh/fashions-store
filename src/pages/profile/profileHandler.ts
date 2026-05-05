import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { profileServices } from './profileServices'
import type { Address } from './addressService'

export type ProfileTab = 'orders' | 'addresses' | 'profile'

export function profileHandler() {
    const router    = useRouter()
    const authStore = useAuthStore()
    const uiStore   = useUIStore()

    // ── State ──────────────────────────────────────────────────────
    const activeTab          = ref<ProfileTab>('orders')
    const orders             = ref<any[]>([])
    const addresses          = ref<Address[]>([])
    const isLoading          = ref(true)
    const isAddressModalOpen = ref(false)

    // Address form
    const provinces            = ref<any[]>([])
    const districts            = ref<any[]>([])
    const wards                = ref<any[]>([])
    const selectedProvinceCode = ref<number | ''>('')
    const selectedDistrictCode = ref<number | ''>('')
    const addressForm          = ref({
        recipient_name: '',
        phone:          '',
        province:       '',
        district:       '',
        ward:           '',
        street_address: '',
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

    // ── Init ───────────────────────────────────────────────────────
    const init = async () => {
        isLoading.value = true
        try {
            const [ordersRes, addressesRes, provincesRes] = await Promise.all([
                profileServices.getMyOrders(),
                profileServices.getMyAddresses(),
                profileServices.getProvinces(),
            ])
            orders.value    = ordersRes.data
            addresses.value = addressesRes.data
            provinces.value = provincesRes.data
        } catch (e) {
            console.error('Lỗi khởi tạo profile:', e)
        } finally {
            isLoading.value = false
        }
    }

    // ── Actions ────────────────────────────────────────────────────
    const openAddressModal = () => {
        addressForm.value = { recipient_name: '', phone: '', province: '', district: '', ward: '', street_address: '' }
        selectedProvinceCode.value = ''; selectedDistrictCode.value = ''
        isAddressModalOpen.value = true
    }

    const handleAddAddress = async () => {
        try {
            await profileServices.addAddress(addressForm.value)
            uiStore.success('Thêm địa chỉ thành công!')
            isAddressModalOpen.value = false
            const res = await profileServices.getMyAddresses()
            addresses.value = res.data
        } catch (e: any) {
            uiStore.error(e.response?.data?.detail || 'Lỗi khi thêm địa chỉ.')
        }
    }

    const handleLogout = () => {
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
        isAddressModalOpen,
        provinces, districts, wards,
        selectedProvinceCode, selectedDistrictCode,
        addressForm,
        // actions
        init, openAddressModal, handleAddAddress, handleLogout,
        // helpers
        formatPrice, formatDate, getStatus,
    }
}
