<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService, type Product } from '@/pages/products/productService'
import { getImageUrl } from '@/lib/urlHelper'
import { useCartStore } from '@/stores/useCartStore'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { cartService } from '@/pages/cart/cartService'
import FilterSidebar from './FilterSidebar.vue'

const route = useRoute()
const router = useRouter()
const cartStore = useCartStore()
const authStore = useAuthStore()
const uiStore = useUIStore()

// ── State ─────────────────────────────────────────────────────────
const products = ref<Product[]>([])
const categories = ref<any[]>([])
const isLoading = ref(true)
const isMobileSidebarOpen = ref(false)
const quickAddingId = ref<number | null>(null)

// Pagination
const currentPage = ref(Number(route.query.page) || 1)
const totalPages = ref(1)
const totalItems = ref(0)
const PAGE_SIZE = 12

// Filters
const filters = reactive({
    search:      (route.query.search as string)      || '',
    category_id: route.query.category_id ? Number(route.query.category_id) : null as number | null,
    gender:      (route.query.gender as string)      || '',
    min_price:   route.query.min_price ? Number(route.query.min_price) : null as number | null,
    max_price:   route.query.max_price ? Number(route.query.max_price) : null as number | null,
    sort_by:     (route.query.sort_by as string)     || 'created_at',
    sort_order:  (route.query.sort_order as string)  || 'desc',
})

const priceRange = reactive({
    min: filters.min_price?.toString() || '',
    max: filters.max_price?.toString() || '',
})

// ── Computed ──────────────────────────────────────────────────────
const activeFilterCount = computed(() => {
    let n = 0
    if (filters.category_id) n++
    if (filters.gender)      n++
    if (filters.min_price !== null) n++
    if (filters.max_price !== null) n++
    return n
})

const sortOptions = [
    { label: 'Mới nhất',      value: 'created_at:desc'  },
    { label: 'Cũ nhất',       value: 'created_at:asc'   },
    { label: 'Giá tăng dần',  value: 'base_price:asc'   },
    { label: 'Giá giảm dần',  value: 'base_price:desc'  },
    { label: 'Đánh giá cao',  value: 'avg_rating:desc'  },
    { label: 'Bán chạy nhất', value: 'total_sold:desc'  },
]

const currentSortValue = computed(() => `${filters.sort_by}:${filters.sort_order}`)

// ── Helpers ───────────────────────────────────────────────────────
const buildParams = () => {
    const p: Record<string, any> = {
        page: currentPage.value, page_size: PAGE_SIZE,
        sort_by: filters.sort_by, sort_order: filters.sort_order,
    }
    if (filters.search)             p.search      = filters.search
    if (filters.category_id)        p.category_id = filters.category_id
    if (filters.gender)             p.gender      = filters.gender
    if (filters.min_price !== null) p.min_price   = filters.min_price
    if (filters.max_price !== null) p.max_price   = filters.max_price
    return p
}

const syncToUrl = () => {
    const q: Record<string, any> = {}
    if (filters.search)             q.search      = filters.search
    if (filters.category_id)        q.category_id = filters.category_id
    if (filters.gender)             q.gender      = filters.gender
    if (filters.min_price !== null) q.min_price   = filters.min_price
    if (filters.max_price !== null) q.max_price   = filters.max_price
    if (filters.sort_by !== 'created_at') q.sort_by = filters.sort_by
    if (filters.sort_order !== 'desc')    q.sort_order = filters.sort_order
    if (currentPage.value > 1)      q.page        = currentPage.value
    router.replace({ query: q })
}

