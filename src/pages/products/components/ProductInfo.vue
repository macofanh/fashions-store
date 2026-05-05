<script setup lang="ts">
import { computed } from 'vue'

interface Color { color_id: number; name: string; hex_code?: string }
interface Size  { size_id: number; name: string }
interface Variant {
    variant_id: number
    color_id: number
    size_id: number
    color: Color
    size: Size
    price: number
    stock_qty: number
    low_stock_threshold: number
}

const props = defineProps<{
    product: any
    variants: Variant[]
    selectedColor: Color | null
    selectedSize: Size | null
    quantity: number
    reviewCount: number
    isAddingToCart: boolean
    isBuyingNow: boolean
}>()

const emit = defineEmits<{
    'update:selectedColor': [color: Color]
    'update:selectedSize':  [size: Size]
    'update:quantity':      [qty: number]
    addToCart: []
    buyNow: []
}>()

const availableColors = computed(() => {
    const colors = props.variants.map(v => v.color)
    return Array.from(new Map(colors.map(c => [c.color_id, c])).values())
})

const availableSizes = computed(() => {
    if (!props.selectedColor) return []
    return props.variants
        .filter(v => v.color_id === props.selectedColor!.color_id)
        .map(v => v.size)
})

const currentVariant = computed(() => {
    if (!props.selectedColor || !props.selectedSize) return null
    return props.variants.find(
        v => v.color_id === props.selectedColor!.color_id && v.size_id === props.selectedSize!.size_id
    ) ?? null
})

const isOutOfStock = computed(() => !!currentVariant.value && currentVariant.value.stock_qty <= 0)
const isLowStock   = computed(() => !!currentVariant.value && currentVariant.value.stock_qty > 0 && currentVariant.value.stock_qty <= currentVariant.value.low_stock_threshold)

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
</script>

