<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { orderService } from '@/pages/cart/orderService'
import { addressService, type Address } from '@/pages/profile/addressService'
import { membershipService, getTierByPoints } from '@/pages/auth/membershipService'
import MembershipCard from '@/pages/auth/components/MembershipCard.vue'
import AddressesTab from '@/pages/profile/components/AddressesTab.vue'
import AddressModal from '@/pages/profile/components/AddressModal.vue'
import { useUIStore } from '@/stores/useUIStore'
import axios from 'axios'

const uiStore = useUIStore()

const activeTab = ref<'orders' | 'membership' | 'addresses'>('orders')
const orders = ref<any[]>([])
const addresses = ref<Address[]>([])
const isLoading = ref(true)
const isMembershipLoading = ref(true)
const userInfo = ref<any>(JSON.parse(localStorage.getItem('user_info') || '{}'))
const totalPoints = ref(0)

// ── Address Modal ──────────────────────────────────────────────────
const modalMode = ref<'add' | 'edit'>('add')
const isModalOpen = ref(false)
const isSubmitting = ref(false)
const editingAddressId = ref<number | null>(null)

const PROVINCE_API = 'https://provinces.open-api.vn/api'
const provinces = ref<any[]>([])
const districts = ref<any[]>([])
const wards     = ref<any[]>([])
const selectedProvinceCode = ref<number | ''>('')
const selectedDistrictCode = ref<number | ''>('')

const emptyForm = () => ({
    recipient_name: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    street_address: '',
    is_default: false,
})
const addressForm = ref(emptyForm())

// ── Fetch helpers ──────────────────────────────────────────────────
const fetchOrders = async () => {
    try { orders.value = (await orderService.getMyOrders()).data }
    catch (e) { console.error(e) }
}

const fetchAddresses = async () => {
    try { addresses.value = (await addressService.getMyAddresses()).data }
    catch (e) { console.error(e) }
}

const fetchMembership = async () => {
    isMembershipLoading.value = true
    try { totalPoints.value = (await membershipService.getRewardHistory()).data.total_points ?? 0 }
    catch (e) { console.error(e) }
    finally { isMembershipLoading.value = false }
}

const fetchProvinces = async () => {
    try { provinces.value = (await axios.get(`${PROVINCE_API}/p/`)).data }
    catch (e) { console.error(e) }
}

const fetchDistricts = async (code: number) => {
    try { districts.value = (await axios.get(`${PROVINCE_API}/p/${code}?depth=2`)).data.districts }
    catch (e) { console.error(e) }
}

const fetchWards = async (code: number) => {
    try { wards.value = (await axios.get(`${PROVINCE_API}/d/${code}?depth=2`)).data.wards }
    catch (e) { console.error(e) }
}

// ── Watchers cascading ─────────────────────────────────────────────
watch(selectedProvinceCode, (val) => {
    addressForm.value.province = provinces.value.find(p => p.code === val)?.name || ''
    addressForm.value.district = ''
    addressForm.value.ward = ''
    selectedDistrictCode.value = ''
    districts.value = []
    wards.value = []
    if (val !== '') fetchDistricts(val as number)
})

watch(selectedDistrictCode, (val) => {
    addressForm.value.district = districts.value.find(d => d.code === val)?.name || ''
    addressForm.value.ward = ''
    wards.value = []
    if (val !== '') fetchWards(val as number)
})

// ── Modal open/close ───────────────────────────────────────────────
const openAdd = () => {
    modalMode.value = 'add'
    editingAddressId.value = null
    addressForm.value = emptyForm()
    selectedProvinceCode.value = ''
    selectedDistrictCode.value = ''
    districts.value = []
    wards.value = []
    isModalOpen.value = true
}

const openEdit = (addr: Address) => {
    modalMode.value = 'edit'
    editingAddressId.value = addr.address_id
    addressForm.value = {
        recipient_name: addr.recipient_name,
        phone: addr.phone,
        province: addr.province,
        district: addr.district,
        ward: addr.ward,
        street_address: addr.street_address,
        is_default: addr.is_default,
    }
    // Reset cascading — text đã có sẵn trong form
    selectedProvinceCode.value = ''
    selectedDistrictCode.value = ''
    districts.value = []
    wards.value = []
    isModalOpen.value = true
}

const closeModal = () => { isModalOpen.value = false }

