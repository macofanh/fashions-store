<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { promotionService, type Voucher, type UserVoucher, type TierKey } from '@/pages/promotions/promotionService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { useRouter } from 'vue-router'
import { MEMBERSHIP_TIERS, getTierByPoints } from '@/pages/profile/membershipService'
import { useCartStore } from '@/stores/useCartStore'
import axiosClient from '@/lib/axiosClient'
import SurveyModal from './SurveyModal.vue'

const authStore = useAuthStore()
const uiStore   = useUIStore()
const router    = useRouter()

// State khảo sát khách hàng
const showSurveyModal  = ref(false)
const isSurveyEligible = ref(false)
const surveyOrderId    = ref<number | null>(null)
const surveyReason     = ref('')
const surveyMessage    = ref('')
const activeSurveyDetail = ref<any>(null)

const fetchActiveSurvey = async () => {
    try {
        const res = await axiosClient.get('/api/v1/orders/survey/active')
        activeSurveyDetail.value = res.data
    } catch (e) {
        console.error('Lỗi lấy khảo sát active:', e)
    }
}

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

const checkSurveyEligibility = async () => {
    if (!authStore.isAuthenticated) return
    try {
        const res = await axiosClient.get('/api/v1/orders/survey/eligibility')
        isSurveyEligible.value = res.data.eligible
        surveyOrderId.value = res.data.order_id || null
        surveyReason.value = res.data.reason || ''
        surveyMessage.value = res.data.message
    } catch (e) {
        console.error('Lỗi kiểm tra điều kiện khảo sát:', e)
    }
}

const onSurveySuccess = async () => {
    await fetchAll()
    await checkSurveyEligibility()
}

