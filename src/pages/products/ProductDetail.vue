<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService } from '@/pages/products/productService'
import { cartService } from '@/pages/cart/cartService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCartStore } from '@/stores/useCartStore'
import { useUIStore } from '@/stores/useUIStore'
import { getImageUrl } from '@/lib/urlHelper'

import ProductGallery from './components/ProductGallery.vue'
import ProductInfo    from './components/ProductInfo.vue'
import ProductReviews from './components/ProductReviews.vue'
import ReviewModal    from './components/ReviewModal.vue'
import AddToCartRecommendationModal from './components/AddToCartRecommendationModal.vue'

const route     = useRoute()
const router    = useRouter()
const authStore = useAuthStore()
const cartStore = useCartStore()
const uiStore   = useUIStore()

// ── State ──────────────────────────────────────────────────────────
const product          = ref<any>(null)
const reviews          = ref<any[]>([])
const recommendations  = ref<any[]>([])
const isProductLoading  = ref(true)
const isReviewsLoading  = ref(true)
const isRecommendationsLoading = ref(true)
const isAddingToCart    = ref(false)
const isBuyingNow       = ref(false)
const isStockNotificationSubscribed = ref(false)
const isStockNotificationLoading = ref(false)
const selectedColor     = ref<any>(null)
const selectedSize      = ref<any>(null)
const quantity          = ref(1)
const showModal         = ref(false)
const showAddToCartModal = ref(false)
let productRequestId    = 0

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

// ── Fetch ──────────────────────────────────────────────────────────
const resetProductState = () => {
    product.value = null
    reviews.value = []
    recommendations.value = []
    selectedColor.value = null
    selectedSize.value = null
    quantity.value = 1
    showModal.value = false
    showAddToCartModal.value = false
}

const fetchProduct = async (slug: string) => {
    const requestId = ++productRequestId
    isProductLoading.value = true
    isReviewsLoading.value = true
    resetProductState()

    try {
        const res = await productService.getProductBySlug(slug)
        if (requestId !== productRequestId) return

        product.value = res.data

        if (product.value.variants?.length > 0) {
            selectedColor.value = product.value.variants[0].color
            selectedSize.value  = product.value.variants[0].size
        }

        void fetchReviews(product.value.product_id, requestId)
        void fetchRecommendations(product.value.product_id, requestId)
    } catch (e) {
        console.error('Lỗi lấy chi tiết sản phẩm:', e)
    } finally {
        if (requestId === productRequestId) isProductLoading.value = false
    }
}

const fetchReviews = async (productId: number, requestId = productRequestId) => {
    isReviewsLoading.value = true
    try {
        const reviewsRes = await productService.getReviews(productId)
        if (requestId !== productRequestId) return

        reviews.value = reviewsRes.data
    } catch (e) {
        console.error('Lỗi lấy đánh giá:', e)
    } finally {
        if (requestId === productRequestId) isReviewsLoading.value = false
    }
}

const fetchRecommendations = async (productId: number, requestId = productRequestId) => {
    isRecommendationsLoading.value = true
    try {
        const res = await productService.getRecommendations(productId)
        if (requestId !== productRequestId) return

        recommendations.value = res.data
    } catch (e) {
        console.error('Lỗi lấy gợi ý sản phẩm:', e)
    } finally {
        if (requestId === productRequestId) isRecommendationsLoading.value = false
    }
}

watch(
    () => route.params.slug,
    (slug) => {
        if (typeof slug === 'string' && slug.trim()) void fetchProduct(slug)
    },
    { immediate: true }
)

// ── Computed ───────────────────────────────────────────────────────
const currentVariant = computed(() => {
    if (!product.value || !selectedColor.value || !selectedSize.value) return null
    return product.value.variants?.find(
        (v: any) => v.color_id === selectedColor.value.color_id && v.size_id === selectedSize.value.size_id
    ) ?? null
})

const fetchStockNotificationStatus = async () => {
    const variant = currentVariant.value
    isStockNotificationSubscribed.value = false
    if (!variant || variant.stock_qty > 0 || !authStore.isAuthenticated) return

    isStockNotificationLoading.value = true
    try {
        const response = await productService.getStockNotificationStatus(variant.variant_id)
        if (currentVariant.value?.variant_id === variant.variant_id) {
            isStockNotificationSubscribed.value = response.data.subscribed
        }
    } catch (error) {
        console.error('Lỗi lấy trạng thái thông báo tồn kho:', error)
    } finally {
        if (currentVariant.value?.variant_id === variant.variant_id) {
            isStockNotificationLoading.value = false
        }
    }
}

watch(
    () => currentVariant.value?.variant_id,
    () => void fetchStockNotificationStatus(),
)