// ── Submit (thêm / sửa) ────────────────────────────────────────────
const handleSubmit = async () => {
    isSubmitting.value = true
    try {
        if (modalMode.value === 'edit' && editingAddressId.value) {
            await addressService.updateAddress(editingAddressId.value, addressForm.value)
            uiStore.success('Cập nhật địa chỉ thành công!')
        } else {
            await addressService.addAddress(addressForm.value)
            uiStore.success('Thêm địa chỉ thành công!')
        }
        closeModal()
        await fetchAddresses()
    } catch (e: any) {
        uiStore.error(e.response?.data?.detail || 'Có lỗi xảy ra.')
    } finally {
        isSubmitting.value = false
    }
}

// ── Xóa địa chỉ ───────────────────────────────────────────────────
const handleDelete = async (addr: Address) => {
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
        await fetchAddresses()
    } catch (e: any) {
        uiStore.error(e.response?.data?.detail || 'Lỗi khi xóa địa chỉ.')
    }
}

// ── Đặt mặc định ──────────────────────────────────────────────────
const handleSetDefault = async (addr: Address) => {
    try {
        await addressService.setDefault(addr.address_id)
        uiStore.success('Đã đặt làm địa chỉ mặc định.')
        await fetchAddresses()
    } catch (e: any) {
        uiStore.error(e.response?.data?.detail || 'Lỗi khi đặt mặc định.')
    }
}

// ── Lifecycle ──────────────────────────────────────────────────────
onMounted(async () => {
    isLoading.value = true
    await Promise.all([fetchOrders(), fetchAddresses(), fetchProvinces(), fetchMembership()])
    isLoading.value = false
})

const currentTier = computed(() => getTierByPoints(totalPoints.value))

// ── Helpers hiển thị ──────────────────────────────────────────────
const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const getStatusClass = (status: string) => {
    switch (status) {
        case 'DELIVERED': return 'bg-green-50 text-green-700 border border-green-100'
        case 'CANCELLED': return 'bg-red-50 text-red-700 border border-red-100'
        case 'PENDING':   return 'bg-amber-50 text-amber-700 border border-amber-100'
        case 'SHIPPING':  return 'bg-blue-50 text-blue-700 border border-blue-100'
        case 'CONFIRMED': return 'bg-primary-light text-primary border border-primary/20'
        default:          return 'bg-zinc-50 text-zinc-600 border border-zinc-100'
    }
}

const getStatusDot = (status: string) => {
    switch (status) {
        case 'DELIVERED': return 'bg-green-500'
        case 'CANCELLED': return 'bg-red-500'
        case 'PENDING':   return 'bg-amber-500 animate-pulse'
        case 'SHIPPING':  return 'bg-blue-500'
        case 'CONFIRMED': return 'bg-primary'
        default:          return 'bg-zinc-400'
    }
}

const getStatusLabel = (status: string) => {
    const map: Record<string, string> = {
        PENDING: 'Chờ xác nhận', CONFIRMED: 'Đã xác nhận',
        SHIPPING: 'Đang giao', DELIVERED: 'Đã giao', CANCELLED: 'Đã hủy',
    }
    return map[status] || status
}

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
</script>

