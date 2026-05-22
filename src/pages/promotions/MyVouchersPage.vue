<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { promotionService, type UserVoucher } from '@/pages/promotions/promotionService'
import { useUIStore } from '@/stores/useUIStore'

const router = useRouter()
const uiStore = useUIStore()

const vouchers = ref<UserVoucher[]>([])
const isLoading = ref(true)

const formatPrice = (price: number | string) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(price))

const getDiscountLabel = (uv: UserVoucher) => {
    const v = uv.voucher
    if (v.discount_type === 'PERCENT') return `-${v.discount_value}%`
    if (v.discount_type === 'FIXED_AMOUNT') return `-${formatPrice(v.discount_value)}`
    if (v.discount_type === 'FREE_SHIP') return 'Free ship'
    return ''
}

const isExpired = (uv: UserVoucher) => new Date(uv.voucher.end_date).getTime() < Date.now()
const isUsedUp = (uv: UserVoucher) => uv.used_count >= (uv.voucher.usage_per_user ?? 1)
const isUsable = (uv: UserVoucher) => uv.voucher.is_active && !isExpired(uv) && !isUsedUp(uv)

const usableVouchers = computed(() => vouchers.value.filter(isUsable))
const inactiveVouchers = computed(() => vouchers.value.filter(uv => !isUsable(uv)))

const DEFAULT_COLORS = ['#17b0cf', '#0e191b', '#4e8b97', '#e7f1f3', '#f5f5f0']
const getCardBg = (uv: UserVoucher, idx: number) =>
    uv.voucher.bg_color || DEFAULT_COLORS[idx % DEFAULT_COLORS.length] || '#17b0cf'

const isLightColor = (hex: string) => {
    const c = hex.replace('#', '')
    const r = parseInt(c.substring(0, 2), 16)
    const g = parseInt(c.substring(2, 4), 16)
    const b = parseInt(c.substring(4, 6), 16)
    return (r * 299 + g * 587 + b * 114) / 1000 > 128
}

const fetchMyVouchers = async () => {
    isLoading.value = true
    try {
        const response = await promotionService.getMyVouchers()
        vouchers.value = response.data.sort((a, b) =>
            new Date(a.voucher.end_date).getTime() - new Date(b.voucher.end_date).getTime()
        )
    } catch (error: any) {
        uiStore.error(error.response?.data?.detail || 'Không thể tải voucher của bạn.')
    } finally {
        isLoading.value = false
    }
}

const useVoucher = (uv: UserVoucher) => {
    if (!isUsable(uv)) return
    router.push({ name: 'checkout', query: { voucher_id: uv.voucher_id } })
}

onMounted(fetchMyVouchers)
</script>

