<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { promotionService, type Voucher, type UserVoucher, type TierKey } from '@/pages/promotions/promotionService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { useRouter } from 'vue-router'
import { MEMBERSHIP_TIERS, getTierByPoints } from '@/pages/profile/membershipService'
import { useCartStore } from '@/stores/useCartStore'

const authStore = useAuthStore()
const uiStore   = useUIStore()
const router    = useRouter()

const availableVouchers = ref<Voucher[]>([])
const myVouchers        = ref<UserVoucher[]>([])
const isLoading         = ref(true)
const claimingId        = ref<number | null>(null)

// Hạng hiện tại của user (lấy từ authStore.user.total_points)
const userTier = computed(() =>
    authStore.user ? getTierByPoints((authStore.user as any).total_points ?? 0) : null
)

// Thứ tự hạng tăng dần để so sánh
const TIER_ORDER: TierKey[] = ['bronze', 'silver', 'gold', 'platinum', 'diamond']

// Config hiển thị cho từng hạng — khớp với MEMBERSHIP_TIERS
const TIER_CONFIG: Record<TierKey, { label: string; icon: string; color: string; bg: string; border: string }> = {
    bronze:   { label: 'Đồng',      icon: 'shield',             color: 'text-orange-700', bg: 'bg-orange-50',  border: 'border-orange-200' },
    silver:   { label: 'Bạc',       icon: 'military_tech',      color: 'text-zinc-400',   bg: 'bg-zinc-50',    border: 'border-zinc-200'   },
    gold:     { label: 'Vàng',      icon: 'star',               color: 'text-amber-500',  bg: 'bg-amber-50',   border: 'border-amber-200'  },
    platinum: { label: 'Bạch Kim',  icon: 'workspace_premium',  color: 'text-slate-500',  bg: 'bg-slate-50',   border: 'border-slate-200'  },
    diamond:  { label: 'Kim Cương', icon: 'diamond',            color: 'text-cyan-500',   bg: 'bg-cyan-50',    border: 'border-cyan-200'   },
}

/** User có đủ hạng để claim/dùng voucher này không */
const hasRequiredTier = (v: Voucher): boolean => {
    if (!v.required_tier) return true
    if (!authStore.isAuthenticated || !userTier.value) return false
    const userIdx     = TIER_ORDER.indexOf(userTier.value.key as TierKey)
    const requiredIdx = TIER_ORDER.indexOf(v.required_tier)
    return userIdx >= requiredIdx
}

const fetchAll = async () => {
    isLoading.value = true
    try {
        const promises: Promise<any>[] = [promotionService.getVouchers()]
        if (authStore.isAuthenticated) {
            promises.push(promotionService.getMyVouchers())
        }
        const [vouchersRes, myRes] = await Promise.all(promises)
        availableVouchers.value = (vouchersRes.data as Voucher[])
            .filter(v => v.is_active)
            .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        myVouchers.value = myRes?.data ?? []
    } catch (error) {
        console.error('Lỗi lấy danh sách voucher:', error)
    } finally {
        isLoading.value = false
    }
}

// Map voucher_id → UserVoucher để tra nhanh
const myVoucherMap = computed(() => {
    const map = new Map<number, UserVoucher>()
    myVouchers.value.forEach(uv => map.set(uv.voucher_id, uv))
    return map
})

type VoucherStatus = 'available' | 'claimed' | 'used_up' | 'locked' | 'guest'

const getStatus = (v: Voucher): VoucherStatus => {
    if (!authStore.isAuthenticated) return 'guest'
    if (!hasRequiredTier(v)) return 'locked'
    const uv = myVoucherMap.value.get(v.voucher_id)
    if (!uv) return 'available'
    if (uv.used_count >= v.usage_per_user) return 'used_up'
    return 'claimed'
}

