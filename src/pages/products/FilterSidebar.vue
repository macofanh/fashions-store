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
    { label: 'Nam',    value: 'male',   icon: 'man'        },
    { label: 'Nữ',    value: 'female', icon: 'woman'      },
    { label: 'Unisex', value: 'unisex', icon: 'people'     },
    { label: 'Trẻ em', value: 'kids',   icon: 'child_care' },
]

const pricePresets = [
    { label: '< 200K',   min: '',        max: '200000'  },
    { label: '200–500K', min: '200000',  max: '500000'  },
    { label: '500K–1M',  min: '500000',  max: '1000000' },
    { label: '> 1M',     min: '1000000', max: ''        },
]
</script>

<template>
    <div class="space-y-7">

        <!-- ── Header + Clear ── -->
        <div class="flex items-center justify-between">
            <h2 class="text-sm font-bold uppercase tracking-wider text-fashion-black">Bộ lọc</h2>
            <button
                v-if="activeFilterCount > 0"
                @click="emit('clearAll')"
                class="text-[11px] font-medium text-text-muted hover:text-red-500 transition-colors flex items-center gap-1"
            >
                <span class="material-symbols-outlined text-[14px]">close</span>
                Xóa ({{ activeFilterCount }})
            </button>
        </div>

        <!-- ── Danh mục ── -->
        <div class="space-y-3">
            <h3 class="filter-title">Danh mục</h3>
            <ul class="space-y-1.5">
                <li>
                    <!-- group đặt trực tiếp trên label, không dùng @apply group -->
                    <label class="flex items-center gap-3 cursor-pointer group py-0.5">
                        <input
                            type="checkbox"
                            :checked="filters.category_id === null"
                            @change="emit('setCategory', null)"
                            class="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                        />
                        <span class="text-sm text-fashion-black group-hover:text-primary transition-colors">Tất cả</span>
                    </label>
                </li>
                <li v-for="cat in categories" :key="cat.category_id">
                    <label class="flex items-center gap-3 cursor-pointer group py-0.5">
                        <input
                            type="checkbox"
                            :checked="filters.category_id === cat.category_id"
                            @change="emit('setCategory', cat.category_id)"
                            class="h-4 w-4 rounded border-border-light text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                        />
                        <span class="text-sm text-fashion-black group-hover:text-primary transition-colors flex-grow">{{ cat.name }}</span>
                        <span v-if="cat.product_count" class="text-xs text-text-muted">({{ cat.product_count }})</span>
                    </label>
                </li>
            </ul>
        </div>

        <div class="border-t border-border-light" />

        <!-- ── Giới tính ── -->
        <div class="space-y-3">
            <h3 class="filter-title">Giới tính</h3>
            <div class="grid grid-cols-2 gap-2">
                <button
                    v-for="g in genderOptions"
                    :key="g.value"
                    @click="emit('setGender', g.value)"
                    :class="[
                        'gender-btn',
                        filters.gender === g.value ? 'gender-btn--active' : 'gender-btn--default'
                    ]"
                >
                    <span class="material-symbols-outlined text-[16px]">{{ g.icon }}</span>
                    {{ g.label }}
                </button>
            </div>
        </div>

        <div class="border-t border-border-light" />

        <!-- ── Khoảng giá ── -->
        <div class="space-y-3">
            <h3 class="filter-title">Khoảng giá</h3>

            <!-- Preset chips -->
            <div class="grid grid-cols-2 gap-1.5">
                <button
                    v-for="preset in pricePresets"
                    :key="preset.label"
                    @click="priceRange.min = preset.min; priceRange.max = preset.max; emit('applyPriceRange')"
                    :class="[
                        'price-preset',
                        priceRange.min === preset.min && priceRange.max === preset.max
                            ? 'price-preset--active'
                            : 'price-preset--default'
                    ]"
                >
                    {{ preset.label }}
                </button>
            </div>

            <!-- Manual range inputs -->
            <div class="bg-border-light/40 rounded-lg p-3 space-y-2">
                <p class="text-[10px] uppercase tracking-widest font-bold text-text-muted">Nhập khoảng giá</p>
                <div class="flex gap-2 items-center">
                    <div class="flex-1 relative">
                        <input
                            v-model="priceRange.min"
                            type="number"
                            min="0"
                            placeholder="Từ"
                            class="price-input"
                        />
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-text-muted font-bold">₫</span>
                    </div>
                    <div class="w-4 h-px bg-text-muted/30 shrink-0"></div>
                    <div class="flex-1 relative">
                        <input
                            v-model="priceRange.max"
                            type="number"
                            min="0"
                            placeholder="Đến"
                            class="price-input"
                        />
                        <span class="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-text-muted font-bold">₫</span>
                    </div>
                </div>
                <button
                    @click="emit('applyPriceRange')"
                    class="w-full bg-primary text-white py-2 text-xs font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-1.5 rounded-lg"
                >
                    <span class="material-symbols-outlined text-[14px]">check</span>
                    Áp dụng
                </button>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../assets/main.css";

.filter-title {
    @apply text-xs font-bold uppercase tracking-wider text-fashion-black;
}

/* Gender buttons */
.gender-btn {
    @apply h-10 flex items-center justify-center gap-1.5 border text-sm font-medium transition-all rounded-lg;
}

.gender-btn--active {
    @apply border-primary bg-primary text-white;
}

.gender-btn--default {
    @apply border-border-light text-fashion-black hover:border-primary hover:text-primary hover:bg-primary-light;
}

/* Price preset chips */
.price-preset {
    @apply h-8 border text-xs font-medium transition-all rounded-lg;
}

.price-preset--active {
    @apply border-primary bg-primary text-white;
}

.price-preset--default {
    @apply border-border-light text-fashion-black hover:border-primary hover:text-primary hover:bg-primary-light;
}

/* Price inputs */
.price-input {
    @apply w-full bg-white border border-border-light py-2 pl-3 pr-6 text-xs outline-none focus:border-primary transition-colors rounded-lg;
}
</style>
