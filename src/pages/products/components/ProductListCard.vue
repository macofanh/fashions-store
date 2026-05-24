<script setup lang="ts">
import type { Product } from '@/pages/products/types/product.types'
import { getImageUrl } from '@/lib/urlHelper'
import { formatPrice, getPrimaryImage, getUniqueColors, isNewProduct } from '@/pages/products/productDisplay'

defineProps<{
    product: Product
    isAdding?: boolean
}>()

defineEmits<{
    quickAdd: [product: Product]
}>()
</script>

<template>
    <div class="group flex flex-col gap-3">
        <div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
            <router-link
                :to="{ name: 'product-detail', params: { slug: product.slug } }"
                class="block h-full w-full"
            >
                <img
                    v-if="getPrimaryImage(product)"
                    :src="getImageUrl(getPrimaryImage(product)!.image_url)"
                    :alt="product.name"
                    class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div v-else class="w-full h-full flex items-center justify-center bg-border-light">
                    <span class="material-symbols-outlined text-4xl text-text-muted">image_not_supported</span>
                </div>
            </router-link>

            <div class="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <button
                    @click.stop.prevent="$emit('quickAdd', product)"
                    class="btn-radius w-full bg-white/90 backdrop-blur text-fashion-black text-sm font-semibold py-3 shadow-sm hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                >
                    <span v-if="isAdding" class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                    <span v-else class="material-symbols-outlined text-[18px]">shopping_bag</span>
                    Thêm vào giỏ hàng
                </button>
            </div>

            <div class="absolute top-3 left-3 flex flex-col gap-1">
                <span
                    v-if="isNewProduct(product)"
                    class="bg-fashion-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded"
                >Mới</span>
            </div>
        </div>

        <router-link
            :to="{ name: 'product-detail', params: { slug: product.slug } }"
            class="block"
        >
            <h3 class="text-sm text-fashion-black font-medium group-hover:text-primary transition-colors line-clamp-2">
                {{ product.name }}
            </h3>
            <div class="flex items-center gap-2 mt-1">
                <p class="text-sm text-text-muted font-medium">{{ formatPrice(product.base_price) }}</p>
                <div v-if="product.avg_rating > 0" class="flex items-center gap-0.5 ml-auto">
                    <span class="material-symbols-outlined text-amber-400 text-[13px]" style="font-variation-settings:'FILL' 1">star</span>
                    <span class="text-[10px] text-text-muted">{{ product.avg_rating.toFixed(1) }}</span>
                </div>
            </div>

            <div v-if="getUniqueColors(product).length > 1" class="flex gap-1 mt-2">
                <span
                    v-for="color in getUniqueColors(product).slice(0, 5)"
                    :key="color.color_id"
                    :style="{ backgroundColor: color.hex_code || '#ccc' }"
                    :title="color.name"
                    class="w-3 h-3 rounded-full border border-gray-200 block"
                ></span>
                <span v-if="getUniqueColors(product).length > 5" class="text-[9px] text-text-muted self-center">+{{ getUniqueColors(product).length - 5 }}</span>
            </div>
        </router-link>
    </div>
</template>