const fetchAll = async () => {
    isLoading.value = true
    try {
        const promises: Promise<any>[] = [promotionService.getVouchers({ exclude_survey_rewards: true }), fetchActiveSurvey()]
        if (authStore.isAuthenticated) {
            promises.push(promotionService.getMyVouchers())
            promises.push(checkSurveyEligibility())
        }
        const [vouchersRes, _surveyRes, myRes] = await Promise.all(promises)
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
    v.bg_color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] || '#17b0cf'

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
        <section class="border-b border-border-light bg-white">
            <div class="mx-auto max-w-[1400px] px-6 py-5 md:px-12">
                <nav class="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted font-display">
                    <router-link to="/" class="transition-colors hover:text-primary">Trang chủ</router-link>
                    <span>/</span>
                    <span class="text-fashion-black">Ưu đãi</span>
                </nav>

                <div class="flex flex-wrap items-center justify-start gap-3 md:justify-center">
                    <div v-if="userTier" class="inline-flex items-center gap-2 rounded-lg border border-border-light bg-background-light px-4 py-3 text-xs font-semibold text-fashion-black font-display">
                        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                            <span class="material-symbols-outlined text-[16px]">{{ userTier.icon }}</span>
                        </span>
                        <span>Hạng {{ userTier.label }}</span>
                    </div>

                    <router-link
                        v-if="authStore.isAuthenticated"
                        to="/my-vouchers"
                        class="inline-flex items-center gap-2 rounded-lg bg-fashion-black px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-primary font-display"
                    >
                        <span class="material-symbols-outlined text-[16px]">local_offer</span>
                        Voucher của tôi
                    </router-link>
                </div>
            </div>
        </section>

        <div class="max-w-[1400px] mx-auto px-6 py-10 md:px-12">

            <!-- Banner Khảo Sát -->
            <div 
                v-if="activeSurveyDetail" 
                class="mb-8 p-6 rounded-2xl border bg-white shadow-sm overflow-hidden relative flex flex-col sm:flex-row items-center justify-between gap-6"
                :class="surveyReason === 'ALREADY_SUBMITTED' ? 'border-zinc-200' : 'border-primary/20 bg-gradient-to-r from-emerald-50/20 via-white to-primary/5'"
            >
                <div class="flex items-center gap-4 min-w-0">
                    <div class="w-12 h-12 rounded-full flex items-center justify-center shrink-0" :class="surveyReason === 'ALREADY_SUBMITTED' ? 'bg-zinc-100 text-zinc-400' : 'bg-primary/10 text-primary'">
                        <span class="material-symbols-outlined text-[24px]">
                            {{ surveyReason === 'ALREADY_SUBMITTED' ? 'verified' : 'volunteer_activism' }}
                        </span>
                    </div>
                    <div class="space-y-1 text-left">
                        <h3 class="text-sm font-bold text-fashion-black font-display">
                            {{ surveyReason === 'ALREADY_SUBMITTED' ? 'Đã hoàn thành khảo sát dịch vụ' : activeSurveyDetail.title }}
                        </h3>
                        <p class="text-xs text-text-muted font-light leading-relaxed">
                            {{ surveyReason === 'ALREADY_SUBMITTED' ? 'Cảm ơn đóng góp quý giá của bạn! Quà tặng đã được lưu trong voucher của bạn.' : (activeSurveyDetail.description || 'Tham gia đóng góp ý kiến để nhận ngay Gift Voucher đặc biệt.') }}
                        </p>
                    </div>
                </div>

                <!-- Guest CTA -->
                <button 
                    v-if="!authStore.isAuthenticated"
                    @click="router.push({ name: 'login' })"
                    class="shrink-0 rounded-xl bg-fashion-black hover:bg-primary text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-sm font-display cursor-pointer"
                >
                    <span class="material-symbols-outlined text-[16px]">login</span>
                    Đăng nhập để tham gia
                </button>

                <!-- Logged in, not submitted, eligible CTA -->
                <button 
                    v-else-if="surveyReason !== 'ALREADY_SUBMITTED' && isSurveyEligible"
                    @click="showSurveyModal = true"
                    class="shrink-0 rounded-xl bg-fashion-black hover:bg-primary text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-sm font-display cursor-pointer"
                >
                    <span class="material-symbols-outlined text-[16px]">rate_review</span>
                    Tham gia khảo sát
                </button>

                <!-- Logged in, not submitted, but not eligible CTA (e.g. no delivered orders) -->
                <button 
                    v-else-if="surveyReason !== 'ALREADY_SUBMITTED' && !isSurveyEligible"
                    @click="uiStore.warning('Bạn cần mua hàng và nhận hàng thành công ít nhất một lần để tham gia khảo sát.')"
                    class="shrink-0 rounded-xl bg-zinc-400 hover:bg-zinc-500 text-white text-xs font-bold uppercase tracking-widest px-6 py-3.5 transition-all duration-300 flex items-center gap-2 active:scale-95 shadow-sm font-display cursor-pointer"
                >
                    <span class="material-symbols-outlined text-[16px]">rate_review</span>
                    Tham gia khảo sát
                </button>

                <!-- Logged in & already submitted -->
                <div 
                    v-else 
                    class="shrink-0 px-5 py-2.5 rounded-xl border border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wider font-bold text-zinc-400 select-none font-display"
                >
                    Đã nhận quà
                </div>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="flex justify-center py-20">
                <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
            </div>

            <!-- Empty -->
            <div v-else-if="availableVouchers.length === 0"
                class="rounded-xl bg-white text-center py-20 text-text-muted italic border border-dashed border-border-light">
                Hiện tại không có chương trình khuyến mãi nào.
            </div>

            <!-- Voucher Grid -->
            <div v-else class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                <div
                    v-for="(v, idx) in availableVouchers"
                    :key="v.voucher_id"
                    class="relative overflow-hidden rounded-xl border border-border-light bg-white shadow-sm transition-all duration-300 group"
                    :class="getStatus(v) === 'locked' ? 'opacity-75' : 'hover:shadow-md hover:-translate-y-0.5'"
                >
                    <!-- Ribbon trạng thái -->
                    <div
                        v-if="getStatus(v) !== 'available' && getStatus(v) !== 'guest'"
                        class="absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-widest flex items-center gap-1"
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
                        class="absolute inset-0 bg-white/50 backdrop-blur-[1px] z-[5]"></div>

                    <div
                        class="h-2 w-full"
                        :style="{ backgroundColor: getCardBg(v, idx) }"
                    ></div>

                    <!-- Content -->
                    <div class="p-5 relative z-[6]">
                        <!-- Discount + code -->
                        <div class="mb-4 flex items-start gap-4">
                            <div
                                class="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-lg text-center"
                                :style="{ backgroundColor: getCardBg(v, idx) }"
                                :class="isLightColor(getCardBg(v, idx)) ? 'text-fashion-black' : 'text-white'"
                            >
                                <span class="text-2xl font-serif italic font-bold leading-none">{{ getDiscountLabel(v) }}</span>
                                <span class="mt-1 text-[9px] uppercase tracking-widest opacity-70">Offer</span>
                            </div>

                            <div class="min-w-0 flex-1 pt-1">
                                <span class="inline-flex max-w-full rounded-full border border-border-light bg-background-light px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-fashion-black">
                                    {{ v.code }}
                                </span>
                                <h3 class="mt-3 line-clamp-2 text-base font-bold leading-snug text-fashion-black font-display">{{ v.name }}</h3>
                            </div>
                        </div>

                        <!-- Name & Subtitle -->
                        <p v-if="v.subtitle" class="mb-4 min-h-10 text-[12px] text-text-muted font-display leading-relaxed">{{ v.subtitle }}</p>
                        <p v-else class="mb-4 min-h-10 text-[12px] text-text-muted font-display leading-relaxed">Ưu đãi có thể dùng trong bước thanh toán khi đủ điều kiện.</p>

                        <!-- Conditions -->
                        <div class="mb-5 grid grid-cols-2 gap-2 text-[11px] text-text-muted font-display">
                            <div class="rounded-lg bg-background-light px-3 py-2">
                                <span class="block text-[9px] uppercase tracking-wider text-text-muted">Tối thiểu</span>
                                <span class="mt-0.5 block truncate font-semibold text-fashion-black">{{ formatPrice(v.min_order_value) }}</span>
                            </div>
                            <div class="rounded-lg bg-background-light px-3 py-2">
                                <span class="block text-[9px] uppercase tracking-wider text-text-muted">Hạn dùng</span>
                                <span class="mt-0.5 block font-semibold text-fashion-black">{{ new Date(v.end_date).toLocaleDateString('vi-VN') }}</span>
                            </div>
                            <div v-if="v.max_discount" class="rounded-lg bg-background-light px-3 py-2">
                                <span class="block text-[9px] uppercase tracking-wider text-text-muted">Tối đa</span>
                                <span class="mt-0.5 block truncate font-semibold text-fashion-black">{{ formatPrice(v.max_discount) }}</span>
                            </div>
                            <div class="rounded-lg bg-background-light px-3 py-2">
                                <span class="block text-[9px] uppercase tracking-wider text-text-muted">Lượt dùng</span>
                                <span class="mt-0.5 block font-semibold text-fashion-black">{{ v.usage_per_user }} lần/người</span>
                            </div>
                        </div>

                        <!-- Badge hạng yêu cầu -->
                        <div v-if="v.required_tier" class="mb-4">
                            <span :class="[
                                'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border',
                                `${TIER_CONFIG[v.required_tier].color} ${TIER_CONFIG[v.required_tier].bg} ${TIER_CONFIG[v.required_tier].border}`
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
                            class="w-full py-3 rounded-lg text-[10px] uppercase tracking-[0.2em] font-bold border border-border-light text-text-muted text-center cursor-not-allowed opacity-70 flex items-center justify-center gap-2 font-display">
                            <span class="material-symbols-outlined text-[15px]">lock</span>
                            Nâng hạng để mở khóa
                        </div>

                        <!-- Đã dùng hết -->
                        <div v-else-if="getStatus(v) === 'used_up'"
                            class="w-full py-3 rounded-lg text-[10px] uppercase tracking-[0.2em] font-bold border border-border-light text-text-muted text-center opacity-60 cursor-not-allowed font-display">
                            Đã sử dụng
                        </div>

                        <!-- Đã lưu, chưa dùng -->
                        <button v-else-if="getStatus(v) === 'claimed'"
                            @click="claimVoucher(v)"
                            :class="[
                                'w-full rounded-lg py-3 text-[10px] uppercase tracking-[0.2em] font-bold border transition-all flex items-center justify-center gap-2 font-display',
                                'border-emerald-600 text-emerald-700 bg-emerald-50/60'
                            ]">
                            <span class="material-symbols-outlined text-[16px]" style="font-variation-settings:'FILL' 1">bookmark</span>
                            Đã lưu · Dùng khi thanh toán
                        </button>

                        <!-- Chưa lưu / guest -->
                        <button v-else
                            @click="claimVoucher(v)"
                            :disabled="claimingId === v.voucher_id"
                            :class="[
                                'w-full rounded-lg py-3 text-[10px] uppercase tracking-[0.2em] font-bold border transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2 font-display',
                                'border-fashion-black text-fashion-black hover:bg-fashion-black hover:text-white'
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

        <!-- Survey Modal -->
        <SurveyModal 
            v-if="showSurveyModal && activeSurveyDetail" 
            :show="showSurveyModal" 
            :survey="activeSurveyDetail"
            :order-id="surveyOrderId || 0"
            @close="showSurveyModal = false"
            @success="onSurveySuccess"
        />
    </div>
</template>
