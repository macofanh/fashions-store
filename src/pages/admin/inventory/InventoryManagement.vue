<script setup lang="ts">
import AdjustStockDrawer from './components/AdjustStockDrawer.vue'
import InventoryHeader from './components/InventoryHeader.vue'
import InventoryLogsTable from './components/InventoryLogsTable.vue'
import InventoryStats from './components/InventoryStats.vue'
import InventoryTabs from './components/InventoryTabs.vue'
import { useInventoryManagement } from './inventoryHandler'

const {
    activeTab,
    logs,
    isLoading,
    isDrawerOpen,
    isSubmitting,
    searchQuery,
    filterStock,
    currentPage,
    totalItems,
    totalPages,
    form,
    filteredStock,
    stockStats,
    handleSearch,
    handlePageChange,
    handleTabChange,
    selectStockFilter,
    openAdjustDrawer,
    handleAdjustStock,
    formatDateTime,
    changeTypeConfig,
} = useInventoryManagement()
</script>

<template>
    <div class="space-y-6">
        <InventoryHeader @adjust="openAdjustDrawer()" />

        <InventoryStats
            :stats="stockStats"
            @filter="selectStockFilter"
        />

        <InventoryTabs
            :active-tab="activeTab"
            @change="handleTabChange"
        />

        <template v-if="activeTab === 'stock'">
            <!-- Filter bar -->
            <div class="flex flex-wrap gap-3 items-center">
                <div class="relative flex-grow min-w-[200px] max-w-sm">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
                    <input v-model="searchQuery" @input="handleSearch" type="text" placeholder="Tìm sản phẩm, SKU..."
                        class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white transition-all" />
                </div>
                <div class="flex gap-2">
                    <button v-for="f in [{ v: 'all', l: 'Tất cả' }, { v: 'low', l: 'Sắp hết' }, { v: 'out', l: 'Hết hàng' }]" :key="f.v"
                        @click="filterStock = f.v as any"
                        :class="['px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all',
                            filterStock === f.v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50']"
                    >{{ f.l }}</button>
                </div>
            </div>

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
                            <tr v-for="item in filteredStock" :key="item.variant_id" class="hover:bg-slate-50/60 transition-colors">
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
                                    <button @click="openAdjustDrawer(item)" class="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 ml-auto">
                                        <span class="material-symbols-outlined text-[14px]">edit</span>
                                        Điều chỉnh
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Pagination -->
            <div v-if="totalPages > 1" class="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white rounded-b-2xl shadow-sm border-x border-b">
                <p class="text-xs text-slate-500">
                    Hiển thị <span class="font-semibold text-slate-900">{{ filteredStock.length }}</span> / {{ totalItems }} biến thể
                </p>
                <div class="flex items-center gap-1">
                    <button 
                        @click="handlePageChange(currentPage - 1)" 
                        :disabled="currentPage === 1"
                        class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
                    >
                        <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    
                    <div class="flex items-center gap-1 mx-2">
                        <button 
                            v-for="page in totalPages" 
                            :key="page"
                            @click="handlePageChange(page)"
                            :class="['w-8 h-8 rounded-lg text-xs font-semibold transition-all', 
                                currentPage === page ? 'bg-slate-900 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-100']"
                        >
                            {{ page }}
                        </button>
                    </div>

                    <button 
                        @click="handlePageChange(currentPage + 1)" 
                        :disabled="currentPage === totalPages"
                        class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
                    >
                        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </template>

        <InventoryLogsTable
            v-if="activeTab === 'logs'"
            :logs="logs"
            :is-loading="isLoading"
            :change-type-config="changeTypeConfig"
            :format-date-time="formatDateTime"
        />

        <AdjustStockDrawer
            v-model:is-open="isDrawerOpen"
            v-model:form="form"
            :is-submitting="isSubmitting"
            @submit="handleAdjustStock"
        />
    </div>
</template>
