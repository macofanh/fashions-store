<script setup lang="ts">
defineProps<{
    categories: any[]
    filters: {
        category_id: number | null
        gender: string
        min_price: number | null
        max_price: number | null
    }
    priceRange: { min: string; max: string }
    activeFilterCount: number
}>()

const emit = defineEmits<{
    setCategory: [id: number | null]
    setGender: [val: string]
    applyPriceRange: []
    clearAll: []
}>()

const genderOptions = [
    { label: 'Nam', value: 'male' },
    { label: 'Nữ', value: 'female' },
    { label: 'Unisex', value: 'unisex' },
    { label: 'Trẻ em', value: 'kids' },
]
</script>

<template>
    <div class="space-y-10">
        <!-- Clear all -->
        <div class="flex items-center justify-between">
            <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-900">Bộ lọc</h2>
            <button
                v-if="activeFilterCount > 0"
                @click="emit('clearAll')"
                class="text-[9px] uppercase tracking-widest font-bold text-zinc-400 hover:text-red-500 transition-colors flex items-center gap-1"
            >
                <span class="material-symbols-outlined text-[14px]">close</span>
                Xóa ({{ activeFilterCount }})
            </button>
        </div>

        <!-- Danh mục -->
        <div>
            <h3 class="text-[9px] uppercase tracking-[0.25em] font-bold text-zinc-400 mb-4 pb-2 border-b border-zinc-100">Danh mục</h3>
            <ul class="space-y-2.5">
                <li>
                    <button
                        @click="emit('setCategory', null)"
                        :class="[
                            'text-[11px] uppercase tracking-widest transition-colors w-full text-left flex items-center gap-2',
                            filters.category_id === null ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-900'
                        ]"
                    >
                        <span :class="['w-1 h-1 rounded-full shrink-0', filters.category_id === null ? 'bg-zinc-900' : 'bg-transparent']"></span>
                        Tất cả
                    </button>
                </li>
                <li v-for="cat in categories" :key="cat.category_id">
                    <button
                        @click="emit('setCategory', cat.category_id)"
                        :class="[
                            'text-[11px] uppercase tracking-widest transition-colors w-full text-left flex items-center gap-2',
                            filters.category_id === cat.category_id ? 'text-zinc-900 font-bold' : 'text-zinc-400 hover:text-zinc-900'
                        ]"
                    >
                        <span :class="['w-1 h-1 rounded-full shrink-0', filters.category_id === cat.category_id ? 'bg-zinc-900' : 'bg-transparent']"></span>
                        {{ cat.name }}
                    </button>
                </li>
            </ul>
        </div>

        <!-- Giới tính -->
        <div>
            <h3 class="text-[9px] uppercase tracking-[0.25em] font-bold text-zinc-400 mb-4 pb-2 border-b border-zinc-100">Giới tính</h3>
            <div class="grid grid-cols-2 gap-2">
                <button
                    v-for="g in genderOptions"
                    :key="g.value"
                    @click="emit('setGender', g.value)"
                    :class="[
                        'py-2.5 text-[10px] uppercase tracking-widest font-bold border transition-all',
                        filters.gender === g.value
                            ? 'bg-zinc-900 text-white border-zinc-900'
                            : 'border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900'
                    ]"
                >
                    {{ g.label }}
                </button>
            </div>
        </div>

        <!-- Khoảng giá -->
        <div>
            <h3 class="text-[9px] uppercase tracking-[0.25em] font-bold text-zinc-400 mb-4 pb-2 border-b border-zinc-100">Khoảng giá</h3>
            <div class="space-y-3">
                <div class="flex gap-2 items-center">
                    <div class="flex-1 relative">
                        <input
                            v-model="priceRange.min"
                            type="number"
                            min="0"
                            placeholder="Từ"
                            class="w-full border border-zinc-200 py-2.5 px-3 text-xs outline-none focus:border-zinc-900 transition-colors"
                        />
                    </div>
                    <span class="text-zinc-300 text-sm">—</span>
                    <div class="flex-1 relative">
                        <input
                            v-model="priceRange.max"
                            type="number"
                            min="0"
                            placeholder="Đến"
                            class="w-full border border-zinc-200 py-2.5 px-3 text-xs outline-none focus:border-zinc-900 transition-colors"
                        />
                    </div>
                </div>

                <!-- Quick price presets -->
                <div class="grid grid-cols-2 gap-1.5">
                    <button
                        v-for="preset in [
                            { label: '< 200K', min: '', max: '200000' },
                            { label: '200K–500K', min: '200000', max: '500000' },
                            { label: '500K–1M', min: '500000', max: '1000000' },
                            { label: '> 1M', min: '1000000', max: '' },
                        ]"
                        :key="preset.label"
                        @click="priceRange.min = preset.min; priceRange.max = preset.max; emit('applyPriceRange')"
                        :class="[
                            'py-2 text-[9px] uppercase tracking-widest font-bold border transition-all',
                            priceRange.min === preset.min && priceRange.max === preset.max
                                ? 'bg-zinc-900 text-white border-zinc-900'
                                : 'border-zinc-100 text-zinc-400 hover:border-zinc-400 hover:text-zinc-900'
                        ]"
                    >
                        {{ preset.label }}
                    </button>
                </div>

                <button
                    @click="emit('applyPriceRange')"
                    class="w-full bg-zinc-900 text-white py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-700 transition-colors"
                >
                    Áp dụng
                </button>
            </div>
        </div>
    </div>
</template>
