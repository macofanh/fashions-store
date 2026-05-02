<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/useCartStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { promotionService, type UserVoucher } from '@/pages/promotions/promotionService'
import { getImageUrl } from '@/lib/urlHelper'

const cartStore = useCartStore()
const authStore = useAuthStore()
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
    } catch { /* không bắt buộc đăng nhập */ } finally {
        isLoadingVouchers.value = false
    }
}

const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (newQty < 1) return
    updatingItemId.value = itemId
    if (authStore.isAuthenticated) {
        await cartStore.updateQty(itemId, newQty)
    } else {
        // Guest: itemId là variant_id (cart_item_id = Date.now() khi add)
        const item = cartStore.items.find(i => i.cart_item_id === itemId)
        if (item) cartStore.updateGuestQty(item.variant_id, newQty)
    }
    updatingItemId.value = null
}

const handleRemove = async (itemId: number) => {
    removingItemId.value = itemId
    if (authStore.isAuthenticated) {
        await cartStore.removeItem(itemId)
    } else {
        const item = cartStore.items.find(i => i.cart_item_id === itemId)
        if (item) cartStore.removeGuestItem(item.variant_id)
    }
    removingItemId.value = null
    if (selectedVoucher.value && subtotal.value < Number(selectedVoucher.value.voucher.min_order_value)) {
        selectedVoucher.value = null
    }
}

const applyVoucherByCode = () => {
    voucherError.value = ''
    const code = voucherCode.value.trim().toUpperCase()
    if (!code) return
    const found = myVouchers.value.find(uv => uv.voucher.code.toUpperCase() === code)
    if (!found) { voucherError.value = 'Mã voucher không tồn tại hoặc bạn chưa lưu voucher này.'; return }
    if (!found.voucher.is_active) { voucherError.value = 'Voucher này đã hết hạn hoặc không còn hiệu lực.'; return }
    if (subtotal.value < Number(found.voucher.min_order_value)) {
        voucherError.value = `Đơn hàng tối thiểu ${formatPrice(Number(found.voucher.min_order_value))} để dùng voucher này.`
        return
    }
    selectedVoucher.value = found
    voucherCode.value = ''
}

const selectVoucher = (uv: UserVoucher) => {
    selectedVoucher.value = selectedVoucher.value?.id === uv.id ? null : uv
    voucherError.value = ''
}

const removeVoucher = () => {
    selectedVoucher.value = null
    voucherCode.value = ''
    voucherError.value = ''
}

const goToCheckout = () => {
    if (!authStore.isAuthenticated) {
        router.push({ name: 'login', query: { redirect: '/checkout' } })
        return
    }
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
    if (authStore.isAuthenticated) {
        await cartStore.fetchCart()
        fetchVouchers()
    } else {
        cartStore.loadGuestCart()
    }
})
</script>