<template>
    <div class="min-h-screen bg-background-light pb-24">
        <section class="border-b border-border-light bg-white">
            <div class="mx-auto max-w-[1400px] px-6 py-5 md:px-12">
                <nav class="mb-4 flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted font-display">
                    <router-link to="/" class="transition-colors hover:text-primary">Trang chủ</router-link>
                    <span>/</span>
                    <span class="text-fashion-black">Voucher của tôi</span>
                </nav>

                <div class="flex flex-wrap items-center justify-start gap-3 md:justify-center">
                    <div class="inline-flex items-center gap-2 rounded-lg border border-border-light bg-background-light px-4 py-3 text-xs font-semibold text-fashion-black font-display">
                        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white text-primary shadow-sm">
                            <span class="material-symbols-outlined text-[16px]">local_offer</span>
                        </span>
                        <span>{{ usableVouchers.length }} voucher khả dụng</span>
                    </div>

                    <div class="inline-flex items-center gap-2 rounded-lg border border-border-light bg-background-light px-4 py-3 text-xs font-semibold text-fashion-black font-display">
                        <span class="flex h-7 w-7 items-center justify-center rounded-full bg-white text-text-muted shadow-sm">
                            <span class="material-symbols-outlined text-[16px]">history</span>
                        </span>
                        <span>{{ inactiveVouchers.length }} đã dùng / hết hạn</span>
                    </div>

                    <router-link
                        to="/vouchers"
                        class="inline-flex items-center justify-center gap-2 rounded-lg bg-fashion-black px-4 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-primary font-display"
                    >
                        <span class="material-symbols-outlined text-[16px]">add_card</span>
                        Lấy thêm voucher
                    </router-link>
                </div>
            </div>
        </section>

        <div class="mx-auto max-w-[1400px] px-6 py-10 md:px-12">
            <div v-if="isLoading" class="flex justify-center py-24">
                <div class="h-9 w-9 animate-spin rounded-full border-2 border-primary border-t-transparent"></div>
            </div>

            <div v-else-if="vouchers.length === 0" class="rounded-xl border border-dashed border-border-light bg-white px-6 py-16 text-center">
                <span class="material-symbols-outlined mb-4 text-4xl text-text-muted">local_offer</span>
                <h2 class="text-xl font-serif italic text-fashion-black">Bạn chưa lưu voucher nào</h2>
                <p class="mx-auto mt-2 max-w-md text-sm text-text-muted font-display">
                    Vào kho ưu đãi để lưu voucher trước, sau đó chúng sẽ xuất hiện tại đây.
                </p>
                <router-link
                    to="/vouchers"
                    class="mt-6 inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-xs font-bold uppercase tracking-widest text-white transition-colors hover:bg-primary-dark font-display"
                >
                    Khám phá ưu đãi
                </router-link>
            </div>

            <template v-else>
                <div class="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <article
                        v-for="(uv, idx) in vouchers"
                        :key="uv.id"
                        class="relative overflow-hidden rounded-xl border bg-white shadow-sm transition-all"
                        :class="isUsable(uv) ? 'border-border-light hover:-translate-y-0.5 hover:shadow-md' : 'border-border-light opacity-70'"
                    >
                        <span
                            class="absolute right-4 top-4 z-10 rounded-full px-3 py-1 text-[9px] font-bold uppercase tracking-wider"
                            :class="isUsable(uv) ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-text-muted'"
                        >
                            {{ isUsable(uv) ? 'Khả dụng' : isExpired(uv) ? 'Hết hạn' : 'Đã dùng' }}
                        </span>

                        <div
                            class="h-2 w-full"
                            :style="{ backgroundColor: getCardBg(uv, idx) }"
                        ></div>

                        <div class="p-5">
                            <div class="mb-4 flex items-start gap-4">
                                <div
                                    class="flex h-20 w-24 shrink-0 flex-col items-center justify-center rounded-lg text-center"
                                    :style="{ backgroundColor: getCardBg(uv, idx) }"
                                    :class="isLightColor(getCardBg(uv, idx)) ? 'text-fashion-black' : 'text-white'"
                                >
                                    <span class="text-2xl font-serif italic font-bold leading-none">{{ getDiscountLabel(uv) }}</span>
                                    <span class="mt-1 text-[9px] uppercase tracking-widest opacity-70">Saved</span>
                                </div>

                                <div class="min-w-0 flex-1 pt-1">
                                    <span class="inline-flex max-w-full rounded-full border border-border-light bg-background-light px-3 py-1 text-[9px] font-bold uppercase tracking-widest text-fashion-black">
                                        {{ uv.voucher.code }}
                                    </span>
                                    <h3 class="mt-3 line-clamp-2 text-base font-bold leading-snug text-fashion-black font-display">{{ uv.voucher.name }}</h3>
                                </div>
                            </div>

                            <p v-if="uv.voucher.subtitle" class="mb-4 min-h-10 text-[12px] text-text-muted font-display leading-relaxed">{{ uv.voucher.subtitle }}</p>
                            <p v-else class="mb-4 min-h-10 text-[12px] text-text-muted font-display leading-relaxed">Voucher đã lưu trong tài khoản của bạn.</p>

                            <div class="mb-5 grid grid-cols-2 gap-2 text-[11px] text-text-muted font-display">
                                <div class="rounded-lg bg-background-light px-3 py-2">
                                    <span class="block text-[9px] uppercase tracking-wider text-text-muted">Tối thiểu</span>
                                    <span class="mt-0.5 block truncate font-semibold text-fashion-black">{{ formatPrice(uv.voucher.min_order_value) }}</span>
                                </div>
                                <div class="rounded-lg bg-background-light px-3 py-2">
                                    <span class="block text-[9px] uppercase tracking-wider text-text-muted">Hạn dùng</span>
                                    <span class="mt-0.5 block font-semibold text-fashion-black">{{ new Date(uv.voucher.end_date).toLocaleDateString('vi-VN') }}</span>
                                </div>
                                <div v-if="uv.voucher.max_discount" class="rounded-lg bg-background-light px-3 py-2">
                                    <span class="block text-[9px] uppercase tracking-wider text-text-muted">Tối đa</span>
                                    <span class="mt-0.5 block truncate font-semibold text-fashion-black">{{ formatPrice(uv.voucher.max_discount) }}</span>
                                </div>
                                <div class="rounded-lg bg-background-light px-3 py-2">
                                    <span class="block text-[9px] uppercase tracking-wider text-text-muted">Đã dùng</span>
                                    <span class="mt-0.5 block font-semibold text-fashion-black">{{ uv.used_count }}/{{ uv.voucher.usage_per_user }} lần</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                @click="useVoucher(uv)"
                                :disabled="!isUsable(uv)"
                                class="flex w-full items-center justify-center gap-2 rounded-lg border px-3 py-3 text-[10px] font-bold uppercase tracking-[0.2em] transition-colors disabled:cursor-not-allowed disabled:opacity-50 font-display"
                                :class="isUsable(uv)
                                    ? 'border-primary text-primary hover:bg-primary hover:text-white'
                                    : 'border-border-light text-text-muted'"
                            >
                                <span class="material-symbols-outlined text-[15px]">shopping_cart_checkout</span>
                                Dùng khi thanh toán
                            </button>
                        </div>
                    </article>
                </div>
            </template>
        </div>
    </div>
</template>
