<script setup lang="ts">
import type { Voucher } from '@/pages/promotions/promotionService'

const props = defineProps<{
    vouchers:   Voucher[]
    claimedIds: Set<number>
    claimingId: number | null
}>()

const emit = defineEmits<{
    claim: [voucher: Voucher]
}>()

const formatDiscount = (v: Voucher) => {
    if (v.discount_type === 'PERCENT')      return `Giảm ${v.discount_value}%`
    if (v.discount_type === 'FIXED_AMOUNT') return `Giảm ${new Intl.NumberFormat('vi-VN').format(Number(v.discount_value))}₫`
    if (v.discount_type === 'FREE_SHIP')    return 'Miễn phí vận chuyển'
    return ''
}
</script>

<template>
    <div class="bg-primary overflow-hidden py-3 relative">
        <!-- Fade edges -->
        <div class="absolute left-0 inset-y-0 w-16 bg-gradient-to-r from-primary to-transparent z-10 pointer-events-none"></div>
        <div class="absolute right-0 inset-y-0 w-16 bg-gradient-to-l from-primary to-transparent z-10 pointer-events-none"></div>

        <!-- Track nhân đôi để loop liền mạch -->
        <div class="ticker-track flex items-center whitespace-nowrap">
            <template v-for="n in 2" :key="n">
                <template v-for="v in vouchers" :key="`${n}-${v.voucher_id}`">
                    <button
                        @click="emit('claim', v)"
                        :disabled="claimingId === v.voucher_id"
                        class="inline-flex items-center gap-2.5 px-8 text-white hover:text-white/80 transition-colors shrink-0 cursor-pointer disabled:opacity-60"
                    >
                        <span
                            class="material-symbols-outlined text-[13px] text-white/60"
                            style="font-variation-settings:'FILL' 1"
                        >local_offer</span>
                        <span class="text-[11px] font-bold uppercase tracking-widest font-display">
                            {{ formatDiscount(v) }}
                        </span>
                        <span class="text-[10px] text-white/70 font-display">{{ v.name }}</span>
                        <span class="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full tracking-widest font-display">
                            {{ v.code }}
                        </span>
                        <span
                            v-if="claimedIds.has(v.voucher_id)"
                            class="material-symbols-outlined text-[13px] text-white/80"
                            style="font-variation-settings:'FILL' 1"
                        >check_circle</span>
                        <span
                            v-else-if="claimingId === v.voucher_id"
                            class="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full inline-block"
                        ></span>
                    </button>
                    <span class="text-white/20 shrink-0 select-none px-2">✦</span>
                </template>
            </template>
        </div>
    </div>
</template>

<style scoped>
.ticker-track {
    animation: ticker-scroll 28s linear infinite;
    will-change: transform;
}
.ticker-track:hover { animation-play-state: paused; }
@keyframes ticker-scroll {
    from { transform: translateX(0); }
    to   { transform: translateX(-50%); }
}
</style>
