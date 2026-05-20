<script setup lang="ts">
import type { StockFilter } from '../inventory.types'

const searchQuery = defineModel<string>('searchQuery', { required: true })
const filterStock = defineModel<StockFilter>('filterStock', { required: true })

const filters: Array<{ value: StockFilter; label: string }> = [
    { value: 'all', label: 'Tất cả' },
    { value: 'low', label: 'Sắp hết' },
    { value: 'out', label: 'Hết hàng' },
]
</script>

<template>
    <div class="flex flex-wrap gap-3 items-center">
        <div class="relative flex-grow min-w-[200px] max-w-sm">
            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
            <input
                v-model="searchQuery"
                type="text"
                placeholder="Tìm sản phẩm, SKU..."
                class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white transition-all"
            />
        </div>
        <div class="flex gap-2">
            <button
                v-for="filter in filters"
                :key="filter.value"
                @click="filterStock = filter.value"
                :class="[
                    'px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all',
                    filterStock === filter.value
                        ? 'bg-slate-900 text-white'
                        : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50',
                ]"
            >
                {{ filter.label }}
            </button>
        </div>
    </div>
</template>