const getPrimaryImage = (product: Product) => {
    if (!product.images?.length) return null
    return product.images.find(img => img.is_primary) || product.images[0]
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

// ── Actions ───────────────────────────────────────────────────────
const fetchProducts = async () => {
    isLoading.value = true
    try {
        const res = await productService.getProducts(buildParams())
        products.value   = res.data.items
        totalPages.value = res.data.total_pages
        totalItems.value = res.data.total
    } catch (e) {
        console.error('Lỗi lấy sản phẩm:', e)
    } finally {
        isLoading.value = false
    }
}

const fetchCategories = async () => {
    try {
        const res = await productService.getCategories()
        categories.value = res.data
    } catch (e) {
        console.error('Lỗi lấy danh mục:', e)
    }
}

const applyFilters = () => {
    currentPage.value = 1
    syncToUrl()
    fetchProducts()
    isMobileSidebarOpen.value = false
}

const applyPriceRange = () => {
    filters.min_price = priceRange.min ? Number(priceRange.min) : null
    filters.max_price = priceRange.max ? Number(priceRange.max) : null
    applyFilters()
}

const setSort = (val: string) => {
    const [by, order] = val.split(':')
    filters.sort_by    = by
    filters.sort_order = order
    applyFilters()
}

const setCategory = (id: number | null) => { filters.category_id = id; applyFilters() }
const setGender   = (val: string)        => { filters.gender = filters.gender === val ? '' : val; applyFilters() }

const clearAllFilters = () => {
    filters.search = ''; filters.category_id = null; filters.gender = ''
    filters.min_price = null; filters.max_price = null
    filters.sort_by = 'created_at'; filters.sort_order = 'desc'
    priceRange.min = ''; priceRange.max = ''
    currentPage.value = 1
    syncToUrl(); fetchProducts()
}

const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    syncToUrl(); fetchProducts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Quick Add — thêm variant đầu tiên vào giỏ không cần chọn
const handleQuickAdd = async (e: Event, product: Product) => {
    e.preventDefault()
    e.stopPropagation()
    if (quickAddingId.value === product.product_id) return

    const firstVariant = product.variants?.[0]
    if (!firstVariant) {
        router.push({ name: 'product-detail', params: { slug: product.slug } })
        return
    }

    quickAddingId.value = product.product_id
    try {
        if (authStore.isAuthenticated) {
            await cartService.addToCart(firstVariant.variant_id, 1)
            await cartStore.fetchCart()
        } else {
            cartStore.addGuestItem({
                variant_id: firstVariant.variant_id,
                product_name: product.name,
                variant_info: `${firstVariant.color?.name || ''} / ${firstVariant.size?.name || ''}`,
                image_url: getPrimaryImage(product)?.image_url || '',
                unit_price: firstVariant.price || product.base_price,
                quantity: 1,
            })
        }
        uiStore.success(`Đã thêm "${product.name}" vào giỏ!`)
    } catch {
        uiStore.error('Có lỗi xảy ra. Vui lòng thử lại.')
    } finally {
        quickAddingId.value = null
    }
}

// Debounced search
let searchTimer: ReturnType<typeof setTimeout>
const onSearchInput = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(applyFilters, 400)
}

const visiblePages = computed(() => {
    const pages: (number | '...')[] = []
    const total = totalPages.value, cur = currentPage.value
    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i)
    } else {
        pages.push(1)
        if (cur > 3) pages.push('...')
        for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
        if (cur < total - 2) pages.push('...')
        pages.push(total)
    }
    return pages
})

onMounted(() => { fetchProducts(); fetchCategories() })
</script>

