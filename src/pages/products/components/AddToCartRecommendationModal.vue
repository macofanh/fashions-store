<script setup lang="ts">
import { getImageUrl } from '@/lib/urlHelper'

defineProps<{
    recommendations: any[]
    productName: string
    productPrice: number
    productImage: string | null
}>()

const emit = defineEmits<{
    close: []
    goToCart: []
}>()

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
</script>

<template>
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-fashion-black/60 backdrop-blur-sm animate-fade-in">
        <div class="bg-white w-full max-w-2xl rounded-xl shadow-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto transform transition-all duration-300 scale-100">
            
            <!-- Header/Success Banner -->
            <header class="flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4 border-b border-border-light pb-5">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600 flex-shrink-0 animate-scale-up">
                        <span class="material-symbols-outlined text-xl">check_circle</span>
                    </div>
                    <div class="text-center sm:text-left">
                        <h2 class="text-lg font-bold text-fashion-black font-display">Đã thêm vào giỏ hàng thành công!</h2>
                        <p class="text-xs text-text-muted mt-0.5">{{ productName }} ({{ formatPrice(productPrice) }})</p>
                    </div>
                </div>
                <button 
                    @click="emit('close')"
                    class="absolute top-4 right-4 sm:static w-8 h-8 flex items-center justify-center rounded-full hover:bg-border-light transition-colors"
                >
                    <span class="material-symbols-outlined text-text-muted">close</span>
                </button>
            </header>

            <!-- Recommendations Section -->
            <div class="space-y-4">
                <div>
                    <h3 class="text-sm font-bold uppercase tracking-wider text-text-muted font-display">Sản phẩm thường được mua kèm</h3>
                    <p class="text-xs text-text-muted/70 font-display mt-0.5">Khách hàng mua sản phẩm này cũng thường mua các sản phẩm dưới đây:</p>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <router-link
                        v-for="item in recommendations"
                        :key="item.product_id"
                        :to="{ name: 'product-detail', params: { slug: item.slug } }"
                        @click="emit('close')"
                        class="group cursor-pointer block p-2 rounded-xl hover:bg-fashion-gray/50 transition-all border border-transparent hover:border-border-light"
                    >
                        <!-- Image -->
                        <div class="relative aspect-[3/4] overflow-hidden bg-fashion-gray rounded-lg mb-2.5 border border-border-light">
                            <img
                                v-if="item.image_url"
                                :src="getImageUrl(item.image_url)"
                                :alt="item.name"
                                class="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                            />
                            <div v-else class="w-full h-full flex items-center justify-center">
                                <span class="material-symbols-outlined text-3xl text-text-muted/20">image_not_supported</span>
                            </div>
                            <div class="absolute inset-0 bg-fashion-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>

                        <!-- Info -->
                        <div class="space-y-0.5 px-0.5">
                            <h4 class="text-xs font-semibold text-fashion-black group-hover:text-primary transition-colors line-clamp-1 leading-snug font-display">
                                {{ item.name }}
                            </h4>
                            <p class="text-xs font-bold text-primary font-display">{{ formatPrice(item.base_price) }}</p>
                        </div>
                    </router-link>
                </div>
            </div>

            <!-- Footer Buttons -->
            <footer class="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                    @click="emit('close')"
                    class="w-full sm:flex-1 border border-border-light text-fashion-black py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-fashion-gray transition-all font-display cursor-pointer"
                >
                    Tiếp tục mua sắm
                </button>
                <button
                    @click="emit('goToCart')"
                    class="w-full sm:flex-1 bg-primary text-white py-3 rounded-lg text-xs font-bold tracking-widest uppercase hover:bg-primary-dark transition-all font-display cursor-pointer flex items-center justify-center gap-1.5"
                >
                    <span class="material-symbols-outlined text-sm">shopping_bag</span>
                    Xem giỏ hàng
                </button>
            </footer>
        </div>
    </div>
</template>

<style scoped>
@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes scaleUp {
    from { transform: scale(0.9); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
.animate-fade-in {
    animation: fadeIn 0.25s ease-out forwards;
}
.animate-scale-up {
    animation: scaleUp(0.2s) ease-out forwards;
}
</style>
