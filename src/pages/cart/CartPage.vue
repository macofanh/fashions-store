<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useCartStore } from '@/stores/useCartStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { getImageUrl } from '@/lib/urlHelper'

const cartStore = useCartStore()
const authStore = useAuthStore()
const uiStore   = useUIStore()
const router    = useRouter()

const updatingItemId = ref<number | null>(null)
const removingItemId = ref<number | null>(null)
const selectedItemIds = ref<number[]>([])

const selectedItems = computed(() =>
    cartStore.items.filter(item => selectedItemIds.value.includes(item.cart_item_id))
)

const selectedQuantity = computed(() =>
    selectedItems.value.reduce((sum, item) => sum + item.quantity, 0)
)

const selectedSubtotal = computed(() =>
    selectedItems.value.reduce((sum, item) => sum + item.unit_price * item.quantity, 0)
)

const isAllSelected = computed(() =>
    cartStore.items.length > 0 && selectedItemIds.value.length === cartStore.items.length
)

const syncSelectedItems = () => {
    const currentIds = new Set(cartStore.items.map(item => item.cart_item_id))
    selectedItemIds.value = selectedItemIds.value.filter(id => currentIds.has(id))
}

const toggleItemSelection = (itemId: number) => {
    selectedItemIds.value = selectedItemIds.value.includes(itemId)
        ? selectedItemIds.value.filter(id => id !== itemId)
        : [...selectedItemIds.value, itemId]
}

const toggleSelectAll = () => {
    selectedItemIds.value = isAllSelected.value
        ? []
        : cartStore.items.map(item => item.cart_item_id)
}

const handleUpdateQty = async (itemId: number, newQty: number) => {
    if (newQty < 1) return
    updatingItemId.value = itemId
    if (authStore.isAuthenticated) {
        await cartStore.updateQty(itemId, newQty)
    } else {
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
    syncSelectedItems()
    removingItemId.value = null
}

const goToCheckout = () => {
    if (selectedItemIds.value.length === 0) {
        uiStore.warning('Vui lòng chọn ít nhất một sản phẩm để thanh toán.')
        return
    }

    const cartItemIds = selectedItemIds.value.join(',')

    if (!authStore.isAuthenticated) {
        router.push({ name: 'login', query: { redirect: `/checkout?cart_item_ids=${cartItemIds}` } })
        return
    }
    router.push({ name: 'checkout', query: { cart_item_ids: cartItemIds } })
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

onMounted(async () => {
    if (authStore.isAuthenticated) {
        await cartStore.fetchCart()
    } else {
        cartStore.loadGuestCart()
    }
    selectedItemIds.value = cartStore.items.map(item => item.cart_item_id)
})
</script>

<template>
    <div class="bg-background-light min-h-screen py-10 px-4 md:px-6">
        <div class="max-w-[900px] mx-auto">

            <!-- Header -->
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

            <!-- Loading -->
            <div v-if="cartStore.isLoading" class="flex justify-center py-32">
                <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>

            <!-- Có sản phẩm -->
            <div v-else-if="cartStore.items.length > 0" class="space-y-4">

                <!-- Danh sách sản phẩm -->
                <div class="bg-white border border-border-light rounded-xl shadow-sm overflow-hidden">
                    <!-- Table header (desktop) -->
                    <div class="hidden md:grid grid-cols-[28px_minmax(0,2fr)_120px_128px_120px] gap-4 px-6 py-3 bg-background-light border-b border-border-light items-center">
                        <button
                            @click="toggleSelectAll"
                            :class="[
                                'w-5 h-5 flex items-center justify-center rounded border transition-colors',
                                isAllSelected
                                    ? 'bg-primary border-primary text-white'
                                    : 'bg-white border-border-light hover:border-primary'
                            ]"
                            title="Chọn tất cả"
                        >
                            <span v-if="isAllSelected" class="material-symbols-outlined text-[16px]">check</span>
                        </button>
                        <span class="col-label">Sản phẩm</span>
                        <span class="col-label text-center">Đơn giá</span>
                        <span class="col-label text-center">Số lượng</span>
                        <span class="col-label text-right">Thành tiền</span>
                    </div>

                    <TransitionGroup name="cart-item" tag="div">
                        <div
                            v-for="item in cartStore.items"
                            :key="item.cart_item_id"
                            :class="[
                                'px-6 py-5 border-b border-border-light last:border-0 transition-all',
                                removingItemId === item.cart_item_id ? 'opacity-40 pointer-events-none' : ''
                            ]"
                        >
                            <div class="flex flex-col md:grid md:grid-cols-[28px_minmax(0,2fr)_120px_128px_120px] gap-4 items-start md:items-center">
                                <button
                                    @click="toggleItemSelection(item.cart_item_id)"
                                    :class="[
                                        'w-5 h-5 flex items-center justify-center rounded border transition-colors shrink-0',
                                        selectedItemIds.includes(item.cart_item_id)
                                            ? 'bg-primary border-primary text-white'
                                            : 'bg-white border-border-light hover:border-primary'
                                    ]"
                                    :title="selectedItemIds.includes(item.cart_item_id) ? 'Bỏ chọn sản phẩm' : 'Chọn sản phẩm'"
                                >
                                    <span v-if="selectedItemIds.includes(item.cart_item_id)" class="material-symbols-outlined text-[16px]">check</span>
                                </button>

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
                                <p class="hidden md:block text-sm font-medium text-fashion-black text-center tabular-nums">
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
                                <div class="flex items-center justify-between md:justify-end gap-4 w-full md:w-full">
                                    <p class="text-sm font-bold text-fashion-black text-right tabular-nums">
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

                <!-- Footer: tổng + nút checkout -->
                <div class="bg-white border border-border-light rounded-xl shadow-sm p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div>
                        <div class="flex items-center gap-3 mb-2 md:hidden">
                            <button
                                @click="toggleSelectAll"
                                :class="[
                                    'w-5 h-5 flex items-center justify-center rounded border transition-colors',
                                    isAllSelected
                                        ? 'bg-primary border-primary text-white'
                                        : 'bg-white border-border-light hover:border-primary'
                                ]"
                            >
                                <span v-if="isAllSelected" class="material-symbols-outlined text-[16px]">check</span>
                            </button>
                            <span class="text-xs font-semibold text-fashion-black">Chọn tất cả</span>
                        </div>
                        <p class="text-xs text-text-muted uppercase tracking-widest mb-1">{{ selectedQuantity }} sản phẩm đã chọn</p>
                        <p class="text-2xl font-bold text-fashion-black">{{ formatPrice(selectedSubtotal) }}</p>
                        <p class="text-xs text-text-muted mt-1">Phí ship & voucher sẽ được tính ở bước thanh toán</p>
                    </div>
                    <button
                        @click="goToCheckout"
                        :disabled="selectedItemIds.length === 0"
                        class="w-full sm:w-auto bg-primary text-white px-10 py-4 text-sm font-bold uppercase tracking-widest hover:bg-primary-dark transition-all flex items-center justify-center gap-2 active:scale-[0.98] rounded-lg shadow-md shadow-primary/20"
                        :class="selectedItemIds.length === 0 ? 'opacity-50 cursor-not-allowed hover:bg-primary' : ''"
                    >
                        <span class="material-symbols-outlined text-[18px]">lock</span>
                        Tiến hành thanh toán
                    </button>
                </div>
            </div>

            <!-- Giỏ trống -->
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
