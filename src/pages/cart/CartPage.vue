<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/useCartStore'
import { promotionService, type UserVoucher } from '@/api/promotionService'
import { getImageUrl } from '@/api/urlHelper'

const cartStore = useCartStore()
const router = useRouter()

// ── Voucher ───────────────────────────────────────────────────────
const myVouchers = ref<UserVoucher[]>([])
const selectedVoucher = ref<UserVoucher | null>(null)
const voucherCode = ref('')
const voucherError = ref('')
const isLoadingVouchers = ref(false)

// ── Updating state ────────────────────────────────────────────────
const updatingItemId = ref<number | null>(null)
const removingItemId = ref<number | null>(null)

// ── Computed ──────────────────────────────────────────────────────
const subtotal = computed(() =>
    cartStore.items.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
)

const SHIPPING_FEE = 30000

const discountAmount = computed(() => {
    if (!selectedVoucher.value) return 0
    const v = selectedVoucher.value.voucher
    if (subtotal.value < Number(v.min_order_value)) return 0
    if (v.discount_type === 'FIXED_AMOUNT') return Math.min(Number(v.discount_value), subtotal.value)
    if (v.discount_type === 'PERCENT') {
        const amt = subtotal.value * (Number(v.discount_value) / 100)
        return v.max_discount ? Math.min(amt, Number(v.max_discount)) : amt
    }
    if (v.discount_type === 'FREE_SHIP') return SHIPPING_FEE
    return 0
})

const total = computed(() => Math.max(0, subtotal.value + SHIPPING_FEE - discountAmount.value))

// ── Methods ───────────────────────────────────────────────────────
const fetchVouchers = async () => {
    isLoadingVouchers.value = true
    try {
        const res = await promotionService.getMyVouchers()
        myVouchers.value = res.data
    } catch {
        // không bắt buộc đăng nhập để xem giỏ hàng
    } finally {
        isLoadingVouchers.value = false
    }
}

const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (newQty < 1) return
    updatingItemId.value = itemId
    await cartStore.updateQty(itemId, newQty)
    updatingItemId.value = null
}

const handleRemove = async (itemId: number) => {
    removingItemId.value = itemId
    await cartStore.removeItem(itemId)
    removingItemId.value = null
    // Nếu voucher đang chọn mà subtotal giảm xuống dưới min_order_value → bỏ chọn
    if (selectedVoucher.value && subtotal.value < Number(selectedVoucher.value.voucher.min_order_value)) {
        selectedVoucher.value = null
    }
}

const applyVoucherByCode = () => {
    voucherError.value = ''
    const code = voucherCode.value.trim().toUpperCase()
    if (!code) return

    const found = myVouchers.value.find(uv => uv.voucher.code.toUpperCase() === code)
    if (!found) {
        voucherError.value = 'Mã voucher không tồn tại hoặc bạn chưa lưu voucher này.'
        return
    }
    if (!found.voucher.is_active) {
        voucherError.value = 'Voucher này đã hết hạn hoặc không còn hiệu lực.'
        return
    }
    if (subtotal.value < Number(found.voucher.min_order_value)) {
        voucherError.value = `Đơn hàng tối thiểu ${formatPrice(Number(found.voucher.min_order_value))} để dùng voucher này.`
        return
    }
    selectedVoucher.value = found
    voucherCode.value = ''
}

const selectVoucher = (uv: UserVoucher) => {
    if (selectedVoucher.value?.id === uv.id) {
        selectedVoucher.value = null
    } else {
        selectedVoucher.value = uv
        voucherError.value = ''
    }
}

const removeVoucher = () => {
    selectedVoucher.value = null
    voucherCode.value = ''
    voucherError.value = ''
}

