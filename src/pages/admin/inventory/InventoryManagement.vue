<script setup lang="ts">
import AdjustStockDrawer from './components/AdjustStockDrawer.vue'
import InventoryHeader from './components/InventoryHeader.vue'
import InventoryLogsTable from './components/InventoryLogsTable.vue'
import InventoryStats from './components/InventoryStats.vue'
import InventoryTabs from './components/InventoryTabs.vue'
import StockPagination from './components/StockPagination.vue'
import StockTable from './components/StockTable.vue'
import StockToolbar from './components/StockToolbar.vue'
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
            <StockToolbar
                v-model:search-query="searchQuery"
                v-model:filter-stock="filterStock"
            />

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <StockTable
                    :items="filteredStock"
                    :is-loading="isLoading"
                    @adjust="openAdjustDrawer"
                />

                <StockPagination
                    :current-page="currentPage"
                    :total-pages="totalPages"
                    :visible-count="filteredStock.length"
                    :total-items="totalItems"
                    @change="handlePageChange"
                />
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
