<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { orderService } from '@/api/orderService'
import { addressService, type Address } from '@/api/addressService'
import axios from 'axios'

const activeTab = ref<'orders' | 'addresses'>('orders')
const orders = ref<any[]>([])
const addresses = ref<Address[]>([])
const isLoading = ref(true)
const isAddressModalOpen = ref(false)
const userInfo = ref<any>(JSON.parse(localStorage.getItem('user_info') || '{}'))

// Vietnam Address Data for Modal
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

const fetchOrders = async () => {
    try {
        const response = await orderService.getMyOrders()
        orders.value = response.data
    } catch (error) {
        console.error('Lỗi lấy đơn hàng:', error)
    }
}

const fetchAddresses = async () => {
    try {
        const response = await addressService.getMyAddresses()
        addresses.value = response.data
    } catch (error) {
        console.error('Lỗi lấy địa chỉ:', error)
    }
}

const fetchProvinces = async () => {
    try {
        const res = await axios.get(`${PROVINCE_API}/p/`)
        provinces.value = res.data
    } catch (error) {
        console.error('Lỗi lấy tỉnh thành:', error)
    }
}

const fetchDistricts = async (provinceCode: number) => {
    try {
        const res = await axios.get(`${PROVINCE_API}/p/${provinceCode}?depth=2`)
        districts.value = res.data.districts
    } catch (error) {
        console.error('Lỗi lấy quận huyện:', error)
    }
}

const fetchWards = async (districtCode: number) => {
    try {
        const res = await axios.get(`${PROVINCE_API}/d/${districtCode}?depth=2`)
        wards.value = res.data.wards
    } catch (error) {
        console.error('Lỗi lấy phường xã:', error)
    }
}

watch(selectedProvinceCode, (newVal) => {
    addressForm.value.province = provinces.value.find(p => p.code === newVal)?.name || ''
    addressForm.value.district = ''
    addressForm.value.ward = ''
    selectedDistrictCode.value = ''
    districts.value = []
    wards.value = []
    if (newVal !== '') fetchDistricts(newVal as number)
})

watch(selectedDistrictCode, (newVal) => {
    addressForm.value.district = districts.value.find(d => d.code === newVal)?.name || ''
    addressForm.value.ward = ''
    wards.value = []
    if (newVal !== '') fetchWards(newVal as number)
})

const handleAddAddress = async () => {
    try {
        await addressService.addAddress(addressForm.value)
        alert('Thêm địa chỉ thành công!')
        isAddressModalOpen.value = false
        fetchAddresses()
        // Reset form
        addressForm.value = { recipient_name: '', phone: '', province: '', district: '', ward: '', street_address: '' }
        selectedProvinceCode.value = ''
        selectedDistrictCode.value = ''
    } catch (error: any) {
        alert(error.response?.data?.detail || 'Lỗi khi thêm địa chỉ.')
    }
}