const goToCheckout = () => {
    router.push({
        name: 'checkout',
        query: selectedVoucher.value ? { voucher_id: selectedVoucher.value.voucher_id } : {}
    })
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const formatDiscount = (v: UserVoucher['voucher']) => {
    if (v.discount_type === 'PERCENT') return `-${v.discount_value}%`
    if (v.discount_type === 'FIXED_AMOUNT') return `-${formatPrice(Number(v.discount_value))}`
    if (v.discount_type === 'FREE_SHIP') return 'Miễn phí ship'
    return ''
}

onMounted(async () => {
    await cartStore.fetchCart()
    fetchVouchers()
})
</script>

<template>
    <div class="bg-zinc-50 min-h-screen py-12 px-4 md:px-6">
        <div class="max-w-[1300px] mx-auto">

            <!-- Header -->
            <div class="flex items-end justify-between mb-12">
                <div>
                    <h1 class="text-4xl serif-text italic text-zinc-900">Giỏ hàng</h1>
                    <p class="text-[10px] uppercase tracking-[0.3em] text-zinc-400 mt-2">
                        {{ cartStore.totalQuantity }} sản phẩm
                    </p>
                </div>
                <router-link
                    to="/products"
                    class="text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1"
                >
                    <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                    Tiếp tục mua sắm
                </router-link>
            </div>

            <!-- Loading -->
            <div v-if="cartStore.isLoading" class="flex justify-center py-32">
                <div class="animate-spin h-10 w-10 border-4 border-zinc-900 border-t-transparent rounded-full"></div>
            </div>

            <!-- Có sản phẩm -->
            <div v-else-if="cartStore.items.length > 0" class="flex flex-col lg:flex-row gap-8 items-start">

                <!-- ── CỘT TRÁI: DANH SÁCH + VOUCHER ─────────────── -->
                <div class="flex-grow space-y-6 min-w-0">

                    <!-- Danh sách sản phẩm -->
                    <div class="bg-white border border-zinc-100 shadow-sm">
                        <!-- Header table -->
                        <div class="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-8 py-4 border-b border-zinc-50">
                            <span class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Sản phẩm</span>
                            <span class="text-[9px] uppercase tracking-widest font-bold text-zinc-400 text-center">Đơn giá</span>
                            <span class="text-[9px] uppercase tracking-widest font-bold text-zinc-400 text-center">Số lượng</span>
                            <span class="text-[9px] uppercase tracking-widest font-bold text-zinc-400 text-right">Thành tiền</span>
                        </div>

                        <!-- Items -->
                        <TransitionGroup name="cart-item" tag="div">
                            <div
                                v-for="item in cartStore.items"
                                :key="item.cart_item_id"
                                :class="['px-6 md:px-8 py-6 border-b border-zinc-50 last:border-0 transition-opacity', removingItemId === item.cart_item_id ? 'opacity-40 pointer-events-none' : '']"
                            >
                                <div class="flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-start md:items-center">

                                    <!-- Sản phẩm -->
                                    <div class="flex gap-4 items-center">
                                        <div class="w-16 h-20 bg-zinc-100 overflow-hidden shrink-0">
                                            <img
                                                v-if="item.image_url"
                                                :src="getImageUrl(item.image_url)"
                                                :alt="item.product_name"
                                                class="w-full h-full object-cover"
                                            />
                                            <div v-else class="w-full h-full flex items-center justify-center">
                                                <span class="material-symbols-outlined text-xl text-zinc-300">image_not_supported</span>
                                            </div>
                                        </div>
                                        <div>
                                            <h3 class="text-xs font-bold text-zinc-900 leading-snug mb-1">{{ item.product_name }}</h3>
                                            <p class="text-[10px] uppercase tracking-wider text-zinc-400">{{ item.variant_info }}</p>
                                            <!-- Giá trên mobile -->
                                            <p class="md:hidden text-xs font-bold text-zinc-900 mt-2">{{ formatPrice(item.unit_price) }}</p>
                                        </div>
                                    </div>

                                    <!-- Đơn giá (desktop) -->
                                    <p class="hidden md:block text-xs font-medium text-zinc-700 text-center">
                                        {{ formatPrice(item.unit_price) }}
                                    </p>

                                    <!-- Số lượng -->
                                    <div class="flex items-center gap-0 border border-zinc-200 w-fit md:mx-auto">
                                        <button
                                            @click="handleUpdateQty(item.cart_item_id, item.quantity - 1)"
                                            :disabled="item.quantity <= 1 || updatingItemId === item.cart_item_id"
                                            class="w-9 h-9 flex items-center justify-center hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <span class="material-symbols-outlined text-[16px]">remove</span>
                                        </button>
                                        <div class="w-10 h-9 flex items-center justify-center text-xs font-bold relative">
                                            <span v-if="updatingItemId === item.cart_item_id" class="animate-spin h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full"></span>
                                            <span v-else>{{ item.quantity }}</span>
                                        </div>
                                        <button
                                            @click="handleUpdateQty(item.cart_item_id, item.quantity + 1)"
                                            :disabled="updatingItemId === item.cart_item_id"
                                            class="w-9 h-9 flex items-center justify-center hover:bg-zinc-100 disabled:opacity-30 transition-colors"
                                        >
                                            <span class="material-symbols-outlined text-[16px]">add</span>
                                        </button>
                                    </div>

                                    <!-- Thành tiền + Xóa -->
                                    <div class="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                                        <p class="text-xs font-bold text-zinc-900">
                                            {{ formatPrice(item.unit_price * item.quantity) }}
                                        </p>
                                        <button
                                            @click="handleRemove(item.cart_item_id)"
                                            :disabled="removingItemId === item.cart_item_id"
                                            class="text-zinc-300 hover:text-red-500 transition-colors disabled:opacity-50"
                                            title="Xóa sản phẩm"
                                        >
                                            <span class="material-symbols-outlined text-[20px]">delete_outline</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>

                    <!-- Voucher -->
                    <div class="bg-white border border-zinc-100 shadow-sm p-6 md:p-8">
                        <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-6 flex items-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">local_offer</span>
                            Mã giảm giá
                        </h2>

                        <!-- Nhập mã thủ công -->
                        <div class="flex gap-2 mb-6">
                            <input
                                v-model="voucherCode"
                                @keyup.enter="applyVoucherByCode"
                                type="text"
                                placeholder="Nhập mã voucher..."
                                class="flex-grow border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 transition-colors uppercase tracking-widest"
                                :class="voucherError ? 'border-red-300' : ''"
                            />
                            <button
                                @click="applyVoucherByCode"
                                class="bg-zinc-900 text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-700 transition-colors shrink-0"
                            >
                                Áp dụng
                            </button>
                        </div>

                        <!-- Lỗi -->
                        <p v-if="voucherError" class="text-red-500 text-[11px] mb-4 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">error</span>
                            {{ voucherError }}
                        </p>

                        <!-- Voucher đang áp dụng -->
                        <div v-if="selectedVoucher" class="mb-6 flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-green-600 text-[18px]">check_circle</span>
                                <div>
                                    <p class="text-[11px] font-bold text-green-800 uppercase tracking-widest">{{ selectedVoucher.voucher.code }}</p>
                                    <p class="text-[10px] text-green-600">{{ selectedVoucher.voucher.name }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-green-700 font-bold text-sm">{{ formatDiscount(selectedVoucher.voucher) }}</span>
                                <button @click="removeVoucher" class="text-green-400 hover:text-red-500 transition-colors">
                                    <span class="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>

                        <!-- Danh sách voucher của tôi -->
                        <div v-if="myVouchers.length > 0">
                            <p class="text-[9px] uppercase tracking-widest font-bold text-zinc-400 mb-3">Voucher của bạn</p>
                            <div class="space-y-2 max-h-52 overflow-y-auto pr-1">
                                <div
                                    v-for="uv in myVouchers"
                                    :key="uv.id"
                                    @click="subtotal >= Number(uv.voucher.min_order_value) && selectVoucher(uv)"
                                    :class="[
                                        'flex items-center justify-between p-4 border transition-all relative',
                                        selectedVoucher?.id === uv.id
                                            ? 'border-zinc-900 bg-zinc-50'
                                            : subtotal < Number(uv.voucher.min_order_value)
                                                ? 'border-zinc-100 opacity-50 cursor-not-allowed'
                                                : 'border-zinc-100 hover:border-zinc-400 cursor-pointer'
                                    ]"
                                >
                                    <div class="flex items-center gap-3">
                                        <!-- Checkbox visual -->
                                        <div :class="['w-4 h-4 border-2 flex items-center justify-center shrink-0 transition-colors', selectedVoucher?.id === uv.id ? 'border-zinc-900 bg-zinc-900' : 'border-zinc-300']">
                                            <span v-if="selectedVoucher?.id === uv.id" class="material-symbols-outlined text-white text-[11px]" style="font-variation-settings:'FILL' 1">check</span>
                                        </div>
                                        <div>
                                            <p class="text-[10px] font-bold uppercase tracking-widest text-zinc-900">{{ uv.voucher.code }}</p>
                                            <p class="text-[10px] text-zinc-500">{{ uv.voucher.name }}</p>
                                            <p class="text-[9px] text-zinc-400 mt-0.5">
                                                Đơn tối thiểu {{ formatPrice(Number(uv.voucher.min_order_value)) }}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="text-right shrink-0 ml-4">
                                        <span :class="['text-sm font-bold', selectedVoucher?.id === uv.id ? 'text-zinc-900' : 'text-zinc-500']">
                                            {{ formatDiscount(uv.voucher) }}
                                        </span>
                                        <p v-if="subtotal < Number(uv.voucher.min_order_value)" class="text-[8px] text-red-400 uppercase font-bold mt-0.5">Chưa đủ điều kiện</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="!isLoadingVouchers" class="text-[11px] text-zinc-400 italic">
                            Bạn chưa có voucher nào.
                            <router-link to="/vouchers" class="text-zinc-900 underline underline-offset-4 hover:text-zinc-500 ml-1">Khám phá ưu đãi</router-link>
                        </div>
                    </div>
                </div>

                <!-- ── CỘT PHẢI: TÓM TẮT ĐƠN HÀNG ───────────────── -->
                <aside class="w-full lg:w-[380px] shrink-0">
                    <div class="bg-white border border-zinc-100 shadow-sm p-8 sticky top-24">
                        <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900 mb-8 pb-4 border-b border-zinc-100">
                            Tóm tắt đơn hàng
                        </h2>

                        <div class="space-y-4 mb-8">
                            <div class="flex justify-between text-xs">
                                <span class="text-zinc-500">Tạm tính ({{ cartStore.totalQuantity }} sản phẩm)</span>
                                <span class="font-medium text-zinc-900">{{ formatPrice(subtotal) }}</span>
                            </div>
                            <div class="flex justify-between text-xs">
                                <span class="text-zinc-500">Phí vận chuyển</span>
                                <span :class="['font-medium', discountAmount > 0 && selectedVoucher?.voucher.discount_type === 'FREE_SHIP' ? 'line-through text-zinc-300' : 'text-zinc-900']">
                                    {{ formatPrice(SHIPPING_FEE) }}
                                </span>
                            </div>
                            <div v-if="selectedVoucher" class="flex justify-between text-xs text-green-600">
                                <span class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-[14px]">local_offer</span>
                                    Giảm giá ({{ selectedVoucher.voucher.code }})
                                </span>
                                <span class="font-bold">- {{ formatPrice(discountAmount) }}</span>
                            </div>
                        </div>

                        <div class="flex justify-between items-end pt-6 border-t border-zinc-900 mb-8">
                            <span class="text-[11px] uppercase tracking-widest font-bold">Tổng cộng</span>
                            <span class="text-2xl serif-text italic font-bold text-zinc-900">{{ formatPrice(total) }}</span>
                        </div>

                        <button
                            @click="goToCheckout"
                            class="w-full bg-zinc-900 text-white py-5 text-[11px] font-bold uppercase tracking-[0.3em] hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 active:scale-[0.98]"
                        >
                            Tiến hành thanh toán
                            <span class="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>

                        <p class="text-center text-[9px] text-zinc-400 uppercase tracking-widest mt-4">
                            Bảo mật thanh toán 100%
                        </p>
                    </div>
                </aside>
            </div>

            <!-- Giỏ trống -->
            <div v-else class="text-center py-32 bg-white border border-zinc-100">
                <span class="material-symbols-outlined text-6xl text-zinc-100 mb-6 block">shopping_bag</span>
                <p class="text-zinc-400 uppercase tracking-[0.2em] text-xs mb-10 font-bold">Giỏ hàng của bạn đang trống</p>
                <router-link
                    to="/products"
                    class="inline-block border border-zinc-900 px-12 py-4 text-[11px] font-bold uppercase tracking-widest hover:bg-zinc-900 hover:text-white transition-all"
                >
                    Khám phá sản phẩm
                </router-link>
            </div>

        </div>
    </div>
</template>

<style scoped>
.serif-text { font-family: 'Playfair Display', serif; }

.cart-item-enter-active { transition: all 0.3s ease; }
.cart-item-leave-active { transition: all 0.25s ease; }
.cart-item-enter-from   { opacity: 0; transform: translateX(-10px); }
.cart-item-leave-to     { opacity: 0; transform: translateX(10px); height: 0; padding: 0; overflow: hidden; }
</style>
