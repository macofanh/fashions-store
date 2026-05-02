<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { productService, type Product } from '@/pages/products/productService'
import { promotionService, type Voucher } from '@/pages/promotions/promotionService'
import { useAuthStore } from '@/stores/useAuthStore'
import ProductCard from '@/components/ProductCard.vue'

const authStore = useAuthStore()

const products = ref<Product[]>([])
const isLoading = ref(true)

// ── Vouchers ──────────────────────────────────────────────────────
const vouchers = ref<Voucher[]>([])
const isLoadingVouchers = ref(true)
const claimingId = ref<number | null>(null)
const claimedIds = ref<Set<number>>(new Set())

const fetchProducts = async () => {
    isLoading.value = true
    try {
        const response = await productService.getProducts({ page_size: 8 })
        products.value = response.data.items
    } catch (error) {
        console.error('Lỗi khi lấy sản phẩm:', error)
    } finally {
        isLoading.value = false
    }
}

const fetchVouchers = async () => {
    isLoadingVouchers.value = true
    try {
        const res = await promotionService.getVouchers()
        // Chỉ lấy voucher còn hạn và còn lượt dùng
        const now = new Date()
        vouchers.value = res.data.filter(v =>
            v.is_active &&
            new Date(v.end_date) > now &&
            (v.usage_limit === null || v.usage_limit === undefined || v.used_count < v.usage_limit)
        )
    } catch (error) {
        console.error('Lỗi khi lấy voucher:', error)
    } finally {
        isLoadingVouchers.value = false
    }
}

// Nếu đã đăng nhập, lấy danh sách voucher đã lưu để đánh dấu
const fetchMyVouchers = async () => {
    if (!authStore.isAuthenticated) return
    try {
        const res = await promotionService.getMyVouchers()
        res.data.forEach(uv => claimedIds.value.add(uv.voucher_id))
    } catch { /* bỏ qua */ }
}

const handleClaim = async (voucher: Voucher) => {
    if (!authStore.isAuthenticated) {
        window.location.href = '/auth/login'
        return
    }
    if (claimedIds.value.has(voucher.voucher_id) || claimingId.value) return
    claimingId.value = voucher.voucher_id
    try {
        await promotionService.claimVoucher(voucher.voucher_id)
        claimedIds.value.add(voucher.voucher_id)
    } catch (e: any) {
        // Nếu đã lưu rồi (409) thì cũng đánh dấu
        if (e.response?.status === 409) claimedIds.value.add(voucher.voucher_id)
    } finally {
        claimingId.value = null
    }
}

const formatDiscount = (v: Voucher) => {
    if (v.discount_type === 'PERCENT') return `GIẢM ${v.discount_value}%`
    if (v.discount_type === 'FIXED_AMOUNT') return `GIẢM ${new Intl.NumberFormat('vi-VN').format(Number(v.discount_value))}₫`
    if (v.discount_type === 'FREE_SHIP') return 'MIỄN PHÍ VẬN CHUYỂN'
    return ''
}

const formatMinOrder = (v: Voucher) => {
    if (!v.min_order_value || Number(v.min_order_value) === 0) return 'Không giới hạn'
    return `Đơn từ ${new Intl.NumberFormat('vi-VN').format(Number(v.min_order_value))}₫`
}

const formatExpiry = (dateStr: string) => {
    const d = new Date(dateStr)
    return `HSD: ${d.getDate().toString().padStart(2,'0')}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getFullYear()}`
}

// Màu nền theo loại voucher
const voucherBg = (type: Voucher['discount_type']) => {
    if (type === 'PERCENT')      return 'from-zinc-900 to-zinc-700'
    if (type === 'FIXED_AMOUNT') return 'from-stone-800 to-stone-600'
    if (type === 'FREE_SHIP')    return 'from-slate-800 to-slate-600'
    return 'from-zinc-900 to-zinc-700'
}

onMounted(() => {
    fetchProducts()
    fetchVouchers()
    fetchMyVouchers()
})
</script>