onMounted(async () => {
    isLoading.value = true
    await Promise.all([fetchOrders(), fetchAddresses(), fetchProvinces()])
    isLoading.value = false
})

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const getStatusClass = (status: string) => {
    switch (status) {
        case 'DELIVERED': return 'bg-green-50 text-green-600'
        case 'CANCELLED': return 'bg-red-50 text-red-600'
        case 'PENDING': return 'bg-amber-50 text-amber-600'
        default: return 'bg-zinc-50 text-zinc-600'
    }
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
    <div class="bg-white min-h-screen pb-24">
        <div class="max-w-[1200px] mx-auto px-6 pt-16">
            <header class="mb-16 flex flex-col md:flex-row justify-between items-end gap-8">
                <div>
                    <h1 class="text-5xl serif-text text-zinc-900 mb-4 italic">My Account</h1>
                    <p class="text-[10px] uppercase tracking-[0.4em] text-zinc-400">Quản lý tài khoản & Đơn hàng</p>
                </div>
                <div class="text-right">
                    <h3 class="text-sm font-medium text-zinc-900 mb-1">{{ userInfo.full_name }}</h3>
                    <p class="text-xs text-zinc-400 font-light">{{ userInfo.email }}</p>
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

                        <div v-else-if="orders.length > 0" class="space-y-6">
                            <div v-for="order in orders" :key="order.order_id" class="border border-zinc-100 p-8 hover:shadow-xl hover:shadow-zinc-100/50 transition-all">
                                <div class="flex flex-col md:flex-row justify-between mb-8 gap-4">
                                    <div>
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-2">Mã đơn hàng</p>
                                        <h4 class="text-sm font-bold text-zinc-900">{{ order.order_code }}</h4>
                                    </div>
                                    <div>
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-2">Ngày đặt</p>
                                        <p class="text-sm text-zinc-900">{{ formatDate(order.created_at) }}</p>
                                    </div>
                                    <div>
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-2">Trạng thái</p>
                                        <span :class="['text-[9px] uppercase tracking-[0.15em] font-bold px-3 py-1.5 rounded-full', getStatusClass(order.status)]">
                                            {{ order.status }}
                                        </span>
                                    </div>
                                    <div class="text-right">
                                        <p class="text-[10px] uppercase tracking-[0.2em] text-zinc-400 mb-2">Tổng tiền</p>
                                        <p class="text-sm font-bold text-zinc-900">{{ formatPrice(order.total_amount) }}</p>
                                    </div>
                                </div>
                                <div class="mt-6 pt-6 border-t border-zinc-50 flex justify-end">
                                    <button class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 underline underline-offset-8 hover:text-zinc-500 transition-colors">Xem chi tiết</button>
                                </div>
                            </div>
                        </div>
                        <div v-else class="text-center py-24 border border-dashed border-zinc-100">
                            <p class="text-zinc-400 text-sm uppercase tracking-widest">Bạn chưa có đơn hàng nào.</p>
                        </div>
                    </div>

                    <!-- Tab Addresses -->
                    <div v-if="activeTab === 'addresses'">
                        <div class="flex justify-between items-end mb-8 border-b border-zinc-100 pb-4">
                            <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900">Sổ địa chỉ của bạn</h2>
                            <button @click="isAddressModalOpen = true" class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 underline underline-offset-4">Thêm địa chỉ mới</button>
                        </div>

                        <div v-if="addresses.length === 0" class="text-center py-20 text-zinc-400 italic">
                            Bạn chưa lưu địa chỉ nào.
                        </div>

                        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div v-for="addr in addresses" :key="addr.address_id" class="border border-zinc-100 p-6 relative group">
                                <div v-if="addr.is_default" class="absolute top-4 right-6 bg-zinc-900 text-white text-[8px] uppercase px-2 py-1 font-bold tracking-widest">Mặc định</div>
                                <h4 class="text-xs font-bold text-zinc-900 mb-2 uppercase tracking-tight">{{ addr.recipient_name }}</h4>
                                <p class="text-[11px] text-zinc-500 mb-1">{{ addr.phone }}</p>
                                <p class="text-[11px] text-zinc-400 font-light leading-relaxed">
                                    {{ addr.street_address }}<br />
                                    {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}
                                </p>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>

        <!-- Address Modal -->
        <div v-if="isAddressModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm">
            <div class="bg-white w-full max-w-xl shadow-2xl p-10 space-y-8">
                <header class="flex justify-between items-center">
                    <h2 class="text-2xl serif-text italic">Thêm địa chỉ mới</h2>
                    <button @click="isAddressModalOpen = false" class="material-symbols-outlined text-zinc-400 hover:text-zinc-900">close</button>
                </header>

                <form @submit.prevent="handleAddAddress" class="space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-zinc-400">Tên người nhận</label>
                            <input v-model="addressForm.recipient_name" required type="text" class="w-full border-b border-zinc-100 py-2 focus:border-zinc-900 outline-none text-sm font-light" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-zinc-400">Số điện thoại</label>
                            <input v-model="addressForm.phone" required type="tel" class="w-full border-b border-zinc-100 py-2 focus:border-zinc-900 outline-none text-sm font-light" />
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-zinc-400">Tỉnh / Thành phố</label>
                            <select v-model="selectedProvinceCode" required class="w-full border-b border-zinc-100 py-2 focus:border-zinc-900 outline-none text-sm font-light bg-transparent">
                                <option value="" disabled>Chọn Tỉnh / Thành phố</option>
                                <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-zinc-400">Quận / Huyện</label>
                            <select v-model="selectedDistrictCode" :disabled="selectedProvinceCode === ''" required class="w-full border-b border-zinc-100 py-2 focus:border-zinc-900 outline-none text-sm font-light bg-transparent disabled:opacity-30">
                                <option value="" disabled>Chọn Quận / Huyện</option>
                                <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-zinc-400">Phường / Xã</label>
                            <select v-model="addressForm.ward" :disabled="selectedDistrictCode === ''" required class="w-full border-b border-zinc-100 py-2 focus:border-zinc-900 outline-none text-sm font-light bg-transparent disabled:opacity-30">
                                <option value="" disabled>Chọn Phường / Xã</option>
                                <option v-for="w in wards" :key="w.code" :value="w.name">{{ w.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-zinc-400">Địa chỉ chi tiết</label>
                            <input v-model="addressForm.street_address" required type="text" class="w-full border-b border-zinc-100 py-2 focus:border-zinc-900 outline-none text-sm font-light" placeholder="Số nhà, tên đường..." />
                        </div>
                    </div>

                    <button type="submit" class="w-full bg-zinc-900 text-white py-4 text-[10px] uppercase font-bold tracking-widest hover:bg-zinc-800 transition-all">Lưu địa chỉ</button>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.serif-text { font-family: 'Playfair Display', serif; }
</style>
