<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    priceRange: { min: string; max: string }
}>()

const emit = defineEmits<{
    applyPriceRange: []
}>()

const pricePresets = [
    { label: 'Dưới 200K', description: 'Sản phẩm giá tốt', min: '', max: '200000' },
    { label: '200K - 500K', description: 'Phổ biến nhất', min: '200000', max: '500000' },
    { label: '500K - 1 triệu', description: 'Phân khúc cao cấp', min: '500000', max: '1000000' },
    { label: 'Trên 1 triệu', description: 'Dòng tuyển chọn', min: '1000000', max: '' },
]

const priceRangeError = computed(() => {
    const min = Number(props.priceRange.min)
    const max = Number(props.priceRange.max)

    return Boolean(props.priceRange.min && props.priceRange.max && min > max)
})

const hasPriceRange = computed(() => Boolean(props.priceRange.min || props.priceRange.max))

const isPresetActive = (min: string, max: string) =>
    props.priceRange.min === min && props.priceRange.max === max

const applyPreset = (min: string, max: string) => {
    props.priceRange.min = min
    props.priceRange.max = max
    emit('applyPriceRange')
}

const applyCustomRange = () => {
    if (!priceRangeError.value) {
        emit('applyPriceRange')
    }
}
</script>

<template>
    <section class="filter-panel">
        <div class="p-5">
            <div class="mb-4 flex items-start justify-between gap-3">
                <div>
                    <h2 class="text-sm font-bold uppercase tracking-wider text-fashion-black">Khoảng giá</h2>
                    <p class="mt-1 text-xs leading-5 text-text-muted">Chọn nhanh hoặc nhập mức giá phù hợp.</p>
                </div>
                <span
                    v-if="hasPriceRange"
                    class="rounded-full bg-primary-light px-2 py-1 text-[9px] font-bold uppercase tracking-wider text-primary"
                >
                    Đã chọn
                </span>
            </div>

            <div class="space-y-2">
                <button
                    v-for="preset in pricePresets"
                    :key="preset.label"
                    type="button"
                    :class="[
                        'price-preset',
                        isPresetActive(preset.min, preset.max)
                            ? 'price-preset--active'
                            : 'price-preset--default'
                    ]"
                    @click="applyPreset(preset.min, preset.max)"
                >
                    <span>
                        <span class="block text-xs font-bold">{{ preset.label }}</span>
                        <span class="mt-0.5 block text-[10px] font-normal opacity-70">{{ preset.description }}</span>
                    </span>
                    <span
                        class="material-symbols-outlined text-[18px]"
                        :style="isPresetActive(preset.min, preset.max) ? `font-variation-settings: 'FILL' 1` : ''"
                    >
                        {{ isPresetActive(preset.min, preset.max) ? 'check_circle' : 'chevron_right' }}
                    </span>
                </button>
            </div>

            <div class="my-5 flex items-center gap-3">
                <span class="h-px flex-1 bg-border-light"></span>
                <span class="text-[9px] font-bold uppercase tracking-[0.18em] text-text-muted">Tùy chọn</span>
                <span class="h-px flex-1 bg-border-light"></span>
            </div>

            <form class="space-y-3" @submit.prevent="applyCustomRange">
                <div class="grid grid-cols-2 gap-2">
                    <label class="price-field">
                        <span class="price-field__label">Giá từ</span>
                        <span class="relative block">
                            <input
                                v-model="priceRange.min"
                                type="number"
                                inputmode="numeric"
                                min="0"
                                placeholder="0"
                                class="price-input"
                            />
                            <span class="price-field__currency">₫</span>
                        </span>
                    </label>

                    <label class="price-field">
                        <span class="price-field__label">Giá đến</span>
                        <span class="relative block">
                            <input
                                v-model="priceRange.max"
                                type="number"
                                inputmode="numeric"
                                min="0"
                                placeholder="Không giới hạn"
                                class="price-input"
                            />
                            <span class="price-field__currency">₫</span>
                        </span>
                    </label>
                </div>

                <p v-if="priceRangeError" class="flex items-center gap-1.5 text-[11px] text-red-500">
                    <span class="material-symbols-outlined text-[15px]">error</span>
                    Giá bắt đầu phải nhỏ hơn giá kết thúc.
                </p>

                <button
                    type="submit"
                    :disabled="priceRangeError"
                    class="apply-button"
                >
                    Áp dụng khoảng giá
                    <span class="material-symbols-outlined text-[17px]">arrow_forward</span>
                </button>
            </form>
        </div>
    </section>
</template>

<style scoped>
@reference "../../assets/main.css";

.filter-panel {
    @apply overflow-hidden rounded-xl border border-border-light bg-white shadow-sm;
}

.price-preset {
    @apply flex w-full items-center justify-between rounded-lg border px-3.5 py-2.5 text-left transition-all;
}

.price-preset--active {
    @apply border-primary bg-primary text-white shadow-sm;
}

.price-preset--default {
    @apply border-border-light bg-white text-fashion-black hover:border-primary/60 hover:bg-primary-light/50 hover:text-primary;
}

.price-field {
    @apply block rounded-lg border border-border-light bg-background-light px-3 py-2 transition-all focus-within:border-primary focus-within:bg-white focus-within:ring-2 focus-within:ring-primary/10;
}

.price-field__label {
    @apply mb-1 block text-[9px] font-bold uppercase tracking-wider text-text-muted;
}

.price-input {
    @apply w-full bg-transparent pr-4 text-xs font-semibold text-fashion-black outline-none placeholder:text-[10px] placeholder:font-normal placeholder:text-text-muted/60;
}

.price-field__currency {
    @apply absolute right-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-text-muted;
}

.apply-button {
    @apply flex w-full items-center justify-center gap-2 rounded-lg bg-fashion-black px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-white transition-all hover:bg-primary disabled:cursor-not-allowed disabled:opacity-40;
}

</style>
