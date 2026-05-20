<script setup lang="ts">
import type { VariantStock } from '../inventory.types'

defineProps<{
    items: VariantStock[]
    isLoading: boolean
}>()

defineEmits<{
    adjust: [value: VariantStock]
}>()
</script>

<template>
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="border-b border-slate-100 bg-slate-50/60">
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Sản phẩm</th>
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 hidden sm:table-cell">Phân loại</th>
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-center">Tồn kho</th>
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-center hidden md:table-cell">Trạng thái</th>
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr v-if="isLoading">
                        <td colspan="5" class="py-20 text-center">
                            <div class="animate-spin h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto"></div>
                        </td>
                    </tr>
                    <tr v-else-if="items.length === 0">
                        <td colspan="5" class="py-16 text-center text-sm text-slate-400">Không có biến thể phù hợp</td>
                    </tr>
                    <tr
                        v-for="item in items"
                        v-else
                        :key="item.variant_id"
                        class="hover:bg-slate-50/60 transition-colors"
                    >
                        <td class="px-6 py-4">
                            <div class="flex items-center gap-3">
                                <div class="w-10 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                    <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover" />
                                    <div v-else class="w-full h-full flex items-center justify-center">
                                        <span class="material-symbols-outlined text-slate-300 text-lg">image</span>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm font-semibold text-slate-800 line-clamp-1">{{ item.product_name }}</p>
                                    <p class="text-xs text-slate-400 mt-0.5">SKU: {{ item.sku }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-6 py-4 hidden sm:table-cell">
                            <div class="flex gap-1.5 flex-wrap">
                                <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">{{ item.color_name }}</span>
                                <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">{{ item.size_name }}</span>
                            </div>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span :class="['text-lg font-bold', item.stock_qty <= 0 ? 'text-red-500' : item.stock_qty <= item.low_stock_threshold ? 'text-amber-500' : 'text-slate-800']">
                                {{ item.stock_qty }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center hidden md:table-cell">
                            <span v-if="item.stock_qty <= 0" class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-semibold rounded-full">
                                <span class="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Hết hàng
                            </span>
                            <span v-else-if="item.stock_qty <= item.low_stock_threshold" class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded-full">
                                <span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Sắp hết
                            </span>
                            <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-full">
                                <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Ổn định
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right">
                            <button
                                @click="$emit('adjust', item)"
                                class="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 ml-auto"
                            >
                                <span class="material-symbols-outlined text-[14px]">edit</span>
                                Điều chỉnh
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