const claimVoucher = async (v: Voucher) => {
    if (!authStore.isAuthenticated) {
        uiStore.info('Vui lòng đăng nhập để lưu voucher.')
        router.push({ name: 'login' })
        return
    }
    const status = getStatus(v)
    if (status === 'locked') {
        const cfg = v.required_tier ? TIER_CONFIG[v.required_tier] : null
        uiStore.warning(`Voucher này yêu cầu hạng ${cfg?.label ?? ''} trở lên.`)
        return
    }
    if (status === 'claimed') {
        uiStore.info('Bạn đã lưu voucher này rồi. Dùng khi thanh toán nhé!')
        return
    }
    if (status === 'used_up') return

    claimingId.value = v.voucher_id
    try {
        const res = await promotionService.claimVoucher(v.voucher_id)
        myVouchers.value.push(res.data)
        uiStore.success('Lưu voucher thành công! Dùng khi thanh toán.')
    } catch (error: any) {
        if (error.response?.status === 409) {
            uiStore.info('Bạn đã lưu voucher này rồi.')
            await fetchAll()
        } else {
            uiStore.error(error.response?.data?.detail || 'Có lỗi xảy ra khi lưu voucher.')
        }
    } finally {
        claimingId.value = null
    }
}

onMounted(fetchAll)

const formatPrice = (price: number | string) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price))

