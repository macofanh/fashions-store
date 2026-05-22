<script setup lang="ts">
import type { ChangeTypeDisplay, InventoryLog } from '../inventory.types'

defineProps<{
    logs: InventoryLog[]
    isLoading: boolean
    changeTypeConfig: Record<string, ChangeTypeDisplay>
    formatDateTime: (value: string) => string
}>()
</script>

<template>
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
            <table class="w-full text-left">
                <thead>
                    <tr class="border-b border-slate-100 bg-slate-50/60">
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Thời gian</th>
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Loại</th>
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-center">Biến số</th>
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-right">Tồn cuối</th>
                        <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 hidden md:table-cell">Ghi chú</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-100">
                    <tr v-if="isLoading">
                        <td colspan="5" class="py-20 text-center">
                            <div class="animate-spin h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto"></div>
                        </td>
                    </tr>
                    <tr v-else-if="logs.length === 0">
                        <td colspan="5" class="py-16 text-center text-sm text-slate-400">Chưa có lịch sử kho</td>
                    </tr>
                    <tr
                        v-for="log in logs"
                        v-else
                        :key="log.log_id"
                        class="hover:bg-slate-50/60 transition-colors"
                    >
                        <td class="px-6 py-4 text-sm text-slate-500">{{ formatDateTime(log.created_at) }}</td>
                        <td class="px-6 py-4">
                            <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold', changeTypeConfig[log.change_type]?.bg, changeTypeConfig[log.change_type]?.text]">
                                {{ changeTypeConfig[log.change_type]?.label || log.change_type }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-center">
                            <span :class="['text-sm font-bold', log.quantity > 0 ? 'text-emerald-600' : 'text-red-500']">
                                {{ log.quantity > 0 ? '+' : '' }}{{ log.quantity }}
                            </span>
                        </td>
                        <td class="px-6 py-4 text-right font-bold text-slate-800">{{ log.stock_after }}</td>
                        <td class="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">{{ log.note || '-' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
