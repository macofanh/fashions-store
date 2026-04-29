<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute } from 'vue-router'
import { productService } from '@/api/productService'
import { cartService } from '@/api/cartService'
import { getImageUrl } from '@/api/urlHelper'

const route = useRoute()
const product = ref<any>(null)
const reviews = ref<any[]>([])
const isLoading = ref(true)
const selectedColor = ref<any>(null)
const selectedSize = ref<any>(null)
const quantity = ref(1)
const activeImage = ref('')

// Form review mới
const isReviewModalOpen = ref(false)
const newReview = ref({
    rating: 5,
    title: '',
    content: '',
    files: [] as File[]
})

const fetchProduct = async () => {
    isLoading.value = true
    try {
        const slug = route.params.slug as string
        const response = await productService.getProductBySlug(slug)
        product.value = response.data
        
        // Set default values
        if (product.value.images.length > 0) {
            const rawImg = product.value.images.find((img: any) => img.is_primary)?.image_url || product.value.images[0].image_url
            activeImage.value = getImageUrl(rawImg)
        }
        
        if (product.value.variants.length > 0) {
            selectedColor.value = product.value.variants[0].color
            selectedSize.value = product.value.variants[0].size
        }

        // Lấy reviews
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
    return product.value.variants.find((v: any) => 
        v.color_id === selectedColor.value.color_id && 
        v.size_id === selectedSize.value.size_id
    )
})

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const handleAddToCart = async () => {
    if (!currentVariant.value) return
    
    try {
        await cartService.addToCart(currentVariant.value.variant_id, quantity.value)
        alert('Đã thêm sản phẩm vào giỏ hàng!')
    } catch (error) {
        alert('Vui lòng đăng nhập để thêm vào giỏ hàng.')
    }
}

const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) {
        newReview.value.files = Array.from(target.files)
    }
}

const submitReview = async () => {
    if (!currentVariant.value) return
    const formData = new FormData()
    formData.append('variant_id', currentVariant.value.variant_id.toString())
    formData.append('rating', newReview.value.rating.toString())
    formData.append('title', newReview.value.title)
    formData.append('content', newReview.value.content)
    newReview.value.files.forEach(file => {
        formData.append('files', file)
    })

    try {
        await productService.addReview(product.value.product_id, formData)
        alert('Cảm ơn bạn đã đánh giá!')
        isReviewModalOpen.value = false
        fetchProduct() // Reload
    } catch (error: any) {
        alert(error.response?.data?.detail || 'Lỗi khi gửi đánh giá.')
    }
}
</script>

