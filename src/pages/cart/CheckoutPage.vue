<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { cartService } from '@/pages/cart/cartService'
import { orderService, type OrderCreateData } from '@/pages/cart/orderService'
import { promotionService, type UserVoucher } from '@/pages/promotions/promotionService'
import { getImageUrl } from '@/lib/urlHelper'
import axios from 'axios'

const route = useRoute()
const router = useRouter()
const cart = ref<any>(null)
const myVouchers = ref<UserVoucher[]>([])
const selectedVoucher = ref<UserVoucher | null>(null)
const isLoading = ref(true)
const isSubmitting = ref(false)

const form = ref({
    recipient_name: '',
    phone: '',
    province: '',
    district: '',
    ward: '',
    street_address: '',
    payment_method: 'COD',
    note: ''
})

// Vietnam Address Data
const provinces = ref<any[]>([])
const districts = ref<any[]>([])
const wards = ref<any[]>([])

const selectedProvinceCode = ref<number | ''>('')
const selectedDistrictCode = ref<number | ''>('')

const PROVINCE_API = 'https://provinces.open-api.vn/api'

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
    form.value.province = provinces.value.find(p => p.code === newVal)?.name || ''
    form.value.district = ''
    form.value.ward = ''
    selectedDistrictCode.value = ''
    districts.value = []
    wards.value = []
    if (newVal !== '') fetchDistricts(newVal as number)
})

watch(selectedDistrictCode, (newVal) => {
    form.value.district = districts.value.find(d => d.code === newVal)?.name || ''
    form.value.ward = ''
    wards.value = []
    if (newVal !== '') fetchWards(newVal as number)
})

