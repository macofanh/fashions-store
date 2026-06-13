<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    currentPage: number
    totalPages: number
    visibleCount: number
    totalItems: number
}>()

defineEmits<{
    change: [value: number]
}>()

const paginationItems = computed<(number | string)[]>(() => {
    const total = props.totalPages
    const current = props.currentPage
    if (total <= 7) {
        return Array.from({ length: total }, (_, index) => index + 1)
    }

    if (current <= 4) {
        return [1, 2, 3, 4, 5, '...', total]
    }

    if (current >= total - 3) {
        return [
            1,
            '...',
            total - 4,
            total - 3,
            total - 2,
            total - 1,
            total,
        ]
    }

    return [1, '...', current - 1, current, current + 1, '...', total]
})
</script>

<template>
    <div
        v-if="totalPages > 1"
        class="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-white"
    >
        <p class="text-xs text-slate-500">
            Hiển thị <span class="font-semibold text-slate-900">{{ visibleCount }}</span> / {{ totalItems }} biến thể
        </p>

        <div class="flex items-center gap-1.5">
            <button
                @click="$emit('change', currentPage - 1)"
                :disabled="currentPage === 1"
                class="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                title="Trang trước"
            >
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <div class="flex items-center gap-1 mx-1.5">
                <template v-for="(page, index) in paginationItems" :key="`${page}-${index}`">
                    <span
                        v-if="page === '...'"
                        class="w-8 h-8 inline-flex items-center justify-center text-xs text-slate-400"
                    >
                        ...
                    </span>
                    <button
                        v-else
                        @click="$emit('change', Number(page))"
                        :class="[
                            'w-8 h-8 rounded-lg text-xs font-semibold border transition-all',
                            currentPage === page
                                ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                                : 'border-slate-200 text-slate-500 hover:bg-slate-50',
                        ]"
                    >
                        {{ page }}
                    </button>
                </template>
            </div>

            <button
                @click="$emit('change', currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="w-8 h-8 inline-flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 transition-colors"
                title="Trang sau"
            >
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
        </div>
    </div>
</template>