const handleToggleStockNotification = async () => {
    const variant = currentVariant.value
    if (!variant || variant.stock_qty > 0) return

    if (!authStore.isAuthenticated) {
        router.push({ name: 'login', query: { redirect: route.fullPath } })
        return
    }

    const isSubscribed = isStockNotificationSubscribed.value
    const confirmed = await uiStore.confirm({
        title: isSubscribed ? 'Hủy thông báo có hàng' : 'Thông báo khi có hàng',
        message: isSubscribed
            ? `Bạn có muốn hủy nhận email khi ${product.value.name} (${selectedColor.value?.name} / ${selectedSize.value?.name}) có hàng không?`
            : `Chúng tôi sẽ gửi email tới tài khoản của bạn khi ${product.value.name} (${selectedColor.value?.name} / ${selectedSize.value?.name}) có hàng trở lại.`,
        confirmLabel: isSubscribed ? 'Xác nhận hủy' : 'Xác nhận',
        cancelLabel: 'Hủy',
        variant: isSubscribed ? 'danger' : 'primary',
    })
    if (!confirmed) return

    isStockNotificationLoading.value = true
    try {
        const response = isSubscribed
            ? await productService.unsubscribeStockNotification(variant.variant_id)
            : await productService.subscribeStockNotification(variant.variant_id)
        isStockNotificationSubscribed.value = response.data.subscribed
        uiStore.success(response.data.message)
    } catch (error: any) {
        uiStore.error(
            error.response?.data?.detail || 'Không thể cập nhật thông báo tồn kho.',
        )
    } finally {
        isStockNotificationLoading.value = false
    }
}

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
        if (recommendations.value && recommendations.value.length > 0) {
            showAddToCartModal.value = true
        } else {
            uiStore.success('Đã thêm vào giỏ hàng!')
        }
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
    if (!product.value) return
    if (!currentVariant.value) {
        uiStore.warning('Vui lòng chọn màu sắc và kích thước trước khi đánh giá.')
        return
    }

    try {
        await productService.addReview(product.value.product_id, {
            variant_id: currentVariant.value.variant_id,
            rating:     data.rating,
            title:      data.title.trim()   || undefined,
            content:    data.content.trim() || undefined,
            files:      data.files,
        })
        uiStore.success('Cảm ơn bạn đã đánh giá!')
        showModal.value = false
        // Reload reviews + avg_rating song song
        const [reviewsRes, productRes] = await Promise.all([
            productService.getReviews(product.value.product_id),
            productService.getProductBySlug(route.params.slug as string),
        ])
        reviews.value = reviewsRes.data
        product.value = productRes.data
    } catch (e: any) {
        const detail = e.response?.data?.detail
        console.error('[Review error]', JSON.stringify(detail, null, 2))
        if (Array.isArray(detail)) {
            const msg = detail.map((d: any) => `${d.loc?.slice(-1)[0]}: ${d.msg}`).join(' | ')
            uiStore.error(msg)
        } else if (typeof detail === 'string') {
            uiStore.error(detail)
        } else {
            uiStore.error('Lỗi khi gửi đánh giá. Vui lòng thử lại.')
        }
    }
}
</script>

<template>
    <!-- Loading -->
    <div v-if="isProductLoading" class="min-h-screen flex items-center justify-center bg-background-light">
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
                    :is-stock-notification-subscribed="isStockNotificationSubscribed"
                    :is-stock-notification-loading="isStockNotificationLoading"
                    @update:selected-color="selectedColor = $event"
                    @update:selected-size="selectedSize = $event"
                    @update:quantity="quantity = $event"
                    @add-to-cart="handleAddToCart"
                    @buy-now="handleBuyNow"
                    @toggle-stock-notification="handleToggleStockNotification"
                />
            </div>

            <!-- Reviews -->
            <ProductReviews
                :reviews="reviews"
                :avg-rating="product.avg_rating"
                :is-loading="isReviewsLoading"
                @open-modal="showModal = true"
            />

            <!-- Frequently bought together / Recommendations -->
            <div v-if="recommendations.length > 0" class="mt-20 pt-16 border-t border-border-light">
                <div class="mb-10 text-center">
                    <h3 class="text-2xl md:text-3xl font-serif italic text-fashion-black mb-2">Thường được mua kèm</h3>
                    <p class="text-text-muted text-xs tracking-wider uppercase font-display">Gợi ý dựa trên xu hướng mua sắm</p>
                </div>
                
                <div class="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    <router-link
                        v-for="item in recommendations"
                        :key="item.product_id"
                        :to="{ name: 'product-detail', params: { slug: item.slug } }"
                        class="group cursor-pointer block"
                    >
                        <!-- Image -->
                        <div class="relative aspect-[3/4] overflow-hidden bg-fashion-gray rounded-xl mb-3 border border-border-light">
                            <img
                                v-if="item.image_url"
                                :src="getImageUrl(item.image_url)"
                                :alt="item.name"
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
                        </div>

                        <!-- Info -->
                        <div class="space-y-1 px-0.5">
                            <h4 class="text-sm font-semibold text-fashion-black group-hover:text-primary transition-colors line-clamp-2 leading-snug font-display">
                                {{ item.name }}
                            </h4>
                            <p class="text-sm font-bold text-primary font-display">{{ formatPrice(item.base_price) }}</p>
                        </div>
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Review modal -->
        <ReviewModal
            v-if="showModal"
            @close="showModal = false"
            @submit="handleSubmitReview"
        />

        <!-- Add to Cart Recommendation Modal -->
        <AddToCartRecommendationModal
            v-if="showAddToCartModal"
            :recommendations="recommendations"
            :product-name="product.name"
            :product-price="currentVariant ? currentVariant.price : product.base_price"
            :product-image="product.images?.[0]?.image_url || null"
            @close="showAddToCartModal = false"
            @go-to-cart="router.push({ name: 'cart' })"
        />
    </div>
</template>
