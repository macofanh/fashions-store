<script setup lang="ts">
import { computed } from 'vue'
import type { Product } from '@/pages/products/types/product.types'
import { getImageUrl } from '@/lib/urlHelper'

const props = defineProps<{ product: Product }>()

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const primaryImage = computed(() => {
    const imgs = props.product.images
    if (!imgs?.length) return null
    return imgs.find(i => i.is_primary) || imgs[0]
})

const isNew = computed(() => {
    if (!props.product.created_at) return false
    return (Date.now() - new Date(props.product.created_at).getTime()) < 30 * 24 * 60 * 60 * 1000
})
</script>

<template>
    <router-link
        :to="{ name: 'product-detail', params: { slug: product.slug } }"
        class="group cursor-pointer block"
    >
        <!-- Image -->
        <div class="relative aspect-[3/4] overflow-hidden bg-fashion-gray rounded-xl mb-3 border border-border-light">
            <img
                v-if="primaryImage"
                :src="getImageUrl(primaryImage.image_url)"
                :alt="product.name"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div v-else class="w-full h-full flex items-center justify-center">
                <span class="material-symbols-outlined text-4xl text-text-muted/30">image_not_supported</span>
            </div>

            <!-- Hover overlay -->
            <div class="absolute inset-0 bg-fashion-black/15 opacity-0 group-hover:opacity-100 transition-opacity duration-400"></div>

            <!-- Quick view -->
            <div class="absolute inset-x-4 bottom-4 translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                <div class="bg-white text-fashion-black text-[10px] font-bold text-center tracking-widest uppercase py-2.5 rounded-lg font-display hover:bg-primary hover:text-white transition-colors shadow-lg">
                    Xem chi tiết
                </div>
            </div>

            <!-- Rating badge -->
            <div v-if="product.avg_rating > 0" class="absolute top-3 left-3">
                <div class="flex items-center gap-1 bg-white/95 px-2 py-1 rounded-full shadow-sm">
                    <span class="material-symbols-outlined text-amber-400 text-[12px]" style="font-variation-settings:'FILL' 1">star</span>
                    <span class="text-[10px] font-bold text-fashion-black font-display">{{ product.avg_rating.toFixed(1) }}</span>
                </div>
            </div>

            <!-- New badge -->
            <div v-if="isNew" class="absolute top-3 right-3">
                <span class="bg-primary text-white text-[9px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full font-display">Mới</span>
            </div>
        </div>

        <!-- Info — chỉ tên + giá, không có brand text -->
        <div class="space-y-1 px-0.5">
            <h3 class="text-sm font-semibold text-fashion-black group-hover:text-primary transition-colors line-clamp-2 leading-snug font-display">
                {{ product.name }}
            </h3>
            <p class="text-sm font-bold text-primary font-display">{{ formatPrice(product.base_price) }}</p>
        </div>
    </router-link>
</template>