const fetchData = async () => {
    try {
        const [cartRes, vouchersRes] = await Promise.all([
            cartService.getCart(),
            promotionService.getMyVouchers(),
            fetchProvinces()
        ])
        
        cart.value = cartRes.data
        myVouchers.value = vouchersRes.data

        if (!cart.value.items || cart.value.items.length === 0) {
            router.push({ name: 'cart' })
            return
        }

        // Tự động chọn voucher nếu được truyền từ CartPage
        const voucherIdFromCart = route.query.voucher_id ? Number(route.query.voucher_id) : null
        if (voucherIdFromCart) {
            const found = myVouchers.value.find(uv => uv.voucher_id === voucherIdFromCart)
            if (found) selectedVoucher.value = found
        }
    } catch (error) {
        console.error('Lỗi lấy dữ liệu:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(fetchData)

const subtotal = computed(() => {
    if (!cart.value || !cart.value.items) return 0
    return cart.value.items.reduce((sum: number, item: any) => sum + (item.unit_price * item.quantity), 0)
})

const discountAmount = computed(() => {
    if (!selectedVoucher.value) return 0
    const v = selectedVoucher.value.voucher
    
    if (subtotal.value < Number(v.min_order_value)) return 0

    if (v.discount_type === 'FIXED_AMOUNT') {
        return Number(v.discount_value)
    } else if (v.discount_type === 'PERCENT') {
        let amount = subtotal.value * (Number(v.discount_value) / 100)
        if (v.max_discount) amount = Math.min(amount, Number(v.max_discount))
        return amount
    } else if (v.discount_type === 'FREE_SHIP') {
        return shippingFee
    }
    return 0
})

const shippingFee = 30000 // Fix cứng phí ship
const total = computed(() => Math.max(0, subtotal.value + shippingFee - discountAmount.value))

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const handleCheckout = async () => {
    isSubmitting.value = true
    try {
        const orderData: OrderCreateData = {
            payment_method: form.value.payment_method,
            address_snapshot: {
                recipient_name: form.value.recipient_name,
                phone: form.value.phone,
                province: form.value.province,
                district: form.value.district,
                ward: form.value.ward,
                street_address: form.value.street_address
            },
            shipping_fee: shippingFee,
            voucher_id: selectedVoucher.value?.voucher_id,
            note: form.value.note
        }
        
        const response = await orderService.createOrder(orderData)
        alert('Đặt hàng thành công!')
        router.push({ name: 'profile' })
    } catch (error: any) {
        alert(error.response?.data?.detail || 'Có lỗi xảy ra khi đặt hàng.')
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="bg-white min-h-screen pb-24">
        <div class="max-w-[1400px] mx-auto px-6 pt-16">
            <header class="mb-16">
                <h1 class="text-4xl serif-text text-zinc-900 mb-2 italic">Checkout</h1>
                <p class="text-[10px] uppercase tracking-[0.4em] text-zinc-400">Hoàn tất đơn hàng của bạn</p>
            </header>

            <div v-if="isLoading" class="flex justify-center py-20">
                <div class="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full"></div>
            </div>

            <form v-else @submit.prevent="handleCheckout" class="flex flex-col lg:flex-row gap-20">
                <!-- Shipping Info -->
                <div class="flex-grow space-y-12">
                    <section>
                        <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">Thông tin giao hàng</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400">Họ và tên</label>
                                <input v-model="form.recipient_name" type="text" required class="w-full border-b border-zinc-200 py-3 focus:border-zinc-900 outline-none text-sm font-light transition-colors" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400">Số điện thoại</label>
                                <input v-model="form.phone" type="tel" required class="w-full border-b border-zinc-200 py-3 focus:border-zinc-900 outline-none text-sm font-light transition-colors" />
                            </div>
                            
                            <!-- Address Selectors -->
                            <div class="space-y-2">
                                <label class="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400">Tỉnh / Thành phố</label>
                                <select v-model="selectedProvinceCode" required class="w-full border-b border-zinc-200 py-3 focus:border-zinc-900 outline-none text-sm font-light bg-transparent transition-colors">
                                    <option value="" disabled>Chọn Tỉnh / Thành phố</option>
                                    <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400">Quận / Huyện</label>
                                <select v-model="selectedDistrictCode" :disabled="selectedProvinceCode === ''" required class="w-full border-b border-zinc-200 py-3 focus:border-zinc-900 outline-none text-sm font-light bg-transparent transition-colors disabled:opacity-50">
                                    <option value="" disabled>Chọn Quận / Huyện</option>
                                    <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400">Phường / Xã</label>
                                <select v-model="form.ward" :disabled="selectedDistrictCode === ''" required class="w-full border-b border-zinc-200 py-3 focus:border-zinc-900 outline-none text-sm font-light bg-transparent transition-colors disabled:opacity-50">
                                    <option value="" disabled>Chọn Phường / Xã</option>
                                    <option v-for="w in wards" :key="w.code" :value="w.name">{{ w.name }}</option>
                                </select>
                            </div>

                            <div class="space-y-2">
                                <label class="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400">Địa chỉ cụ thể</label>
                                <input v-model="form.street_address" type="text" required class="w-full border-b border-zinc-200 py-3 focus:border-zinc-900 outline-none text-sm font-light transition-colors" placeholder="Số nhà, tên đường..." />
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-8 border-b border-zinc-100 pb-4">Phương thức thanh toán</h2>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <label :class="['p-6 border cursor-pointer transition-all flex items-center gap-4', form.payment_method === 'COD' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-300']">
                                <input type="radio" v-model="form.payment_method" value="COD" class="hidden" />
                                <span class="material-symbols-outlined text-zinc-400">payments</span>
                                <span class="text-[10px] uppercase tracking-[0.2em] font-bold">Thanh toán khi nhận hàng (COD)</span>
                            </label>
                            <label :class="['p-6 border cursor-pointer transition-all flex items-center gap-4', form.payment_method === 'QR_CODE' ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-300']">
                                <input type="radio" v-model="form.payment_method" value="QR_CODE" class="hidden" />
                                <span class="material-symbols-outlined text-zinc-400">qr_code</span>
                                <span class="text-[10px] uppercase tracking-[0.2em] font-bold">Chuyển khoản QR</span>
                            </label>
                        </div>
                    </section>

                    <section>
                        <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-6">Ưu đãi của bạn</h2>
                        <div v-if="myVouchers.length === 0" class="text-xs text-zinc-400 italic">Bạn chưa có voucher nào.</div>
                        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div 
                                v-for="uv in myVouchers" 
                                :key="uv.id"
                                @click="subtotal >= Number(uv.voucher.min_order_value) && (selectedVoucher = selectedVoucher?.id === uv.id ? null : uv)"
                                :class="['p-4 border transition-all relative group', 
                                    selectedVoucher?.id === uv.id ? 'border-zinc-900 bg-zinc-50' : 'border-zinc-100 hover:border-zinc-200',
                                    subtotal < Number(uv.voucher.min_order_value) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                ]"
                            >
                                <div class="flex justify-between items-start mb-2">
                                    <span class="text-[10px] font-bold tracking-widest bg-zinc-900 text-white px-2 py-0.5">{{ uv.voucher.code }}</span>
                                    <span v-if="selectedVoucher?.id === uv.id" class="material-symbols-outlined text-zinc-900 text-sm">check_circle</span>
                                </div>
                                <h4 class="text-[11px] font-medium text-zinc-900">{{ uv.voucher.name }}</h4>
                                <p class="text-[9px] text-zinc-400 mt-1">Đơn tối thiểu: {{ formatPrice(Number(uv.voucher.min_order_value)) }}</p>
                                <div v-if="subtotal < Number(uv.voucher.min_order_value)" class="absolute inset-0 bg-white/40 flex items-center justify-center">
                                    <span class="text-[8px] uppercase tracking-tighter font-bold text-red-500 bg-white px-2 py-1 shadow-sm">Chưa đủ điều kiện</span>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section>
                        <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-6">Ghi chú</h2>
                        <textarea v-model="form.note" rows="3" class="w-full border border-zinc-100 p-4 outline-none focus:border-zinc-900 text-sm font-light transition-colors placeholder:text-zinc-300" placeholder="Yêu cầu đặc biệt về đơn hàng..."></textarea>
                    </section>
                </div>

                <!-- Order Summary -->
                <div class="w-full lg:w-[400px] shrink-0">
                    <div class="bg-zinc-50 p-10 sticky top-32">
                        <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-10 pb-4 border-b border-zinc-200">Đơn hàng của bạn</h2>
                        
                        <div class="max-h-[300px] overflow-y-auto pr-4 mb-10 space-y-6">
                            <div v-for="item in cart.items" :key="item.cart_item_id" class="flex gap-4">
                                <div class="w-16 aspect-[3/4] bg-white overflow-hidden shrink-0">
                                    <img v-if="item.image_url" :src="getImageUrl(item.image_url)" class="w-full h-full object-cover" />
                                    <div v-else class="w-full h-full flex items-center justify-center bg-zinc-50">
                                        <span class="material-symbols-outlined text-xl text-zinc-300">image_not_supported</span>
                                    </div>
                                </div>
                                <div class="flex-grow">
                                    <h4 class="text-[11px] font-medium text-zinc-900 mb-1 leading-tight">{{ item.product_name }}</h4>
                                    <p class="text-[9px] text-zinc-400 uppercase tracking-widest">{{ item.variant_info }}</p>
                                    <div class="flex justify-between items-end mt-2">
                                        <p class="text-[10px] text-zinc-400">Số lượng: {{ item.quantity }}</p>
                                        <p class="text-[11px] font-bold">{{ formatPrice(item.unit_price * item.quantity) }}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="space-y-4 mb-10 text-xs border-t border-zinc-200 pt-8">
                            <div class="flex justify-between">
                                <span class="text-zinc-500 font-light italic">Tạm tính</span>
                                <span class="text-zinc-900">{{ formatPrice(subtotal) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-zinc-500 font-light italic">Phí vận chuyển</span>
                                <span class="text-zinc-900">{{ formatPrice(shippingFee) }}</span>
                            </div>
                            <div v-if="discountAmount > 0" class="flex justify-between text-green-600">
                                <span class="font-light italic">Giảm giá ({{ selectedVoucher?.voucher.code }})</span>
                                <span>- {{ formatPrice(discountAmount) }}</span>
                            </div>
                            <div class="flex justify-between items-end pt-4 border-t border-zinc-200">
                                <span class="text-[10px] uppercase tracking-[0.3em] font-bold">Tổng cộng</span>
                                <span class="text-2xl serif-text font-bold italic">{{ formatPrice(total) }}</span>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            :disabled="isSubmitting"
                            class="w-full bg-zinc-900 text-white py-6 text-[11px] font-bold tracking-[0.4em] uppercase hover:bg-zinc-800 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                        >
                            <span v-if="isSubmitting" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            {{ isSubmitting ? 'Đang xử lý...' : 'Xác nhận đặt hàng' }}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    </div>
</template>

<style scoped>
.serif-text {
    font-family: 'Playfair Display', serif;
}
</style>
