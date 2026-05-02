<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { orderService } from '@/pages/cart/orderService'
import { addressService, type Address } from '@/pages/profile/addressService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import axios from 'axios'

const router = useRouter()
const authStore = useAuthStore()
const uiStore = useUIStore()

type Tab = 'orders' | 'addresses' | 'profile'
const activeTab = ref<Tab>('orders')

const orders = ref<any[]>([])
const addresses = ref<Address[]>([])
const isLoading = ref(true)
const isAddressModalOpen = ref(false)

// Address form
const provinces = ref<any[]>([])
const districts = ref<any[]>([])
const wards = ref<any[]>([])
const selectedProvinceCode = ref<number | ''>('')
const selectedDistrictCode = ref<number | ''>('')
const addressForm = ref({
    recipient_name: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    street_address: ''
})

const PROVINCE_API = 'https://provinces.open-api.vn/api'

// ── Data fetching ──────────────────────────────────────────────
const fetchOrders = async () => {
    try {
        const res = await orderService.getMyOrders()
        orders.value = res.data
    } catch (e) {
        console.error('Lỗi lấy đơn hàng:', e)
    }
}

const fetchAddresses = async () => {
    try {
        const res = await addressService.getMyAddresses()
        addresses.value = res.data
    } catch (e) {
        console.error('Lỗi lấy địa chỉ:', e)
    }
}

const fetchProvinces = async () => {
    try {
        const res = await axios.get(`${PROVINCE_API}/p/`)
        provinces.value = res.data
    } catch (e) { console.error(e) }
}

const fetchDistricts = async (code: number) => {
    try {
        const res = await axios.get(`${PROVINCE_API}/p/${code}?depth=2`)
        districts.value = res.data.districts
    } catch (e) { console.error(e) }
}

const fetchWards = async (code: number) => {
    try {
        const res = await axios.get(`${PROVINCE_API}/d/${code}?depth=2`)
        wards.value = res.data.wards
    } catch (e) { console.error(e) }
}

watch(selectedProvinceCode, (val) => {
    addressForm.value.province = provinces.value.find(p => p.code === val)?.name || ''
    addressForm.value.district = ''; addressForm.value.ward = ''
    selectedDistrictCode.value = ''; districts.value = []; wards.value = []
    if (val !== '') fetchDistricts(val as number)
})

watch(selectedDistrictCode, (val) => {
    addressForm.value.district = districts.value.find(d => d.code === val)?.name || ''
    addressForm.value.ward = ''; wards.value = []
    if (val !== '') fetchWards(val as number)
})

const handleAddAddress = async () => {
    try {
        await addressService.addAddress(addressForm.value)
        uiStore.success('Thêm địa chỉ thành công!')
        isAddressModalOpen.value = false
        fetchAddresses()
        addressForm.value = { recipient_name: '', phone: '', province: '', district: '', ward: '', street_address: '' }
        selectedProvinceCode.value = ''; selectedDistrictCode.value = ''
    } catch (error: any) {
        uiStore.error(error.response?.data?.detail || 'Lỗi khi thêm địa chỉ.')
    }
}

const handleLogout = () => {
    authStore.logout()
    router.push({ name: 'login' })
}

onMounted(async () => {
    isLoading.value = true
    await Promise.all([fetchOrders(), fetchAddresses(), fetchProvinces()])
    isLoading.value = false
})

// ── Helpers ────────────────────────────────────────────────────
const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

const statusConfig: Record<string, { label: string; classes: string; dot: string }> = {
    PENDING:   { label: 'Chờ xác nhận', classes: 'bg-amber-50 text-amber-700 border border-amber-100',  dot: 'bg-amber-500 animate-pulse' },
    CONFIRMED: { label: 'Đã xác nhận',  classes: 'bg-blue-50 text-blue-700 border border-blue-100',     dot: 'bg-blue-500' },
    SHIPPING:  { label: 'Đang giao',    classes: 'bg-indigo-50 text-indigo-700 border border-indigo-100', dot: 'bg-indigo-500' },
    DELIVERED: { label: 'Đã giao',      classes: 'bg-green-50 text-green-700 border border-green-100',  dot: 'bg-green-500' },
    CANCELLED: { label: 'Đã hủy',       classes: 'bg-red-50 text-red-700 border border-red-100',        dot: 'bg-red-500' },
}

const getStatus = (status: string) =>
    statusConfig[status] || { label: status, classes: 'bg-gray-100 text-gray-600 border border-gray-200', dot: 'bg-gray-400' }

const navItems: { key: Tab; icon: string; label: string }[] = [
    { key: 'profile',   icon: 'person',    label: 'Hồ sơ' },
    { key: 'orders',    icon: 'package_2', label: 'Đơn hàng' },
    { key: 'addresses', icon: 'location_on', label: 'Địa chỉ' },
]
</script>

