<script setup lang="ts">
import { computed } from 'vue'
import { MEMBERSHIP_TIERS, getTierByPoints, getNextTier } from '../membershipService'

const props = defineProps<{
    totalPoints: number
    isLoading?: boolean
}>()

const tier = computed(() => getTierByPoints(props.totalPoints))
const nextTier = computed(() => getNextTier(props.totalPoints))

const progressPercent = computed(() => {
    if (!nextTier.value) return 100
    const current = tier.value
    const range = nextTier.value.minPoints - current.minPoints
    const earned = props.totalPoints - current.minPoints
    return Math.min(100, Math.round((earned / range) * 100))
})

const pointsToNext = computed(() =>
    nextTier.value ? nextTier.value.minPoints - props.totalPoints : 0
)

const tierTheme = computed(() => {
    switch (tier.value.key) {
        case 'diamond':
            return {
                bg: 'bg-white border border-border-light border-l-4 border-l-cyan-500 shadow-sm',
                text: 'text-fashion-black',
                subText: 'text-text-muted',
                badgeBg: 'bg-cyan-50 text-cyan-600 border border-cyan-200',
                progressBg: 'bg-cyan-50',
                progressBar: 'bg-cyan-500 shadow-[0_2px_8px_rgba(6,182,212,0.4)]',
                icon: 'diamond',
                iconColor: 'text-cyan-500',
                description: 'Đặc quyền thượng lưu, ưu tiên chăm sóc VIP 24/7 và vô vàn quà tặng độc quyền.'
            }
        case 'platinum':
            return {
                bg: 'bg-white border border-border-light border-l-4 border-l-slate-600 shadow-sm',
                text: 'text-fashion-black',
                subText: 'text-text-muted',
                badgeBg: 'bg-slate-50 text-slate-600 border border-slate-200',
                progressBg: 'bg-slate-100',
                progressBar: 'bg-slate-600 shadow-[0_2px_8px_rgba(71,85,105,0.4)]',
                icon: 'workspace_premium',
                iconColor: 'text-slate-600',
                description: 'Trải nghiệm dịch vụ đẳng cấp, hỗ trợ ưu tiên cùng quà tặng sinh nhật đặc biệt.'
            }
        case 'gold':
            return {
                bg: 'bg-white border border-border-light border-l-4 border-l-amber-500 shadow-sm',
                text: 'text-fashion-black',
                subText: 'text-text-muted',
                badgeBg: 'bg-amber-50 text-amber-600 border border-amber-200',
                progressBg: 'bg-amber-50',
                progressBar: 'bg-amber-500 shadow-[0_2px_8px_rgba(245,158,11,0.4)]',
                icon: 'star',
                iconColor: 'text-amber-500',
                description: 'Tận hưởng ưu đãi giảm giá tốt hơn và nhận quà tri ân dịp lễ tết.'
            }
        case 'silver':
            return {
                bg: 'bg-white border border-border-light border-l-4 border-l-zinc-400 shadow-sm',
                text: 'text-fashion-black',
                subText: 'text-text-muted',
                badgeBg: 'bg-zinc-50 text-zinc-600 border border-zinc-200',
                progressBg: 'bg-zinc-100',
                progressBar: 'bg-zinc-400 shadow-[0_2px_8px_rgba(161,161,170,0.4)]',
                icon: 'military_tech',
                iconColor: 'text-zinc-500',
                description: 'Nhận thêm điểm thưởng khi mua hàng cùng nhiều chương trình ưu đãi thành viên.'
            }
        case 'bronze':
        default:
            return {
                bg: 'bg-white border border-border-light border-l-4 border-l-orange-700 shadow-sm',
                text: 'text-fashion-black',
                subText: 'text-text-muted',
                badgeBg: 'bg-orange-50 text-orange-700 border border-orange-200',
                progressBg: 'bg-orange-50',
                progressBar: 'bg-orange-700 shadow-[0_2px_8px_rgba(234,88,12,0.4)]',
                icon: 'shield',
                iconColor: 'text-orange-700',
                description: 'Tích lũy điểm khi mua sắm để thăng hạng thành viên cao hơn.'
            }
    }
})
</script>