<template>
    <div class="bg-background-light min-h-screen">

        <!-- ── BREADCRUMB + HEADER ─────────────────────────────── -->
        <div class="bg-white border-b border-border-light">
            <div class="max-w-[1440px] mx-auto px-6 py-8">
                <!-- Breadcrumb -->
                <nav class="flex items-center gap-2 text-sm text-text-muted mb-6">
                    <router-link to="/" class="hover:text-primary transition-colors">Trang chủ</router-link>
                    <span class="text-xs">/</span>
                    <span class="text-fashion-black font-medium">Bộ sưu tập</span>
                </nav>

                <!-- Title row -->
                <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 class="text-3xl md:text-4xl font-serif font-bold tracking-tight text-fashion-black mb-2">
                            Bộ sưu tập
                        </h1>
                        <p class="text-text-muted text-sm">
                            <template v-if="!isLoading && totalItems > 0">{{ totalItems.toLocaleString('vi-VN') }} sản phẩm</template>
                            <template v-else>Khám phá xu hướng thời trang mới nhất</template>
                        </p>
                    </div>

                    <div class="flex items-center gap-3">
                        <!-- Search -->
                        <div class="relative hidden sm:block w-64">
                            <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none">search</span>
                            <input
                                v-model="filters.search"
                                @input="onSearchInput"
                                type="text"
                                placeholder="Tìm kiếm..."
                                class="w-full bg-border-light/50 border border-border-light rounded-full py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary focus:bg-white outline-none transition-all placeholder:text-text-muted/70"
                            />
                        </div>

                        <!-- Sort -->
                        <div class="relative">
                            <select
                                :value="currentSortValue"
                                @change="setSort(($event.target as HTMLSelectElement).value)"
                                class="btn-radius appearance-none bg-white border border-border-light py-2.5 pl-4 pr-10 text-sm font-medium text-fashion-black focus:border-primary focus:ring-1 focus:ring-primary outline-none cursor-pointer"
                            >
                                <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                            </select>
                            <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-text-muted text-[20px] pointer-events-none">expand_more</span>
                        </div>

                        <!-- Mobile filter -->
                        <button
                            @click="isMobileSidebarOpen = true"
                            class="btn-radius md:hidden relative flex items-center gap-2 border border-border-light py-2.5 px-4 text-sm font-medium hover:border-primary hover:text-primary transition-colors"
                        >
                            <span class="material-symbols-outlined text-[18px]">tune</span>
                            Lọc
                            <span v-if="activeFilterCount > 0" class="absolute -top-2 -right-2 w-5 h-5 bg-primary text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                                {{ activeFilterCount }}
                            </span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- ── MAIN LAYOUT ─────────────────────────────────────── -->
        <div class="max-w-[1440px] mx-auto px-6 py-8">
            <div class="flex flex-col lg:flex-row gap-10">

                <!-- Sidebar Filters (desktop) -->
                <aside class="hidden lg:block w-64 flex-shrink-0">
                    <div class="sticky top-24">
                        <FilterSidebar
                            :categories="categories"
                            :filters="filters"
                            :price-range="priceRange"
                            :active-filter-count="activeFilterCount"
                            @set-category="setCategory"
                            @set-gender="setGender"
                            @apply-price-range="applyPriceRange"
                            @clear-all="clearAllFilters"
                        />
                    </div>
                </aside>

                <!-- Product Grid -->
                <div class="flex-1 min-w-0">

                    <!-- Active filter chips -->
                    <div v-if="activeFilterCount > 0 || filters.search" class="flex flex-wrap gap-2 mb-6">
                        <span v-if="filters.search" class="chip">
                            <span class="material-symbols-outlined text-[12px]">search</span>
                            "{{ filters.search }}"
                            <button @click="filters.search = ''; applyFilters()" class="hover:text-red-500 ml-1">
                                <span class="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        </span>
                        <span v-if="filters.category_id" class="chip">
                            {{ categories.find(c => c.category_id === filters.category_id)?.name || 'Danh mục' }}
                            <button @click="setCategory(null)" class="hover:text-red-500 ml-1">
                                <span class="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        </span>
                        <span v-if="filters.gender" class="chip">
                            {{ { male: 'Nam', female: 'Nữ', unisex: 'Unisex', kids: 'Trẻ em' }[filters.gender] }}
                            <button @click="setGender(filters.gender)" class="hover:text-red-500 ml-1">
                                <span class="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        </span>
                        <span v-if="filters.min_price !== null || filters.max_price !== null" class="chip">
                            {{ filters.min_price ? formatPrice(filters.min_price) : '0' }} — {{ filters.max_price ? formatPrice(filters.max_price) : '∞' }}
                            <button @click="filters.min_price = null; filters.max_price = null; priceRange.min = ''; priceRange.max = ''; applyFilters()" class="hover:text-red-500 ml-1">
                                <span class="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        </span>
                        <button @click="clearAllFilters" class="text-[11px] font-medium text-text-muted hover:text-red-500 transition-colors underline underline-offset-4">
                            Xóa tất cả
                        </button>
                    </div>

                    <!-- Loading skeleton -->
                    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                        <div v-for="i in PAGE_SIZE" :key="i" class="animate-pulse">
                            <div class="aspect-[3/4] bg-border-light rounded-lg mb-3"></div>
                            <div class="h-3 bg-border-light rounded w-3/4 mb-2"></div>
                            <div class="h-3 bg-border-light rounded w-1/3"></div>
                        </div>
                    </div>

                    <!-- Product Grid -->
                    <div v-else-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-6 gap-y-10">
                        <router-link
                            v-for="product in products"
                            :key="product.product_id"
                            :to="{ name: 'product-detail', params: { slug: product.slug } }"
                            class="group flex flex-col gap-3"
                        >
                            <!-- Image container -->
                            <div class="relative aspect-[3/4] overflow-hidden rounded-lg bg-gray-100">
                                <!-- Product image -->
                                <img
                                    v-if="getPrimaryImage(product)"
                                    :src="getImageUrl(getPrimaryImage(product)!.image_url)"
                                    :alt="product.name"
                                    class="h-full w-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
                                />
                                <div v-else class="w-full h-full flex items-center justify-center bg-border-light">
                                    <span class="material-symbols-outlined text-4xl text-text-muted">image_not_supported</span>
                                </div>

                                <!-- Quick Add button (hover) -->
                                <div class="absolute bottom-4 left-4 right-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-300">
                                    <button
                                        @click="handleQuickAdd($event, product)"
                                        class="btn-radius w-full bg-white/90 backdrop-blur text-fashion-black text-sm font-semibold py-3 shadow-sm hover:bg-primary hover:text-white transition-colors flex items-center justify-center gap-2"
                                    >
                                        <span v-if="quickAddingId === product.product_id" class="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></span>
                                        <span v-else class="material-symbols-outlined text-[18px]">shopping_bag</span>
                                        Thêm nhanh
                                    </button>
                                </div>

                                <!-- Wishlist button -->
                                <div class="absolute top-3 right-3">
                                    <button
                                        @click.prevent
                                        class="p-1.5 rounded-full bg-white/70 hover:bg-white text-fashion-black transition-colors shadow-sm"
                                    >
                                        <span class="material-symbols-outlined text-[20px] block">favorite</span>
                                    </button>
                                </div>

                                <!-- Badge: New / Sale -->
                                <div class="absolute top-3 left-3 flex flex-col gap-1">
                                    <span
                                        v-if="isNewProduct(product)"
                                        class="bg-fashion-black text-white text-[10px] font-bold px-2 py-1 uppercase tracking-wider rounded"
                                    >Mới</span>
                                </div>
                            </div>

                            <!-- Product info -->
                            <div>
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
                                <!-- Color swatches nếu có variants -->
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
                            </div>
                        </router-link>
                    </div>

                    <!-- Empty state -->
                    <div v-else class="text-center py-32 border border-dashed border-border-light rounded-lg">
                        <span class="material-symbols-outlined text-5xl text-border-light mb-4 block">search_off</span>
                        <p class="text-text-muted text-sm uppercase tracking-widest mb-6">Không tìm thấy sản phẩm nào.</p>
                        <button @click="clearAllFilters" class="btn-outline px-8 py-3">Xóa bộ lọc</button>
                    </div>

                    <!-- Pagination -->
                    <div v-if="!isLoading && totalPages > 1" class="flex items-center justify-center gap-2 mt-16">
                        <button
                            @click="goToPage(currentPage - 1)"
                            :disabled="currentPage === 1"
                            class="btn-radius p-2 hover:bg-border-light text-fashion-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <span class="material-symbols-outlined text-[20px]">chevron_left</span>
                        </button>

                        <template v-for="p in visiblePages" :key="p">
                            <span v-if="p === '...'" class="w-10 h-10 flex items-center justify-center text-text-muted text-sm select-none">…</span>
                            <button
                                v-else
                                @click="goToPage(p as number)"
                                :class="[
                                    'btn-radius w-10 h-10 flex items-center justify-center text-sm font-medium transition-colors',
                                    p === currentPage
                                        ? 'bg-primary text-white'
                                        : 'hover:bg-border-light text-fashion-black'
                                ]"
                            >{{ p }}</button>
                        </template>

                        <button
                            @click="goToPage(currentPage + 1)"
                            :disabled="currentPage === totalPages"
                            class="btn-radius p-2 hover:bg-border-light text-fashion-black disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <span class="material-symbols-outlined text-[20px]">chevron_right</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Mobile Sidebar Overlay -->
        <Teleport to="body">
            <Transition name="slide">
                <div v-if="isMobileSidebarOpen" class="fixed inset-0 z-50 lg:hidden flex">
                    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="isMobileSidebarOpen = false"></div>
                    <aside class="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto shadow-2xl p-8">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="text-sm font-bold uppercase tracking-wider text-fashion-black">Bộ lọc</h2>
                            <button @click="isMobileSidebarOpen = false" class="w-8 h-8 flex items-center justify-center hover:bg-border-light rounded-full transition-colors">
                                <span class="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>
                        <FilterSidebar
                            :categories="categories"
                            :filters="filters"
                            :price-range="priceRange"
                            :active-filter-count="activeFilterCount"
                            @set-category="setCategory"
                            @set-gender="setGender"
                            @apply-price-range="applyPriceRange"
                            @clear-all="clearAllFilters"
                        />
                    </aside>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<script lang="ts">
// Helper functions (outside setup for reuse)
function isNewProduct(product: any): boolean {
    if (!product.created_at) return false
    const created = new Date(product.created_at)
    const now = new Date()
    const diffDays = (now.getTime() - created.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 30
}

function getUniqueColors(product: any): any[] {
    if (!product.variants?.length) return []
    const colors = product.variants.map((v: any) => v.color).filter(Boolean)
    return Array.from(new Map(colors.map((c: any) => [c.color_id, c])).values()) as any[]
}
</script>

<style scoped>
@reference "../../assets/main.css";

.chip {
    @apply inline-flex items-center gap-1.5 bg-primary-light text-fashion-black text-[11px] font-medium px-3 py-1.5 border border-border-light;
    border-radius: var(--radius-btn);
}

.slide-enter-active, .slide-leave-active { transition: opacity 0.3s ease; }
.slide-enter-active aside, .slide-leave-active aside { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.slide-enter-from, .slide-leave-to { opacity: 0; }
.slide-enter-from aside { transform: translateX(-100%); }
.slide-leave-to aside   { transform: translateX(-100%); }
</style>