<template>
    <div v-if="isLoading" class="min-h-screen flex items-center justify-center">
        <div class="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full"></div>
    </div>

    <div v-else-if="product" class="bg-white min-h-screen pb-24">
        <div class="max-w-[1600px] mx-auto px-6 md:px-12 pt-12">
            <div class="flex flex-col lg:flex-row gap-16">
                <!-- Gallery Section -->
                <div class="w-full lg:w-3/5 flex gap-4">
                    <div class="hidden md:flex flex-col gap-4 w-20 shrink-0">
                        <div 
                            v-for="(img, idx) in product.images" 
                            :key="idx"
                            @click="activeImage = getImageUrl(img.image_url)"
                            :class="['aspect-[3/4] cursor-pointer overflow-hidden border', activeImage === getImageUrl(img.image_url) ? 'border-zinc-900' : 'border-transparent']"
                        >
                            <img :src="getImageUrl(img.image_url)" class="w-full h-full object-cover" />
                        </div>
                    </div>
                    <div class="flex-grow aspect-[3/4] bg-zinc-50 overflow-hidden">
                        <img :src="activeImage" class="w-full h-full object-cover" />
                    </div>
                </div>

                <!-- Info Section -->
                <div class="w-full lg:w-2/5">
                    <div class="sticky top-32">
                        <nav class="flex gap-2 text-[9px] uppercase tracking-[0.2em] text-zinc-400 mb-8">
                            <router-link to="/">Trang chủ</router-link>
                            <span>/</span>
                            <router-link to="/products">Bộ sưu tập</router-link>
                            <span>/</span>
                            <span class="text-zinc-900">{{ product.name }}</span>
                        </nav>

                        <div class="mb-10">
                            <p class="text-[10px] uppercase tracking-[0.4em] text-zinc-400 mb-4">{{ product.brand || 'Luxury Store' }}</p>
                            <h1 class="text-4xl serif-text text-zinc-900 mb-4 leading-tight">{{ product.name }}</h1>
                            <p class="text-xl tracking-widest text-zinc-900">{{ formatPrice(currentVariant?.price || product.base_price) }}</p>
                        </div>

                        <!-- Color Selection -->
                        <div class="mb-10">
                            <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 mb-4">Màu sắc: <span class="font-normal text-zinc-500 ml-2 uppercase">{{ selectedColor?.name }}</span></h3>
                            <div class="flex gap-3">
                                <button 
                                    v-for="color in availableColors" 
                                    :key="color.color_id"
                                    @click="selectedColor = color"
                                    :class="['w-8 h-8 rounded-full border p-1 transition-all', selectedColor?.color_id === color.color_id ? 'border-zinc-900 scale-110' : 'border-zinc-200']"
                                >
                                    <div :style="{ backgroundColor: color.hex_code || '#eee' }" class="w-full h-full rounded-full border border-black/5"></div>
                                </button>
                            </div>
                        </div>

                        <!-- Size Selection -->
                        <div class="mb-10">
                            <div class="flex justify-between items-center mb-4">
                                <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900">Kích thước</h3>
                                <button class="text-[9px] uppercase tracking-[0.1em] text-zinc-400 underline underline-offset-4">Hướng dẫn chọn size</button>
                            </div>
                            <div class="grid grid-cols-4 gap-2">
                                <button 
                                    v-for="size in availableSizes" 
                                    :key="size.size_id"
                                    @click="selectedSize = size"
                                    :class="['py-4 text-[10px] font-bold border transition-all', selectedSize?.size_id === size.size_id ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-zinc-200 text-zinc-500 hover:border-zinc-400']"
                                >
                                    {{ size.name }}
                                </button>
                            </div>
                        </div>

                        <!-- Stock Status -->
                        <div v-if="currentVariant" class="mb-8">
                             <p v-if="currentVariant.stock_qty <= 0" class="text-red-500 text-[10px] uppercase font-bold tracking-widest">Hết hàng</p>
                             <p v-else-if="currentVariant.stock_qty <= currentVariant.low_stock_threshold" class="text-amber-600 text-[10px] uppercase font-bold tracking-widest italic">Chỉ còn {{ currentVariant.stock_qty }} sản phẩm cuối cùng!</p>
                        </div>

                        <!-- Add to Cart -->
                        <div class="flex flex-col gap-4">
                            <button 
                                @click="handleAddToCart"
                                :disabled="!currentVariant || currentVariant.stock_qty <= 0"
                                class="w-full bg-zinc-900 text-white py-6 text-[11px] font-bold tracking-[0.3em] uppercase hover:bg-zinc-800 transition-all active:scale-[0.98] disabled:bg-zinc-100 disabled:text-zinc-400"
                            >
                                {{ currentVariant?.stock_qty > 0 ? 'Thêm vào giỏ hàng' : 'Tạm hết hàng' }}
                            </button>
                            <button class="w-full border border-zinc-200 py-6 text-[11px] font-bold tracking-[0.3em] uppercase hover:border-zinc-900 transition-all flex items-center justify-center gap-3 group">
                                <span class="material-symbols-outlined text-lg transition-transform group-hover:scale-125">favorite</span>
                                Thêm vào danh sách yêu thích
                            </button>
                        </div>

                        <!-- Description -->
                        <div class="mt-16 pt-10 border-t border-zinc-100">
                            <h3 class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 mb-4">Chi tiết sản phẩm</h3>
                            <p class="text-zinc-500 text-sm font-light leading-relaxed">
                                {{ product.description || 'Mô tả sản phẩm đang được cập nhật...' }}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Review Section -->
            <div class="mt-32 pt-20 border-t border-zinc-100">
                <div class="flex justify-between items-end mb-16">
                    <div>
                        <h2 class="text-3xl serif-text italic text-zinc-900 mb-2">Đánh giá từ khách hàng</h2>
                        <div class="flex items-center gap-4">
                             <div class="flex text-zinc-900">
                                <span v-for="i in 5" :key="i" class="material-symbols-outlined text-sm">
                                    {{ i <= Math.round(product.avg_rating) ? 'star' : 'star_outline' }}
                                </span>
                            </div>
                            <span class="text-[10px] uppercase tracking-widest font-bold text-zinc-400">{{ reviews.length }} nhận xét</span>
                        </div>
                    </div>
                    <button @click="isReviewModalOpen = true" class="border border-zinc-900 px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-900 hover:text-white transition-all">Viết đánh giá</button>
                </div>

                <div v-if="reviews.length === 0" class="text-center py-20 text-zinc-400 italic font-light">
                    Chưa có đánh giá nào cho sản phẩm này.
                </div>

                <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-x-20 gap-y-16">
                    <div v-for="review in reviews" :key="review.review_id" class="space-y-4">
                        <div class="flex justify-between items-start">
                            <div class="flex text-zinc-900">
                                <span v-for="i in 5" :key="i" class="material-symbols-outlined text-[12px]">
                                    {{ i <= review.rating ? 'star' : 'star_outline' }}
                                </span>
                            </div>
                            <span class="text-[9px] text-zinc-400 italic">{{ new Date(review.created_at).toLocaleDateString('vi-VN') }}</span>
                        </div>
                        <h4 class="text-sm font-bold text-zinc-900 uppercase tracking-tight">{{ review.title }}</h4>
                        <p class="text-xs text-zinc-500 font-light leading-relaxed">{{ review.content }}</p>
                        
                        <!-- Review Images -->
                        <div v-if="review.images?.length" class="flex gap-2 pt-2">
                            <div v-for="img in review.images" :key="img.image_id" class="w-16 h-16 border border-zinc-100 overflow-hidden">
                                <img :src="getImageUrl(img.image_url)" class="w-full h-full object-cover" />
                            </div>
                        </div>

                        <div class="flex items-center gap-2 pt-2">
                             <div class="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-[8px] font-bold text-zinc-400">U</div>
                             <span class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Verified Buyer</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Review Modal -->
        <div v-if="isReviewModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-zinc-900/60 backdrop-blur-sm">
            <div class="bg-white w-full max-w-xl shadow-2xl p-10 space-y-8">
                <header class="flex justify-between items-center">
                    <h2 class="text-2xl serif-text italic">Chia sẻ cảm nhận</h2>
                    <button @click="isReviewModalOpen = false" class="material-symbols-outlined text-zinc-400 hover:text-zinc-900">close</button>
                </header>

                <div class="space-y-6">
                    <div class="space-y-2">
                        <label class="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Đánh giá sao</label>
                        <div class="flex gap-2">
                            <button v-for="i in 5" :key="i" @click="newReview.rating = i" class="text-zinc-900">
                                <span class="material-symbols-outlined">{{ i <= newReview.rating ? 'star' : 'star_outline' }}</span>
                            </button>
                        </div>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Tiêu đề</label>
                        <input v-model="newReview.title" type="text" class="w-full border-b border-zinc-200 py-2 outline-none focus:border-zinc-900 text-sm" placeholder="Rất hài lòng / Chất vải đẹp..." />
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Nội dung</label>
                        <textarea v-model="newReview.content" rows="4" class="w-full border border-zinc-200 p-3 outline-none focus:border-zinc-900 text-sm resize-none" placeholder="Hãy chia sẻ trải nghiệm của bạn về sản phẩm này..."></textarea>
                    </div>
                    <div class="space-y-2">
                        <label class="text-[10px] uppercase font-bold tracking-widest text-zinc-400">Hình ảnh thực tế</label>
                        <input type="file" multiple accept="image/*" @change="handleFileChange" class="w-full text-xs text-zinc-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-zinc-900 file:text-white hover:file:bg-zinc-800" />
                    </div>
                </div>

                <button @click="submitReview" class="w-full bg-zinc-900 text-white py-4 text-[10px] uppercase font-bold tracking-widest hover:bg-zinc-800 transition-all">Gửi đánh giá</button>
            </div>
        </div>
    </div>
</template>

<style scoped>
.serif-text {
    font-family: 'Playfair Display', serif;
}
</style>
