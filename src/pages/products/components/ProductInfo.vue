<script setup lang="ts">
import { ref, computed } from 'vue'
import SizeGuideModal from './SizeGuideModal.vue'
import { detectProductGender, detectProductSizeType } from '@/lib/sizeHelper'

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
    suggestedSizeName?: string | null
    quantity: number
    reviewCount: number
    isAddingToCart: boolean
    isBuyingNow: boolean
    isStockNotificationSubscribed: boolean
    isStockNotificationLoading: boolean
}>()

const showSizeGuide = ref(false)

const emit = defineEmits<{
    'update:selectedColor': [color: Color]
    'update:selectedSize':  [size: Size]
    'update:quantity':      [qty: number]
    addToCart: []
    buyNow: []
    toggleStockNotification: []
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
        <div class="sticky top-24 space-y-4">

            <!-- Brand + Name -->
            <div>
                <p class="text-[11px] uppercase tracking-widest text-text-muted mb-1 font-display">
                    {{ 'LuxuStore' }}
                </p>
                <h1 class="text-xl md:text-2xl font-semibold text-fashion-black leading-snug">
                    {{ product.name }}
                </h1>
            </div>

            <!-- Price + Rating -->
            <div class="flex items-center gap-3 flex-wrap">
                <span class="text-2xl font-bold text-black font-display">
                    {{ formatPrice(currentVariant?.price || product.base_price) }}
                </span>
                <div v-if="product.avg_rating > 0" class="flex items-center gap-1 text-sm text-text-muted">
                    <span class="material-symbols-outlined text-amber-400 text-[15px]" style="font-variation-settings:'FILL' 1">star</span>
                    <span class="font-semibold text-amber-700">{{ product.avg_rating.toFixed(1) }}</span>
                    <span class="text-xs">({{ reviewCount }} đánh giá)</span>
                </div>
            </div>

            <div class="border-t border-border-light"></div>

            <!-- Color -->
            <div>
                <p class="text-xs font-semibold text-fashion-black mb-2">
                    Màu sắc: <span class="font-bold uppercase text-black ml-1">{{ selectedColor?.name }}</span>
                </p>
                <div class="flex gap-2 flex-wrap">
                    <button
                        v-for="color in availableColors"
                        :key="color.color_id"
                        @click="emit('update:selectedColor', color)"
                        :title="color.name"
                        :class="[
                            'w-9 h-9 p-0.5 transition-all border bg-white flex items-center justify-center',
                            selectedColor?.color_id === color.color_id
                                ? 'border-black border-2 scale-105 shadow-sm'
                                : 'border-gray-200 hover:border-black'
                        ]"
                    >
                        <div :style="{ backgroundColor: color.hex_code || '#eee' }" class="w-full h-full border border-black/5"></div>
                    </button>
                </div>
            </div>

            <!-- Size -->
            <div>
                <div class="flex justify-between items-center mb-2">
                    <p class="text-xs font-semibold text-fashion-black">Kích thước</p>
                    <button 
                        @click="showSizeGuide = true"
                        type="button"
                        class="text-[11px] text-black hover:text-fashion-black font-semibold flex items-center gap-1 hover:opacity-75 transition-opacity"
                    >
                        <span class="material-symbols-outlined text-[14px]">straighten</span> Hướng dẫn chọn size
                    </button>
                </div>
                <div class="flex flex-wrap gap-2">
                    <button
                        v-for="size in availableSizes"
                        :key="size.size_id"
                        @click="emit('update:selectedSize', size)"
                        :class="[
                            'min-w-[44px] px-4 py-2 text-sm font-bold border transition-all rounded-none relative',
                            selectedSize?.size_id === size.size_id
                                ? 'border-black border-2 text-black bg-white'
                                : 'border-gray-200 text-black hover:border-black bg-white',
                            suggestedSizeName === size.name ? 'ring-1 ring-black/40' : ''
                        ]"
                    >
                        {{ size.name }}
                        <!-- Pulsing badge for recommended size -->
                        <span v-if="suggestedSizeName === size.name" class="absolute top-1 right-1 flex h-1.5 w-1.5">
                            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-black opacity-75"></span>
                            <span class="relative inline-flex rounded-full h-1.5 w-1.5 bg-black"></span>
                        </span>
                    </button>
                </div>
                <div v-if="suggestedSizeName" class="mt-2 text-[11px] text-gray-500 flex items-center gap-1.5">
                    <span class="material-symbols-outlined text-[15px] text-black">workspace_premium</span>
                    <span>Kích cỡ gợi ý của bạn: <strong class="text-black">{{ suggestedSizeName }}</strong> (dựa trên hồ sơ chiều cao/cân nặng)</span>
                </div>
            </div>

            <!-- Quantity + Stock -->
            <div class="flex items-center gap-4">
                <div>
                    <p class="text-xs font-semibold text-fashion-black mb-1.5">Số lượng</p>
                    <div class="flex items-center border border-black rounded-none overflow-hidden w-fit bg-white">
                        <button @click="emit('update:quantity', Math.max(1, quantity - 1))"
                            class="w-9 h-9 flex items-center justify-center hover:bg-gray-50 text-fashion-black transition-colors">
                            <span class="material-symbols-outlined text-[16px]">remove</span>
                        </button>
                        <span class="w-11 h-9 flex items-center justify-center text-sm font-bold border-x border-black font-display text-black">{{ quantity }}</span>
                        <button @click="emit('update:quantity', quantity + 1)"
                            class="w-9 h-9 flex items-center justify-center hover:bg-gray-50 text-fashion-black transition-colors">
                            <span class="material-symbols-outlined text-[16px]">add</span>
                        </button>
                    </div>
                </div>

                <div v-if="currentVariant" class="mt-5">
                    <span v-if="isOutOfStock" class="inline-flex items-center gap-1 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-none">
                        <span class="material-symbols-outlined text-[13px]">cancel</span> Hết hàng
                    </span>
                    <span v-else-if="isLowStock" class="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-none">
                        <span class="material-symbols-outlined text-[13px]">warning</span> Còn {{ currentVariant.stock_qty }} sản phẩm
                    </span>
                    <span v-else class="inline-flex items-center gap-1 text-xs font-semibold text-black bg-gray-50 border border-black px-2.5 py-1 rounded-none">
                        <span class="material-symbols-outlined text-[13px]">check_circle</span> Còn hàng
                    </span>
                </div>
            </div>

            <!-- CTA Buttons -->
            <div class="flex flex-col gap-2 pt-1">
                <button
                    v-if="isOutOfStock"
                    type="button"
                    :disabled="isStockNotificationLoading"
                    class="w-full flex items-center justify-center gap-2 py-3 text-sm font-bold uppercase tracking-wider text-black border border-black hover:bg-black hover:text-white transition-colors disabled:opacity-60 rounded-none"
                    @click="emit('toggleStockNotification')"
                >
                    <span
                        v-if="isStockNotificationLoading"
                        class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"
                    ></span>
                    <span v-else class="material-symbols-outlined text-[18px]">
                        {{ isStockNotificationSubscribed ? 'notifications_active' : 'notifications' }}
                    </span>
                    {{
                        isStockNotificationSubscribed
                            ? 'Đã đăng ký thông báo khi có hàng'
                            : 'Thông báo cho tôi khi có hàng'
                    }}
                </button>

                <button @click="emit('buyNow')" :disabled="isOutOfStock || isBuyingNow"
                    class="w-full bg-black text-white py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-gray-900 transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm rounded-none">
                    <span v-if="isBuyingNow" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    <span v-else class="material-symbols-outlined text-[17px]">bolt</span>
                    Mua ngay
                </button>

                <button @click="emit('addToCart')" :disabled="isOutOfStock || isAddingToCart"
                    class="w-full bg-white border-2 border-black text-black py-3.5 text-sm font-bold uppercase tracking-wider hover:bg-black hover:text-white transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 rounded-none">
                    <span v-if="isAddingToCart" class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    <span v-else class="material-symbols-outlined text-[17px]">shopping_bag</span>
                    {{ isOutOfStock ? 'Hết hàng' : 'Thêm vào giỏ hàng' }}
                </button>
            </div>

            <!-- Trust badges -->
            <div class="flex gap-2 pt-1">
                <div v-for="badge in [
                    { icon: 'local_shipping', label: 'Giao nhanh' },
                    { icon: 'replay',         label: 'Đổi trả 30 ngày' },
                    { icon: 'verified_user',  label: 'Chính hãng' },
                ]" :key="badge.icon"
                    class="flex-1 flex flex-col items-center gap-1 py-2.5 bg-gray-50 border border-border-light rounded-none text-center">
                    <span class="material-symbols-outlined text-black text-[18px]">{{ badge.icon }}</span>
                    <span class="text-[10px] font-bold text-black leading-tight uppercase tracking-wider font-display">{{ badge.label }}</span>
                </div>
            </div>

            <!-- Description -->
            <div class="pt-2 border-t border-border-light">
                <p class="text-xs font-bold uppercase tracking-wider text-black mb-2">Chi tiết sản phẩm</p>
                <p class="text-fashion-black text-sm leading-relaxed">
                    {{ product.description || 'Mô tả sản phẩm đang được cập nhật...' }}
                </p>
            </div>

            <!-- Size Guide Modal -->
            <SizeGuideModal
                v-if="showSizeGuide"
                :initial-gender="detectProductGender(product)"
                :initial-size-type="detectProductSizeType(product)"
                @close="showSizeGuide = false"
            />
        </div>
    </div>
</template>
