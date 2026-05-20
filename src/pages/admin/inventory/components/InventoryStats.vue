<script setup lang="ts">
import type { StockFilter, StockStats } from '../inventory.types'

defineProps<{
    stats: StockStats
}>()

defineEmits<{
    filter: [value: StockFilter]
}>()
</script>

<template>
    <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
            <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                <span class="material-symbols-outlined text-slate-600 text-[20px]">inventory_2</span>
            </div>
            <div>
                <p class="text-2xl font-bold text-slate-900">{{ stats.total }}</p>
                <p class="text-xs text-slate-500">Tổng biến thể</p>
            </div>
        </div>
        <button
            @click="$emit('filter', 'low')"
            class="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm flex items-center gap-4 text-left hover:border-amber-400 transition-colors"
        >
            <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                <span class="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
            </div>
            <div>
                <p class="text-2xl font-bold text-amber-600">{{ stats.low }}</p>
                <p class="text-xs text-slate-500">Sắp hết hàng</p>
            </div>
        </button>
        <button
            @click="$emit('filter', 'out')"
            class="bg-white rounded-2xl border border-red-200 p-5 shadow-sm flex items-center gap-4 text-left hover:border-red-400 transition-colors"
        >
            <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                <span class="material-symbols-outlined text-red-500 text-[20px]">remove_shopping_cart</span>
            </div>
            <div>
                <p class="text-2xl font-bold text-red-500">{{ stats.out }}</p>
                <p class="text-xs text-slate-500">Hết hàng</p>
            </div>
        </button>
    </div>
</template>
