<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService } from '@/pages/products/productService'
import { cartService } from '@/pages/cart/cartService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCartStore } from '@/stores/useCartStore'
import { useUIStore } from '@/stores/useUIStore'

import ProductGallery from './components/ProductGallery.vue'
import ProductInfo    from './components/ProductInfo.vue'
import ProductReviews from './components/ProductReviews.vue'
import ReviewModal    from './components/ReviewModal.vue'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const uiStore   = useUIStore()

// ── State ──────────────────────────────────────────────────────────
const product        = ref<any>(null)
const reviews        = ref<any[]>([])
const isLoading      = ref(true)
const isAddingToCart = ref(false)
const isBuyingNow    = ref(false)
const selectedColor  = ref<any>(null)
const selectedSize   = ref<any>(null)
const quantity       = ref(1)
const showModal      = ref(false)

// ── Fetch ──────────────────────────────────────────────────────────
const fetchProduct = async () => {
    isLoading.value = true
    try {
        const res = await productService.getProductBySlug(route.params.slug as string)
        product.value = res.data

        if (product.value.variants?.length > 0) {
            selectedColor.value = product.value.variants[0].color
            selectedSize.value  = product.value.variants[0].size
        }

        const reviewsRes = await productService.getReviews(product.value.product_id)
        reviews.value = reviewsRes.data
    } catch (e) {
        console.error('Lỗi lấy chi tiết sản phẩm:', e)
    } finally {
        isLoading.value = false
    }
}

onMounted(fetchProduct)

// ── Computed ───────────────────────────────────────────────────────
const currentVariant = computed(() => {
    if (!product.value || !selectedColor.value || !selectedSize.value) return null
    return product.value.variants?.find(
        (v: any) => v.color_id === selectedColor.value.color_id && v.size_id === selectedSize.value.size_id
    ) ?? null
})

// ── Cart logic ─────────────────────────────────────────────────────
const validateSelection = () => {
    if (!currentVariant.value)                    { uiStore.warning('Vui lòng chọn màu sắc và kích thước.'); return false }
    if (currentVariant.value.stock_qty <= 0)      { uiStore.error('Sản phẩm này đã hết hàng.'); return false }
    return true
}

const addToCartLogic = async () => {
    if (authStore.isAuthenticated) {
        await cartService.addToCart(currentVariant.value.variant_id, quantity.value)
        await cartStore.fetchCart()
    } else {
        cartStore.addGuestItem({
            variant_id:   currentVariant.value.variant_id,
            product_name: product.value.name,
            variant_info: `${selectedColor.value?.name || ''} / ${selectedSize.value?.name || ''}`,
            image_url:    product.value.images?.[0]?.image_url || '',
            unit_price:   currentVariant.value.price || product.value.base_price,
            quantity:     quantity.value,
        })
    }
}

const handleAddToCart = async () => {
    if (!validateSelection()) return
    isAddingToCart.value = true
    try {
        await addToCartLogic()
        uiStore.success('Đã thêm vào giỏ hàng!')
    } catch { uiStore.error('Có lỗi xảy ra. Vui lòng thử lại.') }
    finally  { isAddingToCart.value = false }
}

const handleBuyNow = async () => {
    if (!validateSelection()) return
    if (!authStore.isAuthenticated) {
        router.push({ name: 'login', query: { redirect: route.fullPath } })
        return
    }
    isBuyingNow.value = true
    try {
        await addToCartLogic()
        router.push({ name: 'checkout' })
    } catch { uiStore.error('Có lỗi xảy ra. Vui lòng thử lại.') }
    finally  { isBuyingNow.value = false }
}

const handleSubmitReview = async (data: { rating: number; title: string; content: string; files: File[] }) => {
    if (!currentVariant.value) return
    const formData = new FormData()
    formData.append('variant_id', currentVariant.value.variant_id.toString())
    formData.append('rating',     data.rating.toString())
    formData.append('title',      data.title)
    formData.append('content',    data.content)
    data.files.forEach(f => formData.append('files', f))
    try {
        await productService.addReview(product.value.product_id, formData)
        uiStore.success('Cảm ơn bạn đã đánh giá!')
        showModal.value = false
        fetchProduct()
    } catch (e: any) {
        uiStore.error(e.response?.data?.detail || 'Lỗi khi gửi đánh giá.')
    }
}
</script>

<template>
    <!-- Loading -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-background-light">
        <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
    </div>

    <div v-else-if="product" class="bg-background-light min-h-screen pb-24">
        <div class="max-w-[1400px] mx-auto px-6 md:px-12 pt-10">

            <!-- Breadcrumb -->
            <nav class="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted mb-8 font-display">
                <router-link to="/" class="hover:text-primary transition-colors">Trang chủ</router-link>
                <span class="text-border-light">/</span>
                <router-link to="/products" class="hover:text-primary transition-colors">Bộ sưu tập</router-link>
                <span class="text-border-light">/</span>
                <span class="text-fashion-black font-medium truncate max-w-[200px]">{{ product.name }}</span>
            </nav>

            <!-- Product layout -->
            <div class="flex flex-col lg:flex-row gap-10 xl:gap-16">
                <ProductGallery
                    :images="product.images || []"
                    :product-name="product.name"
                />

                <ProductInfo
                    :product="product"
                    :variants="product.variants || []"
                    :selected-color="selectedColor"
                    :selected-size="selectedSize"
                    :quantity="quantity"
                    :review-count="reviews.length"
                    :is-adding-to-cart="isAddingToCart"
                    :is-buying-now="isBuyingNow"
                    @update:selected-color="selectedColor = $event"
                    @update:selected-size="selectedSize = $event"
                    @update:quantity="quantity = $event"
                    @add-to-cart="handleAddToCart"
                    @buy-now="handleBuyNow"
                />
            </div>

            <!-- Reviews -->
            <ProductReviews
                :reviews="reviews"
                :avg-rating="product.avg_rating"
                @open-modal="showModal = true"
            />
        </div>

        <!-- Review modal -->
        <ReviewModal
            v-if="showModal"
            @close="showModal = false"
            @submit="handleSubmitReview"
        />
    </div>
</template>