<template>
    <div class="bg-background-light min-h-screen pb-24">
        <div class="max-w-[1400px] mx-auto px-6 py-12 md:px-12 flex flex-col md:flex-row gap-12">

            <!-- ── SIDEBAR ─────────────────────────────────────── -->
            <aside class="w-full md:w-64 flex-shrink-0">
                <!-- User info -->
                <div class="flex items-center gap-4 mb-10">
                    <div class="w-16 h-16 rounded-full bg-primary-light border border-border-light shadow-sm flex items-center justify-center overflow-hidden">
                        <span class="material-symbols-outlined text-primary text-3xl">person</span>
                    </div>
                    <div>
                        <h1 class="font-semibold text-lg text-fashion-black">{{ authStore.userName }}</h1>
                        <p class="text-xs text-text-muted uppercase tracking-wide">{{ authStore.user?.email }}</p>
                    </div>
                </div>

                <!-- Nav -->
                <nav class="flex flex-col gap-1">
                    <button
                        v-for="item in navItems"
                        :key="item.key"
                        @click="activeTab = item.key"
                        :class="[
                            'flex items-center gap-4 px-4 py-3 transition-colors group text-left',
                            activeTab === item.key
                                ? 'bg-fashion-black text-white shadow-sm'
                                : 'text-text-muted hover:bg-border-light hover:text-fashion-black'
                        ]"
                    >
                        <span class="material-symbols-outlined text-[20px]" :style="activeTab === item.key ? 'font-variation-settings:\'FILL\' 1' : ''">{{ item.icon }}</span>
                        <span class="text-sm font-medium">{{ item.label }}</span>
                    </button>

                    <hr class="border-border-light my-2" />

                    <button
                        @click="handleLogout"
                        class="flex items-center gap-4 px-4 py-3 text-text-muted hover:bg-red-50 hover:text-red-600 transition-colors group text-left"
                    >
                        <span class="material-symbols-outlined text-[20px] group-hover:scale-110 transition-transform">logout</span>
                        <span class="text-sm font-medium">Đăng xuất</span>
                    </button>
                </nav>
            </aside>

            <!-- ── MAIN CONTENT ────────────────────────────────── -->
            <section class="flex-1 min-w-0">

                <!-- ── TAB: ORDERS ── -->
                <div v-if="activeTab === 'orders'">
                    <div class="mb-8">
                        <h2 class="text-3xl font-light tracking-tight text-fashion-black mb-2">Lịch sử đơn hàng</h2>
                        <p class="text-text-muted text-sm max-w-lg">Theo dõi các đơn hàng gần đây và xem chi tiết.</p>
                    </div>

                    <!-- Loading -->
                    <div v-if="isLoading" class="flex justify-center py-20">
                        <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>

                    <!-- Orders table -->
                    <div v-else-if="orders.length > 0" class="bg-white border border-gray-100 shadow-sm overflow-hidden">
                        <div class="overflow-x-auto">
                            <table class="w-full text-left border-collapse">
                                <thead>
                                    <tr class="border-b border-gray-100 bg-gray-50/50">
                                        <th class="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/5">Mã đơn</th>
                                        <th class="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/4">Ngày đặt</th>
                                        <th class="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/6">Trạng thái</th>
                                        <th class="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider w-1/6">Tổng tiền</th>
                                        <th class="p-5 text-xs font-semibold text-gray-500 uppercase tracking-wider text-right w-1/5">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody class="divide-y divide-gray-50">
                                    <tr
                                        v-for="order in orders"
                                        :key="order.order_id"
                                        class="hover:bg-gray-50 transition-colors group"
                                    >
                                        <td class="p-5">
                                            <span class="font-medium text-sm text-fashion-black">{{ order.order_code }}</span>
                                        </td>
                                        <td class="p-5 text-sm text-gray-600">
                                            {{ formatDate(order.created_at) }}
                                        </td>
                                        <td class="p-5">
                                            <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium', getStatus(order.status).classes]">
                                                <span :class="['w-1.5 h-1.5 rounded-full', getStatus(order.status).dot]"></span>
                                                {{ getStatus(order.status).label }}
                                            </span>
                                        </td>
                                        <td class="p-5 font-medium text-sm text-fashion-black">
                                            {{ formatPrice(order.total_amount) }}
                                        </td>
                                        <td class="p-5 text-right">
                                            <button class="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-wider text-fashion-black border-b border-transparent hover:border-fashion-black transition-all pb-0.5">
                                                Xem chi tiết
                                                <span class="material-symbols-outlined text-[16px]">arrow_forward</span>
                                            </button>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        <!-- Table footer -->
                        <div class="px-5 py-4 border-t border-gray-100 flex items-center justify-between bg-white">
                            <span class="text-xs text-gray-500">{{ orders.length }} đơn hàng</span>
                        </div>
                    </div>

                    <!-- Empty -->
                    <div v-else class="text-center py-24 border border-dashed border-border-light">
                        <span class="material-symbols-outlined text-5xl text-border-light mb-4 block">package_2</span>
                        <p class="text-text-muted text-sm uppercase tracking-widest mb-6">Bạn chưa có đơn hàng nào.</p>
                        <router-link to="/products" class="btn-outline px-8 py-3">Khám phá sản phẩm</router-link>
                    </div>
                </div>

                <!-- ── TAB: ADDRESSES ── -->
                <div v-if="activeTab === 'addresses'">
                    <div class="flex justify-between items-end mb-8">
                        <div>
                            <h2 class="text-3xl font-light tracking-tight text-fashion-black mb-2">Sổ địa chỉ</h2>
                            <p class="text-text-muted text-sm">Quản lý địa chỉ giao hàng của bạn.</p>
                        </div>
                        <button
                            @click="isAddressModalOpen = true"
                            class="btn-outline px-5 py-2.5 text-sm"
                        >
                            + Thêm địa chỉ
                        </button>
                    </div>

                    <div v-if="isLoading" class="flex justify-center py-20">
                        <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>

                    <div v-else-if="addresses.length === 0" class="text-center py-20 text-text-muted italic border border-dashed border-border-light">
                        Bạn chưa lưu địa chỉ nào.
                    </div>

                    <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div
                            v-for="addr in addresses"
                            :key="addr.address_id"
                            class="bg-white border border-gray-100 p-6 relative hover:border-primary transition-colors"
                        >
                            <div v-if="addr.is_default" class="absolute top-4 right-4 bg-primary text-white text-[9px] uppercase px-2 py-1 font-bold tracking-widest rounded">
                                Mặc định
                            </div>
                            <h4 class="text-sm font-bold text-fashion-black mb-2">{{ addr.recipient_name }}</h4>
                            <p class="text-xs text-text-muted mb-1">{{ addr.phone }}</p>
                            <p class="text-xs text-text-muted font-light leading-relaxed">
                                {{ addr.street_address }},
                                {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}
                            </p>
                        </div>
                    </div>
                </div>

                <!-- ── TAB: PROFILE ── -->
                <div v-if="activeTab === 'profile'">
                    <div class="mb-8">
                        <h2 class="text-3xl font-light tracking-tight text-fashion-black mb-2">Thông tin cá nhân</h2>
                        <p class="text-text-muted text-sm">Quản lý thông tin tài khoản của bạn.</p>
                    </div>

                    <div class="bg-white border border-gray-100 p-8 max-w-lg">
                        <div class="space-y-6">
                            <div>
                                <label class="text-[9px] uppercase tracking-widest font-bold text-text-muted block mb-2">Họ và tên</label>
                                <p class="text-sm font-medium text-fashion-black">{{ authStore.user?.full_name }}</p>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase tracking-widest font-bold text-text-muted block mb-2">Email</label>
                                <p class="text-sm font-medium text-fashion-black">{{ authStore.user?.email }}</p>
                            </div>
                            <div>
                                <label class="text-[9px] uppercase tracking-widest font-bold text-text-muted block mb-2">Vai trò</label>
                                <p class="text-sm font-medium text-fashion-black capitalize">{{ authStore.user?.role?.toLowerCase() }}</p>
                            </div>
                        </div>
                    </div>
                </div>

            </section>
        </div>

        <!-- ── ADDRESS MODAL ──────────────────────────────────── -->
        <div v-if="isAddressModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-fashion-black/60 backdrop-blur-sm">
            <div class="bg-white w-full max-w-xl shadow-2xl p-10 space-y-8">
                <header class="flex justify-between items-center">
                    <h2 class="text-2xl font-serif italic text-fashion-black">Thêm địa chỉ mới</h2>
                    <button @click="isAddressModalOpen = false" class="material-symbols-outlined text-text-muted hover:text-fashion-black">close</button>
                </header>

                <form @submit.prevent="handleAddAddress" class="space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Tên người nhận</label>
                            <input v-model="addressForm.recipient_name" required type="text" class="input-underline" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Số điện thoại</label>
                            <input v-model="addressForm.phone" required type="tel" class="input-underline" />
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Tỉnh / Thành phố</label>
                            <select v-model="selectedProvinceCode" required class="input-underline bg-transparent">
                                <option value="" disabled>Chọn Tỉnh / Thành phố</option>
                                <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Quận / Huyện</label>
                            <select v-model="selectedDistrictCode" :disabled="selectedProvinceCode === ''" required class="input-underline bg-transparent disabled:opacity-30">
                                <option value="" disabled>Chọn Quận / Huyện</option>
                                <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Phường / Xã</label>
                            <select v-model="addressForm.ward" :disabled="selectedDistrictCode === ''" required class="input-underline bg-transparent disabled:opacity-30">
                                <option value="" disabled>Chọn Phường / Xã</option>
                                <option v-for="w in wards" :key="w.code" :value="w.name">{{ w.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Địa chỉ chi tiết</label>
                            <input v-model="addressForm.street_address" required type="text" class="input-underline" placeholder="Số nhà, tên đường..." />
                        </div>
                    </div>

                    <button type="submit" class="btn-dark w-full py-4">Lưu địa chỉ</button>
                </form>
            </div>
        </div>
    </div>
</template>
