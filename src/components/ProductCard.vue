<script setup lang="ts">
import { computed } from 'vue'
import { type Product } from '@/pages/products/productService'
import { getImageUrl } from '@/lib/urlHelper'

const props = defineProps<{
    product: Product
}>()

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const primaryImage = computed(() => {
    const images = props.product.images
    if (!images || images.length === 0) return null
    return images.find(img => img.is_primary) || images[0]
})
</script>

<template>
    <router-link
        :to="{ name: 'product-detail', params: { slug: product.slug } }"
        class="group cursor-pointer block"
    >
        <!-- Image wrapper -->
        <div class="relative aspect-[3/4] overflow-hidden bg-fashion-gray rounded-lg mb-4 border border-border-light">
            <img
                v-if="primaryImage"
                :src="getImageUrl(primaryImage.image_url)"
                :alt="product.name"
                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div
                v-else
                class="w-full h-full flex flex-col items-center justify-center gap-2"
            >
                <span class="material-symbols-outlined text-4xl text-text-muted/40">image_not_supported</span>
                <span class="text-[9px] uppercase tracking-widest text-text-muted/40">Chưa có ảnh</span>
            </div>

            <!-- Overlay gradient on hover -->
            <div class="absolute inset-0 bg-gradient-to-t from-fashion-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

            <!-- Quick view button -->
            <div class="absolute bottom-0 left-0 right-0 p-4 translate-y-full group-hover:translate-y-0 transition-transform duration-400">
                <div class="bg-white/95 backdrop-blur-sm text-fashion-black text-[10px] font-bold text-center tracking-[0.2em] uppercase py-3 rounded-lg hover:bg-primary hover:text-white transition-colors">
                    Xem chi tiết
                </div>
            </div>

            <!-- Rating badge -->
            <div v-if="product.avg_rating > 0" class="absolute top-3 left-3">
                <div class="flex items-center gap-1 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full shadow-sm">
                    <span class="material-symbols-outlined text-amber-400 text-[12px]" style="font-variation-settings:'FILL' 1">star</span>
                    <span class="text-[10px] font-bold text-fashion-black">{{ product.avg_rating.toFixed(1) }}</span>
                </div>
            </div>
        </div>

        <!-- Info -->
        <div class="px-1">
            <p class="text-[9px] uppercase tracking-[0.3em] text-text-muted mb-1">{{ product.brand || 'LuxuStore' }}</p>
            <h3 class="text-sm font-medium text-fashion-black group-hover:text-primary transition-colors line-clamp-2 mb-2 leading-snug">
                {{ product.name }}
            </h3>
            <p class="text-sm font-semibold text-fashion-black">{{ formatPrice(product.base_price) }}</p>
        </div>
    </router-link>
</template>
