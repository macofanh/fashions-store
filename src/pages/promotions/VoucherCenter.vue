<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { promotionService, type Voucher } from '@/pages/promotions/promotionService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'

const authStore = useAuthStore()
const uiStore = useUIStore()

const availableVouchers = ref<Voucher[]>([])
const isLoading = ref(true)
const claimingId = ref<number | null>(null)

const fetchVouchers = async () => {
    isLoading.value = true
    try {
        const response = await promotionService.getVouchers()
        // Sắp xếp theo sort_order tăng dần
        availableVouchers.value = response.data
            .filter(v => v.is_active)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
    } catch (error) {
        console.error('Lỗi lấy danh sách voucher:', error)
    } finally {
        isLoading.value = false
    }
}

const claimVoucher = async (id: number) => {
    if (!authStore.isAuthenticated) {
        uiStore.info('Vui lòng đăng nhập để lưu voucher.')
        return
    }
    claimingId.value = id
    try {
        await promotionService.claimVoucher(id)
        uiStore.success('Lưu voucher thành công! Dùng khi thanh toán.')
    } catch (error: any) {
        uiStore.error(error.response?.data?.detail || 'Có lỗi xảy ra khi lưu voucher.')
    } finally {
        claimingId.value = null
    }
}

onMounted(fetchVouchers)

const formatPrice = (price: number | string) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price))

const getDiscountLabel = (v: Voucher) => {
    if (v.discount_type === 'PERCENT') return `-${v.discount_value}%`
    if (v.discount_type === 'FIXED_AMOUNT') return `-${formatPrice(v.discount_value)}`
    if (v.discount_type === 'FREE_SHIP') return 'FREE SHIP'
    return ''
}

// Màu nền mặc định nếu admin không set
const DEFAULT_COLORS = ['#17b0cf', '#0e191b', '#4e8b97', '#e7f1f3', '#f5f5f0']
const getCardBg = (v: Voucher, idx: number) =>
    v.bg_color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length]

const isLightColor = (hex: string) => {
    const c = hex.replace('#', '')
    const r = parseInt(c.substring(0, 2), 16)
    const g = parseInt(c.substring(2, 4), 16)
    const b = parseInt(c.substring(4, 6), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128
}
</script>

<template>
    <div class="bg-background-light min-h-screen pb-24">
        <!-- Hero -->
        <div class="bg-fashion-black text-white py-20 px-6 text-center">
            <p class="text-[9px] uppercase tracking-[0.5em] text-text-muted mb-4">Azure Editorial</p>
            <h1 class="text-5xl md:text-6xl font-serif italic mb-4">Voucher Center</h1>
            <p class="text-[10px] uppercase tracking-[0.4em] text-zinc-400">Khám phá các ưu đãi đặc biệt dành riêng cho bạn</p>
        </div>

        <div class="max-w-[1400px] mx-auto px-6 py-16">

            <!-- Loading -->
            <div v-if="isLoading" class="flex justify-center py-20">
                <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>

            <!-- Empty -->
            <div v-else-if="availableVouchers.length === 0" class="text-center py-20 text-text-muted italic border border-dashed border-border-light">
                Hiện tại không có chương trình khuyến mãi nào.
            </div>

            <!-- Voucher Grid — Dynamic render từ API -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div
                    v-for="(v, idx) in availableVouchers"
                    :key="v.voucher_id"
                    class="relative overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group"
                    :style="{ backgroundColor: getCardBg(v, idx) }"
                >
                    <!-- Banner image nếu có -->
                    <div v-if="v.banner_image" class="h-32 overflow-hidden">
                        <img
                            :src="v.banner_image"
                            :alt="v.name"
                            class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
                        />
                    </div>

                    <!-- Content -->
                    <div class="p-8" :class="isLightColor(getCardBg(v, idx)) ? 'text-fashion-black' : 'text-white'">
                        <!-- Discount badge -->
                        <div class="flex justify-between items-start mb-4">
                            <span
                                class="text-3xl font-serif italic font-bold"
                                :class="isLightColor(getCardBg(v, idx)) ? 'text-fashion-black' : 'text-white'"
                            >
                                {{ getDiscountLabel(v) }}
                            </span>
                            <span
                                class="text-[9px] font-bold uppercase tracking-widest px-3 py-1 border"
                                :class="isLightColor(getCardBg(v, idx))
                                    ? 'border-fashion-black/30 text-fashion-black'
                                    : 'border-white/30 text-white'"
                            >
                                {{ v.code }}
                            </span>
                        </div>

                        <!-- Name & Subtitle -->
                        <h3
                            class="text-lg font-serif italic mb-1"
                            :class="isLightColor(getCardBg(v, idx)) ? 'text-fashion-black' : 'text-white'"
                        >
                            {{ v.name }}
                        </h3>
                        <p
                            v-if="v.subtitle"
                            class="text-[11px] mb-4 font-light"
                            :class="isLightColor(getCardBg(v, idx)) ? 'text-fashion-black/60' : 'text-white/60'"
                        >
                            {{ v.subtitle }}
                        </p>

                        <!-- Conditions -->
                        <div
                            class="space-y-1.5 mb-6 text-[10px]"
                            :class="isLightColor(getCardBg(v, idx)) ? 'text-fashion-black/60' : 'text-white/60'"
                        >
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-[14px]">shopping_bag</span>
                                <span>Đơn tối thiểu: {{ formatPrice(v.min_order_value) }}</span>
                            </div>
                            <div v-if="v.max_discount" class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-[14px]">price_check</span>
                                <span>Giảm tối đa: {{ formatPrice(v.max_discount) }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-[14px]">event</span>
                                <span>HSD: {{ new Date(v.end_date).toLocaleDateString('vi-VN') }}</span>
                            </div>
                        </div>

                        <!-- CTA -->
                        <button
                            @click="claimVoucher(v.voucher_id)"
                            :disabled="claimingId === v.voucher_id"
                            :class="[
                                'btn-radius w-full py-3 text-[10px] uppercase tracking-[0.3em] font-bold border transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2',
                                isLightColor(getCardBg(v, idx))
                                    ? 'border-fashion-black text-fashion-black hover:bg-fashion-black hover:text-white'
                                    : 'border-white text-white hover:bg-white hover:text-fashion-black'
                            ]"
                        >
                            <span v-if="claimingId === v.voucher_id" class="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
                            <span class="material-symbols-outlined text-[16px]" v-else>bookmark_add</span>
                            Lưu Voucher
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
