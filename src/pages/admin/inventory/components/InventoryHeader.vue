<script setup lang="ts">
defineEmits<{
    adjust: []
}>()
</script>

<template>
    <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
            <h1 class="text-2xl font-bold text-slate-900">Quản lý Kho hàng</h1>
            <p class="text-sm text-slate-500 mt-1">Kiểm soát tồn kho chi tiết từng biến thể</p>
        </div>
        <button
            @click="$emit('adjust')"
            class="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all shadow-sm"
        >
            <span class="material-symbols-outlined text-[18px]">add_circle</span>
            Điều chỉnh kho
        </button>
    </div>
</template>