<template>
    <div class="w-full lg:w-[45%]">
        <div class="sticky top-28 space-y-6">

            <!-- Brand + Name + Price + Rating -->
            <div>
                <p class="text-[10px] uppercase tracking-[0.4em] text-text-muted mb-2 font-display">
                    {{ product.brand || 'LuxuStore' }}
                </p>
                <h1 class="text-3xl md:text-4xl font-serif italic text-fashion-black leading-tight mb-4">
                    {{ product.name }}
                </h1>
                <div class="flex items-center gap-4 flex-wrap">
                    <span class="text-2xl font-bold text-fashion-black font-display">
                        {{ formatPrice(currentVariant?.price || product.base_price) }}
                    </span>
                    <div v-if="product.avg_rating > 0" class="flex items-center gap-1.5 bg-amber-50 border border-amber-100 px-2.5 py-1 rounded-full">
                        <span class="material-symbols-outlined text-amber-400 text-[14px]" style="font-variation-settings:'FILL' 1">star</span>
                        <span class="text-xs font-bold text-amber-700 font-display">{{ product.avg_rating.toFixed(1) }}</span>
                        <span class="text-[10px] text-amber-600 font-display">({{ reviewCount }})</span>
                    </div>
                </div>
            </div>

            <div class="border-t border-border-light"></div>

            <!-- Color -->
            <div>
                <p class="text-[10px] uppercase tracking-widest font-bold text-fashion-black mb-3 font-display">
                    Màu sắc: <span class="font-normal text-text-muted ml-1">{{ selectedColor?.name }}</span>
                </p>
                <div class="flex gap-2.5 flex-wrap">
                    <button
                        v-for="color in availableColors"
                        :key="color.color_id"
                        @click="emit('update:selectedColor', color)"
                        :title="color.name"
                        :class="[
                            'w-9 h-9 rounded-full border-2 p-1 transition-all',
                            selectedColor?.color_id === color.color_id
                                ? 'border-primary scale-110 shadow-md'
                                : 'border-border-light hover:border-primary'
                        ]"
                    >
                        <div :style="{ backgroundColor: color.hex_code || '#eee' }" class="w-full h-full rounded-full border border-black/5"></div>
                    </button>
                </div>
            </div>

            <!-- Size -->
            <div>
                <div class="flex justify-between items-center mb-3">
                    <p class="text-[10px] uppercase tracking-widest font-bold text-fashion-black font-display">Kích thước</p>
                    <button class="text-[10px] text-text-muted underline underline-offset-4 hover:text-primary transition-colors font-display">
                        Hướng dẫn chọn size
                    </button>
                </div>
                <div class="grid grid-cols-4 gap-2">
                    <button
                        v-for="size in availableSizes"
                        :key="size.size_id"
                        @click="emit('update:selectedSize', size)"
                        :class="[
                            'py-3 text-sm font-semibold border rounded-lg transition-all font-display',
                            selectedSize?.size_id === size.size_id
                                ? 'border-primary bg-primary text-white shadow-sm'
                                : 'border-border-light text-text-muted hover:border-primary hover:text-primary bg-white'
                        ]"
                    >
                        {{ size.name }}
                    </button>
                </div>
            </div>

            <!-- Quantity + Stock -->
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-[10px] uppercase tracking-widest font-bold text-fashion-black mb-2 font-display">Số lượng</p>
                    <div class="flex items-center border border-border-light rounded-lg overflow-hidden w-fit bg-white">
                        <button @click="emit('update:quantity', Math.max(1, quantity - 1))"
                            class="w-10 h-10 flex items-center justify-center hover:bg-primary-light text-fashion-black transition-colors">
                            <span class="material-symbols-outlined text-[18px]">remove</span>
                        </button>
                        <span class="w-12 h-10 flex items-center justify-center text-sm font-bold border-x border-border-light font-display">{{ quantity }}</span>
                        <button @click="emit('update:quantity', quantity + 1)"
                            class="w-10 h-10 flex items-center justify-center hover:bg-primary-light text-fashion-black transition-colors">
                            <span class="material-symbols-outlined text-[18px]">add</span>
                        </button>
                    </div>
                </div>

                <div v-if="currentVariant">
                    <span v-if="isOutOfStock" class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-red-500 bg-red-50 border border-red-100 px-3 py-1.5 rounded-full font-display">
                        <span class="material-symbols-outlined text-[12px]">cancel</span> Hết hàng
                    </span>
                    <span v-else-if="isLowStock" class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-full font-display">
                        <span class="material-symbols-outlined text-[12px]">warning</span> Còn {{ currentVariant.stock_qty }}
                    </span>
                    <span v-else class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-full font-display">
                        <span class="material-symbols-outlined text-[12px]">check_circle</span> Còn hàng
                    </span>
                </div>
            </div>

            <!-- CTA Buttons -->
            <div class="flex flex-col gap-3 pt-2">
                <button @click="emit('addToCart')" :disabled="isOutOfStock || isAddingToCart"
                    class="w-full bg-white border-2 border-primary text-primary py-4 text-sm font-bold tracking-widest uppercase rounded-lg hover:bg-primary hover:text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-display">
                    <span v-if="isAddingToCart" class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    <span v-else class="material-symbols-outlined text-[18px]">shopping_bag</span>
                    {{ isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ' }}
                </button>

                <button @click="emit('buyNow')" :disabled="isOutOfStock || isBuyingNow"
                    class="w-full bg-primary text-white py-4 text-sm font-bold tracking-widest uppercase rounded-lg hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-primary/20 font-display">
                    <span v-if="isBuyingNow" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    <span v-else class="material-symbols-outlined text-[18px]">bolt</span>
                    Mua ngay
                </button>

                <button class="w-full border border-border-light text-text-muted py-4 text-sm font-bold tracking-widest uppercase rounded-lg hover:border-red-300 hover:text-red-500 transition-all flex items-center justify-center gap-2 bg-white font-display">
                    <span class="material-symbols-outlined text-[18px]">favorite</span>
                    Thêm vào yêu thích
                </button>
            </div>

            <!-- Description -->
            <div class="pt-4 border-t border-border-light">
                <p class="text-[10px] uppercase tracking-widest font-bold text-fashion-black mb-3 font-display">Chi tiết sản phẩm</p>
                <p class="text-text-muted text-sm leading-relaxed font-display">
                    {{ product.description || 'Mô tả sản phẩm đang được cập nhật...' }}
                </p>
            </div>

            <!-- Trust badges -->
            <div class="grid grid-cols-3 gap-3">
                <div v-for="badge in [
                    { icon: 'local_shipping', label: 'Giao nhanh' },
                    { icon: 'replay',         label: 'Đổi trả 30 ngày' },
                    { icon: 'verified_user',  label: 'Chính hãng' },
                ]" :key="badge.icon"
                    class="flex flex-col items-center gap-1.5 p-3 bg-white border border-border-light rounded-lg text-center">
                    <span class="material-symbols-outlined text-primary text-[20px]">{{ badge.icon }}</span>
                    <span class="text-[9px] uppercase tracking-widest font-bold text-text-muted font-display">{{ badge.label }}</span>
                </div>
            </div>
        </div>
    </div>
</template>