const getDiscountLabel = (v: Voucher) => {
    if (v.discount_type === 'PERCENT')      return `-${v.discount_value}%`
    if (v.discount_type === 'FIXED_AMOUNT') return `-${formatPrice(v.discount_value)}`
    if (v.discount_type === 'FREE_SHIP')    return 'FREE SHIP'
    return ''
}

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
            <h1 class="text-5xl md:text-6xl font-serif italic mb-4">Voucher Center</h1>
            <p class="text-[10px] uppercase tracking-[0.4em] text-zinc-400">Khám phá các ưu đãi đặc biệt dành riêng cho bạn</p>
            <!-- Hạng hiện tại của user -->
            <div v-if="userTier" class="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 text-white text-xs font-semibold">
                <span class="material-symbols-outlined text-[16px]">{{ userTier.icon }}</span>
                Hạng của bạn: {{ userTier.label }}
            </div>
        </div>

        <div class="max-w-[1400px] mx-auto px-6 py-16">

            <!-- Loading -->
            <div v-if="isLoading" class="flex justify-center py-20">
                <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>

            <!-- Empty -->
            <div v-else-if="availableVouchers.length === 0"
                class="text-center py-20 text-text-muted italic border border-dashed border-border-light">
                Hiện tại không có chương trình khuyến mãi nào.
            </div>

            <!-- Voucher Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div
                    v-for="(v, idx) in availableVouchers"
                    :key="v.voucher_id"
                    class="relative overflow-hidden shadow-lg transition-all duration-300 group"
                    :class="getStatus(v) === 'locked' ? 'opacity-70' : 'hover:shadow-xl hover:-translate-y-1'"
                    :style="{ backgroundColor: getCardBg(v, idx) }"
                >
                    <!-- Banner image -->
                    <div v-if="v.banner_image" class="h-32 overflow-hidden">
                        <img :src="v.banner_image" :alt="v.name"
                            class="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" />
                    </div>

                    <!-- Ribbon trạng thái -->
                    <div
                        v-if="getStatus(v) !== 'available' && getStatus(v) !== 'guest'"
                        class="absolute top-4 left-0 z-10 px-3 py-1 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"
                        :class="{
                            'bg-emerald-500 text-white': getStatus(v) === 'claimed',
                            'bg-zinc-500 text-white':    getStatus(v) === 'used_up',
                            'bg-black/60 text-white':    getStatus(v) === 'locked',
                        }"
                    >
                        <span class="material-symbols-outlined text-[12px]">
                            {{ getStatus(v) === 'claimed' ? 'bookmark' : getStatus(v) === 'locked' ? 'lock' : 'check_circle' }}
                        </span>
                        {{ getStatus(v) === 'claimed' ? 'Đã lưu' : getStatus(v) === 'locked' ? 'Yêu cầu hạng cao hơn' : 'Đã sử dụng' }}
                    </div>

                    <!-- Lock overlay khi chưa đủ hạng -->
                    <div v-if="getStatus(v) === 'locked'"
                        class="absolute inset-0 bg-black/20 backdrop-blur-[1px] z-[5]"></div>

                    <!-- Content -->
                    <div class="p-8 relative z-[6]" :class="isLightColor(getCardBg(v, idx)) ? 'text-fashion-black' : 'text-white'">
                        <!-- Discount + code -->
                        <div class="flex justify-between items-start mb-4">
                            <span class="text-3xl font-serif italic font-bold">
                                {{ getDiscountLabel(v) }}
                            </span>
                            <span class="text-[9px] font-bold uppercase tracking-widest px-3 py-1 border"
                                :class="isLightColor(getCardBg(v, idx))
                                    ? 'border-fashion-black/30 text-fashion-black'
                                    : 'border-white/30 text-white'">
                                {{ v.code }}
                            </span>
                        </div>

                        <!-- Name & Subtitle -->
                        <h3 class="text-lg font-serif italic mb-1">{{ v.name }}</h3>
                        <p v-if="v.subtitle" class="text-[11px] mb-4 font-light opacity-60">{{ v.subtitle }}</p>

                        <!-- Conditions -->
                        <div class="space-y-1.5 mb-5 text-[10px] opacity-70">
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
                            <div class="flex items-center gap-2">
                                <span class="material-symbols-outlined text-[14px]">person</span>
                                <span>Mỗi người dùng {{ v.usage_per_user }} lần</span>
                            </div>
                        </div>

                        <!-- Badge hạng yêu cầu -->
                        <div v-if="v.required_tier" class="mb-4">
                            <span :class="[
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                                isLightColor(getCardBg(v, idx))
                                    ? `${TIER_CONFIG[v.required_tier].color} ${TIER_CONFIG[v.required_tier].bg} ${TIER_CONFIG[v.required_tier].border}`
                                    : 'text-white border-white/40 bg-white/10'
                            ]">
                                <span class="material-symbols-outlined text-[13px]" style="font-variation-settings:'FILL' 1">
                                    {{ TIER_CONFIG[v.required_tier].icon }}
                                </span>
                                Dành cho hạng {{ TIER_CONFIG[v.required_tier].label }} trở lên
                            </span>
                        </div>

                        <!-- CTA -->
                        <!-- Locked -->
                        <div v-if="getStatus(v) === 'locked'"
                            class="w-full py-3 text-[10px] uppercase tracking-[0.3em] font-bold border text-center cursor-not-allowed opacity-60 flex items-center justify-center gap-2"
                            :class="isLightColor(getCardBg(v, idx))
                                ? 'border-fashion-black/30 text-fashion-black'
                                : 'border-white/30 text-white'">
                            <span class="material-symbols-outlined text-[15px]">lock</span>
                            Nâng hạng để mở khóa
                        </div>

                        <!-- Đã dùng hết -->
                        <div v-else-if="getStatus(v) === 'used_up'"
                            class="w-full py-3 text-[10px] uppercase tracking-[0.3em] font-bold border text-center opacity-50 cursor-not-allowed"
                            :class="isLightColor(getCardBg(v, idx))
                                ? 'border-fashion-black/30 text-fashion-black'
                                : 'border-white/30 text-white'">
                            Đã sử dụng
                        </div>

                        <!-- Đã lưu, chưa dùng -->
                        <button v-else-if="getStatus(v) === 'claimed'"
                            @click="claimVoucher(v)"
                            :class="[
                                'btn-radius w-full py-3 text-[10px] uppercase tracking-[0.3em] font-bold border transition-all flex items-center justify-center gap-2',
                                isLightColor(getCardBg(v, idx))
                                    ? 'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                                    : 'border-emerald-400 text-emerald-300 bg-emerald-900/20'
                            ]">
                            <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">bookmark</span>
                            Đã lưu · Dùng khi thanh toán
                        </button>

                        <!-- Chưa lưu / guest -->
                        <button v-else
                            @click="claimVoucher(v)"
                            :disabled="claimingId === v.voucher_id"
                            :class="[
                                'btn-radius w-full py-3 text-[10px] uppercase tracking-[0.3em] font-bold border transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2',
                                isLightColor(getCardBg(v, idx))
                                    ? 'border-fashion-black text-fashion-black hover:bg-fashion-black hover:text-white'
                                    : 'border-white text-white hover:bg-white hover:text-fashion-black'
                            ]">
                            <span v-if="claimingId === v.voucher_id"
                                class="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></span>
                            <span v-else class="material-symbols-outlined text-[16px]">bookmark_add</span>
                            Lưu Voucher
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
