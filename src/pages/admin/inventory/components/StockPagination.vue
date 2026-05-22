<script setup lang="ts">
defineProps<{
    currentPage: number
    totalPages: number
    visibleCount: number
    totalItems: number
}>()

defineEmits<{
    change: [value: number]
}>()
</script>

<template>
    <div
        v-if="totalPages > 1"
        class="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-white rounded-b-2xl shadow-sm border-x border-b"
    >
        <p class="text-xs text-slate-500">
            Hiển thị <span class="font-semibold text-slate-900">{{ visibleCount }}</span> / {{ totalItems }} biến thể
        </p>

        <div class="flex items-center gap-1">
            <button
                @click="$emit('change', currentPage - 1)"
                :disabled="currentPage === 1"
                class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
            >
                <span class="material-symbols-outlined text-[18px]">chevron_left</span>
            </button>

            <div class="flex items-center gap-1 mx-2">
                <button
                    v-for="page in totalPages"
                    :key="page"
                    @click="$emit('change', page)"
                    :class="[
                        'w-8 h-8 rounded-lg text-xs font-semibold transition-all',
                        currentPage === page
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-500 hover:bg-slate-100',
                    ]"
                >
                    {{ page }}
                </button>
            </div>

            <button
                @click="$emit('change', currentPage + 1)"
                :disabled="currentPage === totalPages"
                class="p-2 rounded-lg hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent text-slate-600 transition-colors"
            >
                <span class="material-symbols-outlined text-[18px]">chevron_right</span>
            </button>
        </div>
    </div>
</template>
