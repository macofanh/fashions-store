<script setup lang="ts">
import { computed } from 'vue'
import { type Product } from '@/api/productService'
import { getImageUrl } from '@/api/urlHelper'

const props = defineProps<{
    product: Product
}>()

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

// Lấy ảnh chính: ưu tiên is_primary, fallback ảnh đầu tiên, fallback placeholder
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
        <div class="relative aspect-[3/4] overflow-hidden bg-zinc-100 mb-6">
            <!-- Có ảnh -->
            <img 
                v-if="primaryImage"
                :src="getImageUrl(primaryImage.image_url)" 
                :alt="product.name"
                class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
            />
            <!-- Không có ảnh: hiện placeholder nội bộ -->
            <div 
                v-else
                class="w-full h-full flex flex-col items-center justify-center gap-2 bg-zinc-100"
            >
                <span class="material-symbols-outlined text-4xl text-zinc-300">image_not_supported</span>
                <span class="text-[9px] uppercase tracking-widest text-zinc-300">Chưa có ảnh</span>
            </div>

            <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
            
            <div class="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] bg-white text-zinc-900 py-4 text-[10px] font-bold text-center tracking-[0.2em] uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hover:bg-zinc-900 hover:text-white">
                Xem chi tiết
            </div>
        </div>
        
        <div class="text-center">
            <p class="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-2">{{ product.brand || 'Azure Editorial' }}</p>
            <h3 class="text-zinc-900 text-sm tracking-tight mb-2 group-hover:text-zinc-500 transition-colors">{{ product.name }}</h3>
            <p class="text-zinc-900 font-medium text-xs tracking-widest">{{ formatPrice(product.base_price) }}</p>
        </div>
    </router-link>
</template>