<template>
    <div class="bg-background-light min-h-screen py-10 px-4 md:px-6">
        <div class="max-w-[1300px] mx-auto">

            <!-- ── Page Header ── -->
            <div class="flex items-center justify-between mb-8">
                <div>
                    <h1 class="text-3xl font-serif italic text-fashion-black">Giỏ hàng</h1>
                    <p class="text-sm text-text-muted mt-1">
                        {{ cartStore.totalQuantity > 0 ? `${cartStore.totalQuantity} sản phẩm` : 'Chưa có sản phẩm' }}
                    </p>
                </div>
                <router-link
                    to="/products"
                    class="flex items-center gap-1.5 text-sm text-text-muted hover:text-primary transition-colors"
                >
                    <span class="material-symbols-outlined text-[18px]">arrow_back</span>
                    Tiếp tục mua sắm
                </router-link>
            </div>

            <!-- ── Loading ── -->
            <div v-if="cartStore.isLoading" class="flex justify-center py-32">
                <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>

            <!-- ── Có sản phẩm ── -->
            <div v-else-if="cartStore.items.length > 0" class="flex flex-col lg:flex-row gap-6 items-start">

                <!-- LEFT: Danh sách + Voucher -->
                <div class="flex-grow space-y-4 min-w-0">

                    <!-- ── Danh sách sản phẩm ── -->
                    <div class="bg-white border border-border-light rounded-xl shadow-sm overflow-hidden">
                        <!-- Table header (desktop) -->
                        <div class="hidden md:grid grid-cols-[2fr_1fr_1fr_auto] gap-4 px-6 py-3 bg-background-light border-b border-border-light">
                            <span class="col-label">Sản phẩm</span>
                            <span class="col-label text-center">Đơn giá</span>
                            <span class="col-label text-center">Số lượng</span>
                            <span class="col-label text-right">Thành tiền</span>
                        </div>

                        <!-- Items -->
                        <TransitionGroup name="cart-item" tag="div">
                            <div
                                v-for="item in cartStore.items"
                                :key="item.cart_item_id"
                                :class="[
                                    'px-6 py-5 border-b border-border-light last:border-0 transition-all',
                                    removingItemId === item.cart_item_id ? 'opacity-40 pointer-events-none' : ''
                                ]"
                            >
                                <div class="flex flex-col md:grid md:grid-cols-[2fr_1fr_1fr_auto] gap-4 items-start md:items-center">

                                    <!-- Sản phẩm -->
                                    <div class="flex gap-4 items-center">
                                        <div class="w-16 h-20 bg-fashion-gray rounded-lg overflow-hidden shrink-0 border border-border-light">
                                            <img
                                                v-if="item.image_url"
                                                :src="getImageUrl(item.image_url)"
                                                :alt="item.product_name"
                                                class="w-full h-full object-cover"
                                            />
                                            <div v-else class="w-full h-full flex items-center justify-center">
                                                <span class="material-symbols-outlined text-xl text-text-muted">image_not_supported</span>
                                            </div>
                                        </div>
                                        <div class="min-w-0">
                                            <h3 class="text-sm font-semibold text-fashion-black leading-snug mb-1 line-clamp-2">{{ item.product_name }}</h3>
                                            <p class="text-xs text-text-muted">{{ item.variant_info }}</p>
                                            <p class="md:hidden text-sm font-bold text-primary mt-1.5">{{ formatPrice(item.unit_price) }}</p>
                                        </div>
                                    </div>

                                    <!-- Đơn giá (desktop) -->
                                    <p class="hidden md:block text-sm font-medium text-fashion-black text-center">
                                        {{ formatPrice(item.unit_price) }}
                                    </p>

                                    <!-- Số lượng -->
                                    <div class="flex items-center border border-border-light rounded-lg w-fit md:mx-auto overflow-hidden">
                                        <button
                                            @click="handleUpdateQty(item.cart_item_id, item.quantity - 1)"
                                            :disabled="item.quantity <= 1 || updatingItemId === item.cart_item_id"
                                            class="w-9 h-9 flex items-center justify-center hover:bg-primary-light text-fashion-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                        >
                                            <span class="material-symbols-outlined text-[16px]">remove</span>
                                        </button>
                                        <div class="w-10 h-9 flex items-center justify-center text-sm font-bold border-x border-border-light">
                                            <span v-if="updatingItemId === item.cart_item_id" class="animate-spin h-3 w-3 border-2 border-primary border-t-transparent rounded-full"></span>
                                            <span v-else>{{ item.quantity }}</span>
                                        </div>
                                        <button
                                            @click="handleUpdateQty(item.cart_item_id, item.quantity + 1)"
                                            :disabled="updatingItemId === item.cart_item_id"
                                            class="w-9 h-9 flex items-center justify-center hover:bg-primary-light text-fashion-black disabled:opacity-30 transition-colors"
                                        >
                                            <span class="material-symbols-outlined text-[16px]">add</span>
                                        </button>
                                    </div>

                                    <!-- Thành tiền + Xóa -->
                                    <div class="flex items-center justify-between md:justify-end gap-4 w-full md:w-auto">
                                        <p class="text-sm font-bold text-fashion-black">
                                            {{ formatPrice(item.unit_price * item.quantity) }}
                                        </p>
                                        <button
                                            @click="handleRemove(item.cart_item_id)"
                                            :disabled="removingItemId === item.cart_item_id"
                                            class="text-border-light hover:text-red-400 transition-colors disabled:opacity-50"
                                            title="Xóa sản phẩm"
                                        >
                                            <span class="material-symbols-outlined text-[20px]">delete_outline</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </TransitionGroup>
                    </div>

                    <!-- ── Voucher ── -->
                    <div class="bg-white border border-border-light rounded-xl shadow-sm p-6">
                        <h2 class="text-sm font-bold text-fashion-black mb-4 flex items-center gap-2">
                            <span class="w-7 h-7 bg-primary-light rounded-lg flex items-center justify-center">
                                <span class="material-symbols-outlined text-primary text-[16px]">local_offer</span>
                            </span>
                            Mã giảm giá
                        </h2>

                        <!-- Input mã -->
                        <div class="flex gap-2 mb-4">
                            <input
                                v-model="voucherCode"
                                @keyup.enter="applyVoucherByCode"
                                type="text"
                                placeholder="Nhập mã voucher..."
                                :class="[
                                    'flex-grow border px-4 py-2.5 text-sm outline-none transition-colors uppercase tracking-widest rounded-lg',
                                    voucherError ? 'border-red-300 focus:border-red-400' : 'border-border-light focus:border-primary'
                                ]"
                            />
                            <button
                                @click="applyVoucherByCode"
                                class="bg-primary text-white px-5 py-2.5 text-sm font-semibold hover:bg-primary-dark transition-colors shrink-0 rounded-lg"
                            >
                                Áp dụng
                            </button>
                        </div>

                        <!-- Lỗi -->
                        <p v-if="voucherError" class="text-red-500 text-xs mb-3 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[14px]">error</span>
                            {{ voucherError }}
                        </p>

                        <!-- Voucher đang áp dụng -->
                        <div v-if="selectedVoucher" class="mb-4 flex items-center justify-between bg-green-50 border border-green-200 px-4 py-3 rounded-lg">
                            <div class="flex items-center gap-3">
                                <span class="material-symbols-outlined text-green-500 text-[20px]" style="font-variation-settings:'FILL' 1">check_circle</span>
                                <div>
                                    <p class="text-xs font-bold text-green-800 uppercase tracking-widest">{{ selectedVoucher.voucher.code }}</p>
                                    <p class="text-[11px] text-green-600">{{ selectedVoucher.voucher.name }}</p>
                                </div>
                            </div>
                            <div class="flex items-center gap-3">
                                <span class="text-green-700 font-bold text-sm">{{ formatDiscount(selectedVoucher.voucher) }}</span>
                                <button @click="removeVoucher" class="text-green-400 hover:text-red-500 transition-colors">
                                    <span class="material-symbols-outlined text-[18px]">close</span>
                                </button>
                            </div>
                        </div>

                        <!-- Danh sách voucher -->
                        <div v-if="myVouchers.length > 0">
                            <p class="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-2">Voucher của bạn</p>
                            <div class="space-y-2 max-h-48 overflow-y-auto pr-1">
                                <div
                                    v-for="uv in myVouchers"
                                    :key="uv.id"
                                    @click="subtotal >= Number(uv.voucher.min_order_value) && selectVoucher(uv)"
                                    :class="[
                                        'flex items-center justify-between p-3.5 border rounded-lg transition-all',
                                        selectedVoucher?.id === uv.id
                                            ? 'border-primary bg-primary-light'
                                            : subtotal < Number(uv.voucher.min_order_value)
                                                ? 'border-border-light opacity-50 cursor-not-allowed'
                                                : 'border-border-light hover:border-primary cursor-pointer'
                                    ]"
                                >
                                    <div class="flex items-center gap-3">
                                        <!-- Radio visual -->
                                        <div :class="[
                                            'w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors',
                                            selectedVoucher?.id === uv.id ? 'border-primary' : 'border-border-light'
                                        ]">
                                            <div v-if="selectedVoucher?.id === uv.id" class="w-2 h-2 rounded-full bg-primary"></div>
                                        </div>
                                        <div>
                                            <p class="text-xs font-bold text-fashion-black uppercase tracking-wider">{{ uv.voucher.code }}</p>
                                            <p class="text-[11px] text-text-muted">{{ uv.voucher.name }}</p>
                                            <p class="text-[10px] text-text-muted/70 mt-0.5">
                                                Đơn tối thiểu {{ formatPrice(Number(uv.voucher.min_order_value)) }}
                                            </p>
                                        </div>
                                    </div>
                                    <div class="text-right shrink-0 ml-4">
                                        <span :class="['text-sm font-bold', selectedVoucher?.id === uv.id ? 'text-primary' : 'text-fashion-black']">
                                            {{ formatDiscount(uv.voucher) }}
                                        </span>
                                        <p v-if="subtotal < Number(uv.voucher.min_order_value)" class="text-[9px] text-red-400 font-bold mt-0.5">Chưa đủ điều kiện</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else-if="!isLoadingVouchers && authStore.isAuthenticated" class="text-sm text-text-muted italic">
                            Bạn chưa có voucher nào.
                            <router-link to="/vouchers" class="text-primary underline underline-offset-4 hover:text-primary-dark ml-1">Khám phá ưu đãi</router-link>
                        </div>

                        <div v-else-if="!authStore.isAuthenticated" class="text-sm text-text-muted italic">
                            <router-link :to="{ name: 'login' }" class="text-primary underline underline-offset-4 hover:text-primary-dark">Đăng nhập</router-link>
                            để sử dụng voucher khi thanh toán.
                        </div>
                    </div>
                </div>

                <!-- RIGHT: Tóm tắt đơn hàng -->
                <aside class="w-full lg:w-[360px] shrink-0">
                    <div class="bg-white border border-border-light rounded-xl shadow-sm overflow-hidden sticky top-24">

                        <!-- Header summary -->
                        <div class="bg-fashion-black px-6 py-4">
                            <h2 class="text-sm font-bold text-white uppercase tracking-widest">Tóm tắt đơn hàng</h2>
                        </div>

                        <div class="p-6 space-y-4">
                            <!-- Line items -->
                            <div class="space-y-3">
                                <div class="flex justify-between text-sm">
                                    <span class="text-text-muted">Tạm tính ({{ cartStore.totalQuantity }} sp)</span>
                                    <span class="font-medium text-fashion-black">{{ formatPrice(subtotal) }}</span>
                                </div>
                                <div class="flex justify-between text-sm">
                                    <span class="text-text-muted">Phí vận chuyển</span>
                                    <span :class="[
                                        'font-medium',
                                        discountAmount > 0 && selectedVoucher?.voucher.discount_type === 'FREE_SHIP'
                                            ? 'line-through text-text-muted'
                                            : 'text-fashion-black'
                                    ]">{{ formatPrice(SHIPPING_FEE) }}</span>
                                </div>
                                <div v-if="selectedVoucher" class="flex justify-between text-sm">
                                    <span class="flex items-center gap-1 text-primary">
                                        <span class="material-symbols-outlined text-[14px]">local_offer</span>
                                        {{ selectedVoucher.voucher.code }}
                                    </span>
                                    <span class="font-bold text-primary">- {{ formatPrice(discountAmount) }}</span>
                                </div>
                            </div>

                            <!-- Divider -->
                            <div class="border-t border-border-light pt-4">
                                <div class="flex justify-between items-center">
                                    <span class="text-sm font-bold text-fashion-black uppercase tracking-wider">Tổng cộng</span>
                                    <span class="text-2xl font-bold text-primary">{{ formatPrice(total) }}</span>
                                </div>
                            </div>

                            <!-- CTA -->
                            <button
                                @click="goToCheckout"
                                class="w-full bg-primary text-white py-4 text-sm font-bold uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 active:scale-[0.98] rounded-lg"
                            >
                                <span class="material-symbols-outlined text-[18px]">lock</span>
                                Tiến hành thanh toán
                            </button>

                            <!-- Trust badges -->
                            <div class="flex items-center justify-center gap-4 pt-2">
                                <div class="flex items-center gap-1 text-text-muted">
                                    <span class="material-symbols-outlined text-[14px]">verified_user</span>
                                    <span class="text-[10px]">Bảo mật SSL</span>
                                </div>
                                <div class="flex items-center gap-1 text-text-muted">
                                    <span class="material-symbols-outlined text-[14px]">local_shipping</span>
                                    <span class="text-[10px]">Giao hàng nhanh</span>
                                </div>
                                <div class="flex items-center gap-1 text-text-muted">
                                    <span class="material-symbols-outlined text-[14px]">replay</span>
                                    <span class="text-[10px]">Đổi trả 30 ngày</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </aside>
            </div>

            <!-- ── Giỏ trống ── -->
            <div v-else class="text-center py-32 bg-white border border-border-light rounded-xl">
                <div class="w-20 h-20 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-6">
                    <span class="material-symbols-outlined text-4xl text-primary">shopping_bag</span>
                </div>
                <h2 class="text-xl font-serif italic text-fashion-black mb-2">Giỏ hàng trống</h2>
                <p class="text-text-muted text-sm mb-8">Hãy thêm sản phẩm yêu thích vào giỏ hàng của bạn</p>
                <router-link
                    to="/products"
                    class="inline-flex items-center gap-2 bg-primary text-white px-8 py-3 text-sm font-semibold hover:bg-primary-dark transition-all rounded-lg"
                >
                    <span class="material-symbols-outlined text-[18px]">explore</span>
                    Khám phá sản phẩm
                </router-link>
            </div>

        </div>
    </div>
</template>

<style scoped>
@reference "../../assets/main.css";

.col-label {
    @apply text-[10px] uppercase tracking-widest font-bold text-text-muted;
}

.cart-item-enter-active { transition: all 0.3s ease; }
.cart-item-leave-active { transition: all 0.25s ease; }
.cart-item-enter-from   { opacity: 0; transform: translateX(-10px); }
.cart-item-leave-to     { opacity: 0; transform: translateX(10px); height: 0; padding: 0; overflow: hidden; }
</style>