<template>
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="border border-border-light rounded-2xl p-8 bg-white animate-pulse space-y-6 shadow-sm">
        <div class="flex justify-between items-center">
            <div class="h-4 bg-zinc-100 rounded w-1/4"></div>
            <div class="h-6 bg-zinc-100 rounded-full w-24"></div>
        </div>
        <div class="h-10 bg-zinc-100 rounded w-1/3"></div>
        <div class="space-y-2">
            <div class="h-3 bg-zinc-100 rounded w-full"></div>
            <div class="h-2 bg-zinc-100 rounded w-full"></div>
        </div>
    </div>

    <div v-else class="space-y-8">
        <!-- Premium Member Card -->
        <div :class="['relative overflow-hidden rounded-2xl p-8 transition-all duration-300 hover:shadow-md', tierTheme.bg]">
            <div class="relative z-10 space-y-6">
                <!-- Header -->
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-[10px] uppercase tracking-[0.2em] font-bold text-text-muted font-display">Thẻ thành viên</p>
                    </div>
                    <span :class="['inline-flex items-center gap-1.5 px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-full font-display shadow-sm', tierTheme.badgeBg]">
                        <span class="material-symbols-outlined text-[14px]">{{ tierTheme.icon }}</span>
                        {{ tier.label }}
                    </span>
                </div>

                <!-- Points info -->
                <div class="pt-2 flex justify-between items-end">
                    <div>
                        <p class="text-[9px] uppercase tracking-wider text-text-muted font-display mb-1">Điểm tích lũy hiện tại</p>
                        <h2 class="text-4xl font-extrabold tracking-tight tabular-nums flex items-baseline font-display text-fashion-black">
                            {{ totalPoints.toLocaleString('vi-VN') }}
                            <span class="text-xs font-normal text-text-muted ml-1.5 font-display">điểm</span>
                        </h2>
                    </div>
                    
                    <span :class="['material-symbols-outlined text-5xl opacity-10 rotate-12 select-none', tierTheme.iconColor]">{{ tierTheme.icon }}</span>
                </div>

                <p class="text-xs font-display text-text-muted leading-relaxed italic border-t border-border-light pt-4">
                    "{{ tierTheme.description }}"
                </p>

                <!-- Progress Section -->
                <div v-if="nextTier" class="space-y-2.5 pt-2">
                    <div class="flex justify-between items-center text-xs">
                        <p class="text-text-muted font-medium">
                            Còn <span class="font-bold text-fashion-black underline">{{ pointsToNext.toLocaleString('vi-VN') }} điểm</span> để thăng hạng <span :class="['font-bold', tierTheme.iconColor]">{{ nextTier.label }}</span>
                        </p>
                        <span class="font-bold text-fashion-black text-xs">{{ progressPercent }}%</span>
                    </div>
                    
                    <div :class="['h-2 rounded-full overflow-hidden', tierTheme.progressBg]">
                        <div
                            :class="['h-full rounded-full transition-all duration-1000 ease-out', tierTheme.progressBar]"
                            :style="{ width: `${progressPercent}%` }"
                        ></div>
                    </div>
                    
                    <div class="flex justify-between text-[9px] uppercase tracking-widest font-bold font-display text-zinc-400">
                        <span>{{ tier.label }} ({{ tier.minPoints }})</span>
                        <span>{{ nextTier.label }} ({{ nextTier.minPoints }})</span>
                    </div>
                </div>

                <!-- Max tier -->
                <div v-else class="flex items-center gap-2 text-xs font-medium pt-4 border-t border-border-light text-text-muted">
                    <span :class="['material-symbols-outlined text-[18px]', tierTheme.iconColor]">verified_user</span>
                    Chúc mừng! Bạn đã đạt hạng thành viên cao nhất của LUXU
                </div>
            </div>
            
            <!-- Background luxury graphics decoration -->
            <div class="absolute -right-16 -bottom-16 w-48 h-48 rounded-full bg-zinc-50 blur-3xl z-0 pointer-events-none"></div>
        </div>

        <!-- All tiers guide/legend -->
        <div class="bg-white border border-border-light rounded-2xl p-6 shadow-sm space-y-4">
            <h3 class="text-xs font-bold uppercase tracking-wider text-fashion-black font-display pb-3 border-b border-border-light flex items-center gap-2">
                <span class="material-symbols-outlined text-[18px] text-primary">info</span>
                Lộ trình thăng hạng thành viên
            </h3>
            
            <div class="divide-y divide-border-light">
                <div
                    v-for="t in MEMBERSHIP_TIERS"
                    :key="t.key"
                    :class="['py-3.5 flex items-center justify-between transition-colors', tier.key === t.key ? 'bg-primary-light/10 -mx-6 px-6 font-semibold' : '']"
                >
                    <div class="flex items-center gap-3">
                        <span :class="[
                            'w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm', 
                            t.key === 'diamond' ? 'bg-[#06b6d4]' :
                            t.key === 'platinum' ? 'bg-[#475569]' :
                            t.key === 'gold' ? 'bg-[#f59e0b]' :
                            t.key === 'silver' ? 'bg-[#a1a1aa]' : 'bg-[#c2410c]'
                        ]">
                            <span class="material-symbols-outlined text-[16px]">{{ t.icon }}</span>
                        </span>
                        <div>
                            <span class="text-sm text-fashion-black font-display">{{ t.label }}</span>
                            <span v-if="tier.key === t.key" class="ml-2 text-[9px] uppercase tracking-wider font-bold text-primary bg-primary-light px-2 py-0.5 rounded-full">Hiện tại</span>
                        </div>
                    </div>
                    
                    <div class="text-right">
                        <span class="text-xs text-text-muted font-display font-medium">Từ {{ t.minPoints.toLocaleString('vi-VN') }} điểm</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
