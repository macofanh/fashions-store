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
</script>

<template>
    <!-- Loading skeleton -->
    <div v-if="isLoading" class="border border-zinc-100 p-6 animate-pulse space-y-4">
        <div class="h-4 bg-zinc-100 rounded w-1/3"></div>
        <div class="h-8 bg-zinc-100 rounded w-1/2"></div>
        <div class="h-2 bg-zinc-100 rounded w-full"></div>
    </div>

    <!-- Card -->
    <div v-else :class="['border p-6 space-y-5 transition-all', tier.borderColor, tier.bgColor]">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <p class="text-[9px] uppercase tracking-[0.3em] font-bold text-zinc-400">Hạng thành viên</p>
            <span :class="['inline-flex items-center gap-1.5 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white rounded-full', tier.badgeColor]">
                <span class="material-symbols-outlined text-[13px]">{{ tier.icon }}</span>
                {{ tier.label }}
            </span>
        </div>

        <!-- Points -->
        <div>
            <p :class="['text-3xl font-bold tabular-nums', tier.color]">
                {{ totalPoints.toLocaleString('vi-VN') }}
                <span class="text-sm font-normal text-zinc-400 ml-1">điểm</span>
            </p>
        </div>

        <!-- Progress to next tier -->
        <div v-if="nextTier" class="space-y-2">
            <div class="flex justify-between items-center">
                <p class="text-[10px] text-zinc-400">
                    Còn <span class="font-bold text-zinc-600">{{ pointsToNext.toLocaleString('vi-VN') }} điểm</span> để lên <span :class="['font-bold', nextTier.color]">{{ nextTier.label }}</span>
                </p>
                <p class="text-[10px] text-zinc-400">{{ progressPercent }}%</p>
            </div>
            <div class="h-1.5 bg-zinc-200 rounded-full overflow-hidden">
                <div
                    :class="['h-full rounded-full bg-gradient-to-r transition-all duration-700', tier.gradient]"
                    :style="{ width: `${progressPercent}%` }"
                ></div>
            </div>
            <div class="flex justify-between text-[9px] text-zinc-300 uppercase tracking-widest">
                <span>{{ tier.label }}</span>
                <span>{{ nextTier.label }}</span>
            </div>
        </div>

        <!-- Max tier -->
        <div v-else class="flex items-center gap-2 text-[10px] text-zinc-400">
            <span class="material-symbols-outlined text-[14px]">verified</span>
            Bạn đang ở hạng cao nhất
        </div>

        <!-- All tiers legend -->
        <div class="pt-2 border-t border-zinc-200/60 flex items-center gap-3 flex-wrap">
            <div
                v-for="t in MEMBERSHIP_TIERS.slice().reverse()"
                :key="t.key"
                :class="['flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider', tier.key === t.key ? t.color : 'text-zinc-300']"
            >
                <span class="material-symbols-outlined text-[12px]">{{ t.icon }}</span>
                {{ t.label }}
            </div>
        </div>
    </div>
</template>
