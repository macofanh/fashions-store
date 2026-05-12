<script setup lang="ts">
import type { Product } from '@/pages/products/productService'
import ProductCard from '@/pages/products/components/ProductCard.vue'

defineProps<{
    products: Product[]
    isLoading: boolean
}>()

const PAGE_SIZE = 8
</script>

<template>
    <section class="max-w-[1600px] mx-auto px-6 md:px-12 py-20">
        <header class="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
                <p class="text-[10px] uppercase tracking-[0.4em] text-text-muted mb-2 font-display">Được tuyển chọn kỹ lưỡng</p>
                <h2 class="text-3xl md:text-4xl font-serif italic text-fashion-black">Bộ sưu tập nổi bật</h2>
            </div>
            <router-link
                to="/products"
                class="text-[10px] uppercase tracking-widest font-bold text-fashion-black border-b border-fashion-black pb-0.5 hover:text-primary hover:border-primary transition-all font-display"
            >
                Xem tất cả
            </router-link>
        </header>

        <!-- Skeleton -->
        <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            <div v-for="i in PAGE_SIZE" :key="i" class="animate-pulse">
                <div class="aspect-[3/4] bg-border-light rounded-lg mb-4"></div>
                <div class="h-3 bg-border-light rounded w-3/4 mb-2"></div>
                <div class="h-3 bg-border-light rounded w-1/3"></div>
            </div>
        </div>

        <!-- Grid -->
        <div v-else-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-10">
            <ProductCard
                v-for="product in products"
                :key="product.product_id"
                :product="product"
            />
        </div>

        <!-- Empty -->
        <div v-else class="text-center py-20 border border-dashed border-border-light rounded-lg">
            <p class="text-text-muted text-sm uppercase tracking-widest font-display">Hiện chưa có sản phẩm nào.</p>
        </div>
    </section>
</template>
