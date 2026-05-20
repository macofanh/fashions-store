<script setup lang="ts">
import type { InventoryTab } from '../inventory.types'

defineProps<{
    activeTab: InventoryTab
}>()

defineEmits<{
    change: [value: InventoryTab]
}>()

const tabs: Array<{ value: InventoryTab; label: string; icon: string }> = [
    { value: 'stock', label: 'Tồn kho', icon: 'inventory' },
    { value: 'logs', label: 'Lịch sử', icon: 'history' },
]
</script>

<template>
    <div class="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        <button
            v-for="tab in tabs"
            :key="tab.value"
            @click="$emit('change', tab.value)"
            :class="[
                'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                activeTab === tab.value
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-700',
            ]"
        >
            <span class="material-symbols-outlined text-[16px]">{{ tab.icon }}</span>
            {{ tab.label }}
        </button>
    </div>
</template>
