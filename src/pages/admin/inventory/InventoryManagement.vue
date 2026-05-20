<script setup lang="ts">
import AdjustStockDrawer from './components/AdjustStockDrawer.vue'
import InventoryHeader from './components/InventoryHeader.vue'
import InventoryLogsTable from './components/InventoryLogsTable.vue'
import InventoryStats from './components/InventoryStats.vue'
import InventoryTabs from './components/InventoryTabs.vue'
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
    form,
    filteredStock,
    stockStats,
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

            <StockTable
                :items="filteredStock"
                :is-loading="isLoading"
                @adjust="openAdjustDrawer"
            />
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