<template>
    <div class="bg-white min-h-screen pb-24">
        <div class="max-w-[1200px] mx-auto px-6 pt-16">
            <header class="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
                <div>
                    <h1 class="text-5xl font-serif text-zinc-900 mb-4 italic">My Account</h1>
                    <p class="text-[10px] uppercase tracking-[0.4em] text-zinc-400">Quản lý tài khoản & Đơn hàng</p>
                </div>
                <div class="text-right space-y-3">
                    <div>
                        <h3 class="text-sm font-medium text-zinc-900 mb-1">{{ userInfo.full_name }}</h3>
                        <p class="text-xs text-zinc-400 font-light">{{ userInfo.email }}</p>
                    </div>
                    <!-- Stats: đơn hàng + hạng thành viên -->
                    <div class="flex items-center gap-6 justify-end">
                        <div class="text-right">
                            <p class="text-xl font-bold text-zinc-900">{{ orders.length }}</p>
                            <p class="text-[9px] uppercase tracking-widest text-zinc-400">Đơn hàng</p>
                        </div>
                        <div class="w-px h-8 bg-zinc-100"></div>
                        <div class="text-right">
                            <p :class="['text-xl font-bold', currentTier.color]">{{ currentTier.label }}</p>
                            <p class="text-[9px] uppercase tracking-widest text-zinc-400">Hạng thành viên</p>
                        </div>
                    </div>
                </div>
            </header>

            <div class="flex flex-col lg:flex-row gap-16">
                <!-- Sidebar -->
                <aside class="w-full lg:w-64 shrink-0">
                    <nav class="flex flex-col gap-1">
                        <button 
                            @click="activeTab = 'orders'"
                            :class="['text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all', activeTab === 'orders' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-50']"
                        >
                            Đơn hàng của tôi
                        </button>
                        <button 
                            @click="activeTab = 'membership'"
                            :class="['text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all', activeTab === 'membership' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-50']"
                        >
                            Hạng thành viên
                        </button>
                        <button 
                            @click="activeTab = 'addresses'"
                            :class="['text-left px-6 py-4 text-[10px] uppercase tracking-[0.2em] font-bold transition-all', activeTab === 'addresses' ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:bg-zinc-50']"
                        >
                            Sổ địa chỉ
                        </button>
                    </nav>
                </aside>

                <!-- Content Area -->
                <main class="flex-grow">
                    <!-- Tab Orders -->
                    <div v-if="activeTab === 'orders'">
                        <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">Lịch sử đặt hàng</h2>

                        <div v-if="isLoading" class="flex justify-center py-20">
                            <div class="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full"></div>
                        </div>

                        <div v-else-if="orders.length > 0" class="bg-white border border-zinc-100 shadow-sm overflow-hidden">
                            <div class="overflow-x-auto">
                                <table class="w-full text-left border-collapse">
                                    <thead>
                                        <tr class="border-b border-zinc-100 bg-zinc-50/50">
                                            <th class="p-5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Mã đơn</th>
                                            <th class="p-5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Ngày đặt</th>
                                            <th class="p-5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Trạng thái</th>
                                            <th class="p-5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest">Tổng tiền</th>
                                            <th class="p-5 text-[9px] font-bold text-zinc-400 uppercase tracking-widest text-right">Thao tác</th>
                                        </tr>
                                    </thead>
                                    <tbody class="divide-y divide-zinc-50">
                                        <tr
                                            v-for="order in orders"
                                            :key="order.order_id"
                                            class="hover:bg-zinc-50/50 transition-colors"
                                        >
                                            <td class="p-5">
                                                <span class="font-bold text-sm text-zinc-900">{{ order.order_code }}</span>
                                            </td>
                                            <td class="p-5 text-sm text-zinc-500 font-light">
                                                {{ formatDate(order.created_at) }}
                                            </td>
                                            <td class="p-5">
                                                <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest', getStatusClass(order.status)]">
                                                    <span :class="['w-1.5 h-1.5 rounded-full', getStatusDot(order.status)]"></span>
                                                    {{ getStatusLabel(order.status) }}
                                                </span>
                                            </td>
                                            <td class="p-5 font-bold text-sm text-zinc-900">
                                                {{ formatPrice(order.total_amount) }}
                                            </td>
                                            <td class="p-5 text-right">
                                                <button class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-zinc-900 border-b border-transparent hover:border-zinc-900 transition-all pb-0.5">
                                                    Xem chi tiết
                                                    <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        <div v-else class="text-center py-24 border border-dashed border-zinc-100">
                            <span class="material-symbols-outlined text-5xl text-zinc-200 mb-4 block">package_2</span>
                            <p class="text-zinc-400 text-sm uppercase tracking-widest mb-6">Bạn chưa có đơn hàng nào.</p>
                            <router-link to="/products" class="inline-block border border-zinc-900 px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-900 hover:text-white transition-all">
                                Khám phá sản phẩm
                            </router-link>
                        </div>
                    </div>

                    <!-- Tab Membership -->
                    <div v-if="activeTab === 'membership'">
                        <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">Hạng thành viên</h2>
                        <div class="max-w-lg">
                            <MembershipCard :total-points="totalPoints" :is-loading="isMembershipLoading" />
                        </div>
                    </div>

                    <!-- Tab Addresses -->
                    <div v-if="activeTab === 'addresses'">
                        <AddressesTab
                            :addresses="addresses"
                            :is-loading="isLoading"
                            @open-add="openAdd"
                            @open-edit="openEdit"
                            @delete="handleDelete"
                            @set-default="handleSetDefault"
                        />
                    </div>
                </main>
            </div>
        </div>

        <!-- Address Modal (thêm / sửa) -->
        <AddressModal
            v-if="isModalOpen"
            :mode="modalMode"
            :form="addressForm"
            :provinces="provinces"
            :districts="districts"
            :wards="wards"
            :selected-province-code="selectedProvinceCode"
            :selected-district-code="selectedDistrictCode"
            :is-submitting="isSubmitting"
            @close="closeModal"
            @submit="handleSubmit"
            @update:selected-province-code="selectedProvinceCode = $event"
            @update:selected-district-code="selectedDistrictCode = $event"
        />
    </div>
</template>

<style scoped>
/* Không còn hardcode font — dùng font-serif và font-display từ main.css */
</style>
