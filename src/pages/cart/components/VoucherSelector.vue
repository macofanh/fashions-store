<script setup lang="ts">
import type { UserVoucher } from '@/pages/promotions/promotionService'

const props = defineProps<{
    vouchers: UserVoucher[]
    selected: UserVoucher | null
    subtotal: number
    formatPrice: (n: number) => string
}>()

const emit = defineEmits<{ toggle: [uv: UserVoucher] }>()

const getDiscountLabel = (v: UserVoucher['voucher']) => {
    if (v.discount_type === 'PERCENT')      return `-${v.discount_value}%`
    if (v.discount_type === 'FIXED_AMOUNT') return `-${props.formatPrice(Number(v.discount_value))}`
    if (v.discount_type === 'FREE_SHIP')    return 'Free ship'
    return ''
}
</script>

<template>
    <section class="bg-white border border-border-light rounded-xl p-6 md:p-8 space-y-5">
        <h2 class="text-sm font-bold uppercase tracking-widest text-fashion-black font-display flex items-center gap-2">
            <span class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">3</span>
            Mã giảm giá
        </h2>

        <div v-if="vouchers.length === 0" class="text-sm text-text-muted italic font-display">
            Bạn chưa có voucher nào.
            <router-link to="/vouchers" class="text-primary underline underline-offset-4 ml-1">Khám phá ưu đãi</router-link>
        </div>

        <div v-else class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div
                v-for="uv in vouchers"
                :key="uv.id"
                @click="emit('toggle', uv)"
                :class="[
                    'relative flex items-center gap-3 p-4 border-2 rounded-xl transition-all',
                    selected?.id === uv.id
                        ? 'border-primary bg-primary-light cursor-pointer'
                        : subtotal < Number(uv.voucher.min_order_value)
                            ? 'border-border-light opacity-50 cursor-not-allowed'
                            : 'border-border-light hover:border-primary/50 cursor-pointer bg-white'
                ]"
            >
                <!-- Radio visual -->
                <div :class="[
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0',
                    selected?.id === uv.id ? 'border-primary' : 'border-border-light'
                ]">
                    <div v-if="selected?.id === uv.id" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>

                <div class="flex-grow min-w-0">
                    <div class="flex items-center justify-between gap-2">
                        <span class="text-[10px] font-bold bg-fashion-black text-white px-2 py-0.5 rounded font-display">{{ uv.voucher.code }}</span>
                        <span :class="['text-sm font-bold font-display', selected?.id === uv.id ? 'text-primary' : 'text-fashion-black']">
                            {{ getDiscountLabel(uv.voucher) }}
                        </span>
                    </div>
                    <p class="text-[11px] text-fashion-black mt-1 font-display truncate">{{ uv.voucher.name }}</p>
                    <p class="text-[10px] text-text-muted font-display">Đơn tối thiểu {{ formatPrice(Number(uv.voucher.min_order_value)) }}</p>
                </div>

                <!-- Not eligible overlay -->
                <div v-if="subtotal < Number(uv.voucher.min_order_value)"
                    class="absolute inset-0 rounded-xl bg-white/60 flex items-center justify-center">
                    <span class="text-[9px] uppercase font-bold text-red-500 bg-white px-2 py-1 rounded shadow-sm font-display">Chưa đủ điều kiện</span>
                </div>
            </div>
        </div>
    </section>
</template>
