<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { productService } from '@/pages/products/productService'
import { cartService } from '@/pages/cart/cartService'
import { getImageUrl } from '@/lib/urlHelper'
import { useAuthStore } from '@/stores/useAuthStore'
import { useCartStore } from '@/stores/useCartStore'
import { useUIStore } from '@/stores/useUIStore'

const route = useRoute()
const authStore = useAuthStore()
const cartStore = useCartStore()
const uiStore = useUIStore()

const product = ref<any>(null)
const reviews = ref<any[]>([])
const isLoading = ref(true)
const isAddingToCart = ref(false)
const selectedColor = ref<any>(null)
const selectedSize = ref<any>(null)
const quantity = ref(1)
const activeImage = ref('')

// Review modal
const isReviewModalOpen = ref(false)
const newReview = ref({ rating: 5, title: '', content: '', files: [] as File[] })

const fetchProduct = async () => {
    isLoading.value = true
    try {
        const slug = route.params.slug as string
        const response = await productService.getProductBySlug(slug)
        product.value = response.data

        if (product.value.images?.length > 0) {
            const primary = product.value.images.find((img: any) => img.is_primary) || product.value.images[0]
            activeImage.value = getImageUrl(primary.image_url)
        }

        if (product.value.variants?.length > 0) {
            selectedColor.value = product.value.variants[0].color
            selectedSize.value = product.value.variants[0].size
        }

        const reviewsRes = await productService.getReviews(product.value.product_id)
        reviews.value = reviewsRes.data
    } catch (error) {
        console.error('Lỗi lấy chi tiết sản phẩm:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(fetchProduct)

const availableColors = computed(() => {
    if (!product.value) return []
    const colors = product.value.variants.map((v: any) => v.color)
    return Array.from(new Map(colors.map((c: any) => [c.color_id, c])).values())
})

const availableSizes = computed(() => {
    if (!product.value || !selectedColor.value) return []
    return product.value.variants
        .filter((v: any) => v.color_id === selectedColor.value.color_id)
        .map((v: any) => v.size)
})

const currentVariant = computed(() => {
    if (!product.value || !selectedColor.value || !selectedSize.value) return null
    return product.value.variants.find(
        (v: any) => v.color_id === selectedColor.value.color_id && v.size_id === selectedSize.value.size_id
    )
})

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

// ── Add to cart: hỗ trợ cả guest và authenticated ──────────────
const handleAddToCart = async () => {
    if (!currentVariant.value) {
        uiStore.warning('Vui lòng chọn màu sắc và kích thước.')
        return
    }
    if (currentVariant.value.stock_qty <= 0) {
        uiStore.error('Sản phẩm này đã hết hàng.')
        return
    }

    isAddingToCart.value = true
    try {
        if (authStore.isAuthenticated) {
            // Đã đăng nhập → gọi API
            await cartService.addToCart(currentVariant.value.variant_id, quantity.value)
            await cartStore.fetchCart()
        } else {
            // Chưa đăng nhập → lưu vào guest cart (LocalStorage)
            cartStore.addGuestItem({
                variant_id: currentVariant.value.variant_id,
                product_name: product.value.name,
                variant_info: `${selectedColor.value?.name || ''} / ${selectedSize.value?.name || ''}`,
                image_url: product.value.images?.[0]?.image_url || '',
                unit_price: currentVariant.value.price || product.value.base_price,
                quantity: quantity.value,
            })
        }
        uiStore.success('Đã thêm vào giỏ hàng!')
    } catch (error) {
        uiStore.error('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
        isAddingToCart.value = false
    }
}

const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) newReview.value.files = Array.from(target.files)
}

const submitReview = async () => {
    if (!currentVariant.value) return
    const formData = new FormData()
    formData.append('variant_id', currentVariant.value.variant_id.toString())
    formData.append('rating', newReview.value.rating.toString())
    formData.append('title', newReview.value.title)
    formData.append('content', newReview.value.content)
    newReview.value.files.forEach(file => formData.append('files', file))

    try {
        await productService.addReview(product.value.product_id, formData)
        uiStore.success('Cảm ơn bạn đã đánh giá!')
        isReviewModalOpen.value = false
        fetchProduct()
    } catch (error: any) {
        uiStore.error(error.response?.data?.detail || 'Lỗi khi gửi đánh giá.')
    }
}
</script>

<template>
    <!-- Loading -->
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center bg-background-light">
        <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
    </div>

    <div v-else-if="product" class="bg-white min-h-screen pb-24">
        <div class="max-w-[1600px] mx-auto px-6 md:px-12 pt-12">

            <!-- ── PRODUCT LAYOUT ── -->
            <div class="flex flex-col lg:flex-row gap-16">

                <!-- Gallery -->
                <div class="w-full lg:w-3/5 flex gap-4">
                    <!-- Thumbnails -->
                    <div class="hidden md:flex flex-col gap-3 w-20 shrink-0">
                        <div
                            v-for="(img, idx) in product.images"
                            :key="idx"
                            @click="activeImage = getImageUrl(img.image_url)"
                            :class="[
                                'aspect-[3/4] cursor-pointer overflow-hidden border-2 transition-all',
                                activeImage === getImageUrl(img.image_url)
                                    ? 'border-primary'
                                    : 'border-transparent hover:border-border-light'
                            ]"
                        >
                            <img :src="getImageUrl(img.image_url)" class="w-full h-full object-cover" :alt="`${product.name} ${idx + 1}`" />
                        </div>
                    </div>
                    <!-- Main image -->
                    <div class="flex-grow aspect-[3/4] bg-fashion-gray overflow-hidden">
                        <img :src="activeImage" class="w-full h-full object-cover" :alt="product.name" />
                    </div>
                </div>

                <!-- Info -->
                <div class="w-full lg:w-2/5">
                    <div class="sticky top-32">
                        <!-- Breadcrumb -->
                        <nav class="flex gap-2 text-[9px] uppercase tracking-[0.2em] text-text-muted mb-8">
                            <router-link to="/" class="hover:text-primary transition-colors">Trang chủ</router-link>
                            <span>/</span>
                            <router-link to="/products" class="hover:text-primary transition-colors">Bộ sưu tập</router-link>
                            <span>/</span>
                            <span class="text-fashion-black">{{ product.name }}</span>
                        </nav>

                        <!-- Title & Price -->
                        <div class="mb-10">
                            <p class="text-[10px] uppercase tracking-[0.4em] text-text-muted mb-3">{{ product.brand || 'Azure Editorial' }}</p>
                            <h1 class="text-4xl font-serif italic text-fashion-black mb-4 leading-tight">{{ product.name }}</h1>
                            <div class="flex items-center gap-4">
                                <p class="text-2xl font-medium text-fashion-black tracking-wide">
                                    {{ formatPrice(currentVariant?.price || product.base_price) }}
                                </p>
                                <div v-if="product.avg_rating > 0" class="flex items-center gap-1">
                                    <span class="material-symbols-outlined text-amber-400 text-[16px]" style="font-variation-settings:'FILL' 1">star</span>
                                    <span class="text-sm text-text-muted font-medium">{{ product.avg_rating.toFixed(1) }}</span>
                                    <span class="text-[10px] text-text-muted">({{ reviews.length }})</span>
                                </div>
                            </div>
                        </div>

                        <!-- Color -->
                        <div class="mb-8">
                            <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-fashion-black mb-3">
                                Màu sắc:
                                <span class="font-normal text-text-muted ml-2">{{ selectedColor?.name }}</span>
                            </h3>
                            <div class="flex gap-3 flex-wrap">
                                <button
                                    v-for="color in availableColors"
                                    :key="color.color_id"
                                    @click="selectedColor = color"
                                    :title="color.name"
                                    :class="[
                                        'w-9 h-9 rounded-full border-2 p-1 transition-all',
                                        selectedColor?.color_id === color.color_id
                                            ? 'border-primary scale-110 shadow-md'
                                            : 'border-border-light hover:border-primary'
                                    ]"
                                >
                                    <div
                                        :style="{ backgroundColor: color.hex_code || '#eee' }"
                                        class="w-full h-full rounded-full border border-black/5"
                                    ></div>
                                </button>
                            </div>
                        </div>

                        <!-- Size -->
                        <div class="mb-8">
                            <div class="flex justify-between items-center mb-3">
                                <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-fashion-black">Kích thước</h3>
                                <button class="text-[9px] uppercase tracking-[0.1em] text-text-muted underline underline-offset-4 hover:text-primary transition-colors">
                                    Hướng dẫn chọn size
                                </button>
                            </div>
                            <div class="grid grid-cols-4 gap-2">
                                <button
                                    v-for="size in availableSizes"
                                    :key="size.size_id"
                                    @click="selectedSize = size"
                                    :class="[
                                        'py-3 text-[10px] font-bold border transition-all',
                                        selectedSize?.size_id === size.size_id
                                            ? 'border-primary bg-primary text-white'
                                            : 'border-border-light text-text-muted hover:border-primary hover:text-primary'
                                    ]"
                                >
                                    {{ size.name }}
                                </button>
                            </div>
                        </div>

                        <!-- Quantity -->
                        <div class="mb-8">
                            <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-fashion-black mb-3">Số lượng</h3>
                            <div class="flex items-center gap-0 border border-border-light w-fit">
                                <button
                                    @click="quantity = Math.max(1, quantity - 1)"
                                    class="w-10 h-10 flex items-center justify-center hover:bg-primary-light text-fashion-black transition-colors"
                                >
                                    <span class="material-symbols-outlined text-[18px]">remove</span>
                                </button>
                                <span class="w-12 h-10 flex items-center justify-center text-sm font-bold border-x border-border-light">{{ quantity }}</span>
                                <button
                                    @click="quantity++"
                                    class="w-10 h-10 flex items-center justify-center hover:bg-primary-light text-fashion-black transition-colors"
                                >
                                    <span class="material-symbols-outlined text-[18px]">add</span>
                                </button>
                            </div>
                        </div>

                        <!-- Stock status -->
                        <div v-if="currentVariant" class="mb-6">
                            <p v-if="currentVariant.stock_qty <= 0" class="text-red-500 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">cancel</span>
                                Hết hàng
                            </p>
                            <p v-else-if="currentVariant.stock_qty <= currentVariant.low_stock_threshold" class="text-amber-600 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">warning</span>
                                Chỉ còn {{ currentVariant.stock_qty }} sản phẩm!
                            </p>
                            <p v-else class="text-green-600 text-[10px] uppercase font-bold tracking-widest flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px]">check_circle</span>
                                Còn hàng
                            </p>
                        </div>

                        <!-- Guest notice -->
                        <div v-if="!authStore.isAuthenticated" class="mb-4 px-4 py-3 bg-primary-light border border-primary/20 flex items-center gap-2">
                            <span class="material-symbols-outlined text-primary text-[16px]">info</span>
                            <p class="text-[10px] text-fashion-black">
                                Bạn có thể thêm vào giỏ mà không cần đăng nhập.
                                <router-link :to="{ name: 'login' }" class="text-primary font-bold underline underline-offset-2 ml-1">Đăng nhập</router-link>
                                để thanh toán.
                            </p>
                        </div>

                        <!-- CTA Buttons -->
                        <div class="flex flex-col gap-3">
                            <button
                                @click="handleAddToCart"
                                :disabled="!currentVariant || currentVariant.stock_qty <= 0 || isAddingToCart"
                                class="w-full bg-primary text-white py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-primary-dark transition-all active:scale-[0.98] disabled:bg-border-light disabled:text-text-muted flex items-center justify-center gap-2"
                            >
                                <span v-if="isAddingToCart" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                <span class="material-symbols-outlined text-[18px]" v-else>shopping_bag</span>
                                {{ currentVariant?.stock_qty > 0 ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng' }}
                            </button>
                            <button class="w-full border border-border-light py-5 text-[11px] font-bold tracking-[0.3em] uppercase hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-3 group">
                                <span class="material-symbols-outlined text-lg transition-transform group-hover:scale-125">favorite</span>
                                Thêm vào yêu thích
                            </button>
                        </div>

                        <!-- Description -->
                        <div class="mt-12 pt-8 border-t border-border-light">
                            <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-fashion-black mb-4">Chi tiết sản phẩm</h3>
                            <p class="text-text-muted text-sm font-light leading-relaxed">
                                {{ product.description || 'Mô tả sản phẩm đang được cập nhật...' }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- ── REVIEWS ── -->
            <div class="mt-32 pt-20 border-t border-border-light">
                <div class="flex justify-between items-end mb-16">
                    <div>
                        <h2 class="text-3xl font-serif italic text-fashion-black mb-2">Đánh giá từ khách hàng</h2>
                        <div class="flex items-center gap-4">
                            <div class="flex text-amber-400">
                                <span
                                    v-for="i in 5"
                                    :key="i"
                                    class="material-symbols-outlined text-sm"
                                    :style="i <= Math.round(product.avg_rating) ? 'font-variation-settings:\'FILL\' 1' : ''"
                                >star</span>
                            </div>
                            <span class="text-[10px] uppercase tracking-widest font-bold text-text-muted">{{ reviews.length }} nhận xét</span>
                        </div>
                    </div>
                    <button
                        @click="isReviewModalOpen = true"
                        class="border border-fashion-black px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-fashion-black hover:text-white transition-all"
                    >
                        Viết đánh giá
                    </button>
                </div>

                <div v-if="reviews.length === 0" class="text-center py-20 text-text-muted italic font-light border border-dashed border-border-light">
                    Chưa có đánh giá nào. Hãy là người đầu tiên!
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-12">
                    <div v-for="review in reviews" :key="review.review_id" class="space-y-3 pb-12 border-b border-border-light last:border-0">
                        <div class="flex justify-between items-start">
                            <div class="flex text-amber-400">
                                <span
                                    v-for="i in 5"
                                    :key="i"
                                    class="material-symbols-outlined text-[14px]"
                                    :style="i <= review.rating ? 'font-variation-settings:\'FILL\' 1' : ''"
                                >star</span>
                            </div>
                            <span class="text-[9px] text-text-muted italic">{{ new Date(review.created_at).toLocaleDateString('vi-VN') }}</span>
                        </div>
                        <h4 class="text-sm font-bold text-fashion-black uppercase tracking-tight">{{ review.title }}</h4>
                        <p class="text-xs text-text-muted font-light leading-relaxed">{{ review.content }}</p>
                        <div v-if="review.images?.length" class="flex gap-2 pt-1">
                            <div v-for="img in review.images" :key="img.image_id" class="w-16 h-16 border border-border-light overflow-hidden">
                                <img :src="getImageUrl(img.image_url)" class="w-full h-full object-cover" />
                            </div>
                        </div>
                        <div class="flex items-center gap-2 pt-1">
                            <div class="w-6 h-6 bg-primary-light rounded-full flex items-center justify-center text-[8px] font-bold text-primary">V</div>
                            <span class="text-[9px] uppercase tracking-widest font-bold text-text-muted">Verified Buyer</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Review Modal -->
        <div v-if="isReviewModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-fashion-black/60 backdrop-blur-sm">
            <div class="bg-white w-full max-w-xl shadow-2xl p-10 space-y-8">
                <header class="flex justify-between items-center">
                    <h2 class="text-2xl font-serif italic">Chia sẻ cảm nhận</h2>
                    <button @click="isReviewModalOpen = false" class="material-symbols-outlined text-text-muted hover:text-fashion-black">close</button>
                </header>
                <div class="space-y-6">
                    <div class="space-y-2">
                        <label class="section-label">Đánh giá sao</label>
                        <div class="flex gap-2">
                            <button v-for="i in 5" :key="i" @click="newReview.rating = i">
                                <span
                                    class="material-symbols-outlined text-amber-400 text-2xl"
                                    :style="i <= newReview.rating ? 'font-variation-settings:\'FILL\' 1' : ''"
                                >star</span>
                            </button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="section-label">Tiêu đề</label>
                        <input v-model="newReview.title" type="text" class="input-underline" placeholder="Rất hài lòng / Chất vải đẹp..." />
                    </div>
                    <div class="space-y-2">
                        <label class="section-label">Nội dung</label>
                        <textarea v-model="newReview.content" rows="4" class="input-box resize-none" placeholder="Hãy chia sẻ trải nghiệm của bạn..."></textarea>
                    </div>
                    <div class="space-y-2">
                        <label class="section-label">Hình ảnh thực tế</label>
                        <input type="file" multiple accept="image/*" @change="handleFileChange" class="w-full text-xs text-text-muted file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-fashion-black file:text-white hover:file:bg-zinc-800" />
                    </div>
                </div>
                <button @click="submitReview" class="btn-dark w-full py-4">Gửi đánh giá</button>
            </div>
        </div>
    </div>
</template>