<template>
    <div class="bg-white">
        <!-- Banner / Hero Section -->
        <section class="relative h-[85vh] w-full overflow-hidden bg-zinc-900">
            <!-- Background Image -->
            <img 
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070" 
                class="absolute inset-0 w-full h-full object-cover opacity-60"
                alt="Banner Hero"
            />
            
            <!-- Overlay Content -->
            <div class="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
                <span class="text-white/80 uppercase tracking-[0.6em] text-[10px] mb-6 animate-fade-in">Mùa Xuân Hè 2026</span>
                <h1 class="text-white text-6xl md:text-8xl serif-text italic mb-10 animate-fade-in-up">The New Elegance.</h1>
                <div class="flex gap-4 animate-fade-in" style="animation-delay: 0.5s;">
                    <router-link 
                        to="/products" 
                        class="btn-radius bg-white text-zinc-900 px-10 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-zinc-900 hover:text-white transition-all duration-500"
                    >
                        Mua sắm nam
                    </router-link>
                    <router-link 
                        to="/products" 
                        class="btn-radius bg-transparent border border-white text-white px-10 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-white hover:text-zinc-900 transition-all duration-500"
                    >
                        Mua sắm nữ
                    </router-link>
                </div>
            </div>

            <!-- Scroll Indicator -->
            <div class="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3">
                <div class="w-[1px] h-16 bg-gradient-to-b from-white/0 via-white/50 to-white/0"></div>
            </div>
        </section>

        <!-- Voucher Banner Section -->
        <section v-if="isLoadingVouchers || vouchers.length > 0" class="bg-zinc-900 py-14 px-6 overflow-hidden">
            <div class="max-w-[1600px] mx-auto">
                <!-- Header -->
                <div class="flex items-end justify-between mb-8">
                    <div>
                        <p class="text-[10px] uppercase tracking-[0.5em] text-zinc-500 mb-2">Ưu đãi độc quyền</p>
                        <h2 class="text-2xl md:text-3xl serif-text italic text-white">Khuyến mãi hôm nay</h2>
                    </div>
                    <router-link
                        to="/vouchers"
                        class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 hover:text-white transition-colors border-b border-zinc-700 hover:border-white pb-0.5"
                    >
                        Xem tất cả
                    </router-link>
                </div>

                <!-- Skeleton -->
                <div v-if="isLoadingVouchers" class="flex gap-4 overflow-hidden">
                    <div v-for="i in 4" :key="i" class="shrink-0 w-72 h-40 bg-zinc-800 animate-pulse rounded-none"></div>
                </div>

                <!-- Voucher Cards — scroll ngang -->
                <div v-else class="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x snap-mandatory">
                    <div
                        v-for="voucher in vouchers"
                        :key="voucher.voucher_id"
                        class="shrink-0 w-72 snap-start"
                    >
                        <!-- Card -->
                        <div :class="['bg-gradient-to-br relative overflow-hidden h-40 flex flex-col justify-between p-6', voucherBg(voucher.discount_type)]">
                            <!-- Decorative circles -->
                            <div class="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/5"></div>
                            <div class="absolute -right-4 -bottom-10 w-24 h-24 rounded-full bg-white/5"></div>

                            <!-- Top: tên + loại -->
                            <div>
                                <p class="text-[9px] uppercase tracking-[0.3em] text-white/50 mb-1">{{ voucher.name }}</p>
                                <p class="text-xl font-black text-white tracking-tight leading-tight">{{ formatDiscount(voucher) }}</p>
                            </div>

                            <!-- Bottom: điều kiện + code + nút -->
                            <div class="flex items-end justify-between gap-2">
                                <div>
                                    <p class="text-[9px] text-white/50 uppercase tracking-wider">{{ formatMinOrder(voucher) }}</p>
                                    <p class="text-[9px] text-white/40 mt-0.5">{{ formatExpiry(voucher.end_date) }}</p>
                                    <!-- Code badge -->
                                    <div class="mt-2 inline-flex items-center gap-1.5 bg-white/10 border border-white/20 px-2.5 py-1">
                                        <span class="material-symbols-outlined text-[12px] text-white/60">confirmation_number</span>
                                        <span class="text-[10px] font-bold tracking-[0.2em] text-white">{{ voucher.code }}</span>
                                    </div>
                                </div>

                                <!-- Nút lưu -->
                                <button
                                    @click="handleClaim(voucher)"
                                    :disabled="claimingId === voucher.voucher_id"
                                    :class="[
                                        'btn-radius shrink-0 px-4 py-2.5 text-[9px] font-black uppercase tracking-widest transition-all',
                                        claimedIds.has(voucher.voucher_id)
                                            ? 'bg-white/20 text-white/60 cursor-default'
                                            : 'bg-white text-zinc-900 hover:bg-zinc-100 active:scale-95'
                                    ]"
                                >
                                    <span v-if="claimingId === voucher.voucher_id" class="flex items-center gap-1.5">
                                        <span class="animate-spin h-3 w-3 border-2 border-zinc-900 border-t-transparent rounded-full inline-block"></span>
                                    </span>
                                    <span v-else-if="claimedIds.has(voucher.voucher_id)" class="flex items-center gap-1">
                                        <span class="material-symbols-outlined text-[14px]" style="font-variation-settings:'FILL' 1">check_circle</span>
                                        Đã lưu
                                    </span>
                                    <span v-else>Lưu ngay</span>
                                </button>
                            </div>
                        </div>

                        <!-- Đường cắt dashed giữa 2 nửa card (hiệu ứng coupon) -->
                        <div class="h-0 border-t-2 border-dashed border-zinc-900 mx-0 relative">
                            <div class="absolute -left-3 -top-3 w-6 h-6 rounded-full bg-zinc-900"></div>
                            <div class="absolute -right-3 -top-3 w-6 h-6 rounded-full bg-zinc-900"></div>
                        </div>
                        <div :class="['bg-gradient-to-br px-6 py-3 flex items-center justify-between', voucherBg(voucher.discount_type)]">
                            <p class="text-[9px] text-white/40 uppercase tracking-widest">
                                {{ voucher.usage_limit ? `Còn ${voucher.usage_limit - voucher.used_count} lượt` : 'Không giới hạn lượt' }}
                            </p>
                            <div class="flex gap-0.5">
                                <div v-for="i in 6" :key="i" class="w-1 h-1 rounded-full bg-white/20"></div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Hint scroll mobile -->
                <p class="text-[9px] text-zinc-600 uppercase tracking-widest text-center mt-6 md:hidden">
                    ← Vuốt để xem thêm →
                </p>
            </div>
        </section>

        <!-- Product Grid Section -->
        <section class="max-w-[1600px] mx-auto px-6 md:px-12 py-24">
            <header class="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
                <div>
                    <h2 class="text-3xl md:text-4xl serif-text text-zinc-900 italic mb-2">Bộ sưu tập nổi bật</h2>
                    <p class="text-zinc-400 text-[10px] uppercase tracking-[0.3em]">Được tuyển chọn kỹ lưỡng cho phong cách của bạn</p>
                </div>
                <router-link to="/products" class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 border-b border-zinc-900 pb-1 hover:text-zinc-500 hover:border-zinc-500 transition-all">
                    Xem tất cả sản phẩm
                </router-link>
            </header>

            <!-- Grid Layout -->
            <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                <!-- Skeleton Loading -->
                <div v-for="i in 4" :key="i" class="animate-pulse">
                    <div class="aspect-[3/4] bg-zinc-100 mb-6"></div>
                    <div class="h-3 bg-zinc-100 w-1/2 mx-auto mb-2"></div>
                    <div class="h-3 bg-zinc-100 w-1/4 mx-auto"></div>
                </div>
            </div>

            <div v-else class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-16">
                <ProductCard 
                    v-for="product in products" 
                    :key="product.product_id" 
                    :product="product" 
                />
            </div>
            
            <!-- Empty State -->
            <div v-if="!isLoading && products.length === 0" class="text-center py-20 border border-dashed border-zinc-200">
                <p class="text-zinc-400 uppercase tracking-widest text-xs">Hiện chưa có sản phẩm nào được hiển thị.</p>
            </div>
        </section>

        <!-- Featured Quote -->
        <section class="bg-zinc-50 py-32 text-center px-6">
            <div class="max-w-3xl mx-auto">
                <span class="text-[30px] serif-text text-zinc-300">“</span>
                <p class="text-2xl md:text-3xl serif-text italic text-zinc-800 leading-relaxed mb-8">
                    Thời trang không chỉ là thứ bạn mặc. Đó là cách bạn thể hiện bản thân với thế giới.
                </p>
                <p class="text-[10px] uppercase tracking-[0.4em] font-bold text-zinc-400">— Azure Editorial Team</p>
            </div>
        </section>
    </div>
</template>

<style scoped>
.serif-text {
    font-family: 'Playfair Display', serif;
}

/* Ẩn scrollbar nhưng vẫn scroll được */
.scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
    display: none;
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in {
    animation: fadeIn 1.5s ease-out forwards;
}

.animate-fade-in-up {
    animation: fadeInUp 1.2s ease-out forwards;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
</style>
