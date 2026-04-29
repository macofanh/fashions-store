<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { productService, type Product } from '@/api/productService'
import { getImageUrl } from '@/api/urlHelper'
import FilterSidebar from './FilterSidebar.vue'

const route = useRoute()
const router = useRouter()

// ── State ─────────────────────────────────────────────────────────
const products = ref<Product[]>([])
const categories = ref<any[]>([])
const isLoading = ref(true)
const isMobileSidebarOpen = ref(false)

// Pagination
const currentPage = ref(Number(route.query.page) || 1)
const totalPages = ref(1)
const totalItems = ref(0)
const PAGE_SIZE = 12

// Filters — đồng bộ với URL query params
const filters = reactive({
    search:      (route.query.search as string)      || '',
    category_id: route.query.category_id ? Number(route.query.category_id) : null as number | null,
    gender:      (route.query.gender as string)      || '',
    min_price:   route.query.min_price ? Number(route.query.min_price) : null as number | null,
    max_price:   route.query.max_price ? Number(route.query.max_price) : null as number | null,
    sort_by:     (route.query.sort_by as string)     || 'created_at',
    sort_order:  (route.query.sort_order as string)  || 'desc',
})

// Giá tạm thời — chỉ apply khi bấm nút
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
    { label: 'Mới nhất',        value: 'created_at:desc'  },
    { label: 'Cũ nhất',         value: 'created_at:asc'   },
    { label: 'Giá tăng dần',    value: 'base_price:asc'   },
    { label: 'Giá giảm dần',    value: 'base_price:desc'  },
    { label: 'Đánh giá cao',    value: 'avg_rating:desc'  },
    { label: 'Bán chạy nhất',   value: 'total_sold:desc'  },
]

const currentSortValue = computed(() => `${filters.sort_by}:${filters.sort_order}`)

// ── Helpers ───────────────────────────────────────────────────────
const buildParams = () => {
    const p: Record<string, any> = {
        page:       currentPage.value,
        page_size:  PAGE_SIZE,
        sort_by:    filters.sort_by,
        sort_order: filters.sort_order,
    }
    if (filters.search)              p.search      = filters.search
    if (filters.category_id)         p.category_id = filters.category_id
    if (filters.gender)              p.gender      = filters.gender
    if (filters.min_price !== null)  p.min_price   = filters.min_price
    if (filters.max_price !== null)  p.max_price   = filters.max_price
    return p
}

const syncToUrl = () => {
    const q: Record<string, any> = {}
    if (filters.search)              q.search      = filters.search
    if (filters.category_id)         q.category_id = filters.category_id
    if (filters.gender)              q.gender      = filters.gender
    if (filters.min_price !== null)  q.min_price   = filters.min_price
    if (filters.max_price !== null)  q.max_price   = filters.max_price
    if (filters.sort_by !== 'created_at') q.sort_by = filters.sort_by
    if (filters.sort_order !== 'desc')    q.sort_order = filters.sort_order
    if (currentPage.value > 1)       q.page        = currentPage.value
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
        products.value    = res.data.items
        totalPages.value  = res.data.total_pages
        totalItems.value  = res.data.total
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

const setCategory = (id: number | null) => {
    filters.category_id = id
    applyFilters()
}

const setGender = (val: string) => {
    filters.gender = filters.gender === val ? '' : val
    applyFilters()
}

const clearAllFilters = () => {
    filters.search      = ''
    filters.category_id = null
    filters.gender      = ''
    filters.min_price   = null
    filters.max_price   = null
    filters.sort_by     = 'created_at'
    filters.sort_order  = 'desc'
    priceRange.min      = ''
    priceRange.max      = ''
    currentPage.value   = 1
    syncToUrl()
    fetchProducts()
}

const goToPage = (page: number) => {
    if (page < 1 || page > totalPages.value) return
    currentPage.value = page
    syncToUrl()
    fetchProducts()
    window.scrollTo({ top: 0, behavior: 'smooth' })
}

// Debounced search
let searchTimer: ReturnType<typeof setTimeout>
const onSearchInput = () => {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(applyFilters, 400)
}

// Visible page numbers cho pagination
const visiblePages = computed(() => {
    const pages: (number | '...')[] = []
    const total = totalPages.value
    const cur   = currentPage.value
    if (total <= 7) {
        for (let i = 1; i <= total; i++) pages.push(i)
    } else {
        pages.push(1)
        if (cur > 3)       pages.push('...')
        for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i)
        if (cur < total - 2) pages.push('...')
        pages.push(total)
    }
    return pages
})

onMounted(() => {
    fetchProducts()
    fetchCategories()
})
</script>

<template>
    <div class="bg-white min-h-screen">

        <!-- ── HERO ──────────────────────────────────────────────── -->
        <div class="relative h-[35vh] bg-zinc-900 flex items-center justify-center overflow-hidden">
            <img
                src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070"
                class="absolute inset-0 w-full h-full object-cover opacity-40"
                alt="Collection banner"
            />
            <div class="relative z-10 text-center px-6">
                <h1 class="text-white text-5xl md:text-7xl serif-text mb-3 italic">The Collection</h1>
                <p class="text-white/60 uppercase tracking-[0.4em] text-[10px]">
                    <template v-if="!isLoading && totalItems > 0">{{ totalItems.toLocaleString('vi-VN') }} sản phẩm</template>
                    <template v-else>Modern Elegance &amp; Timeless Style</template>
                </p>
            </div>
        </div>

        <div class="max-w-[1600px] mx-auto px-6 py-12">

            <!-- ── TOOLBAR ───────────────────────────────────────── -->
            <div class="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between mb-10 pb-8 border-b border-zinc-100">

                <!-- Search box -->
                <div class="relative flex-grow max-w-lg">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[20px] pointer-events-none">search</span>
                    <input
                        v-model="filters.search"
                        @input="onSearchInput"
                        type="text"
                        placeholder="Tìm kiếm sản phẩm, thương hiệu..."
                        class="w-full pl-10 pr-10 py-3 border border-zinc-200 text-sm outline-none focus:border-zinc-900 transition-colors bg-zinc-50 focus:bg-white"
                    />
                    <button
                        v-if="filters.search"
                        @click="filters.search = ''; applyFilters()"
                        class="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-900 transition-colors"
                    >
                        <span class="material-symbols-outlined text-[18px]">close</span>
                    </button>
                </div>

                <div class="flex items-center gap-3 shrink-0">
                    <!-- Sort dropdown -->
                    <div class="relative">
                        <select
                            :value="currentSortValue"
                            @change="setSort(($event.target as HTMLSelectElement).value)"
                            class="appearance-none border border-zinc-200 py-3 pl-4 pr-10 text-[11px] uppercase tracking-widest font-bold outline-none focus:border-zinc-900 bg-white cursor-pointer"
                        >
                            <option v-for="opt in sortOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                        </select>
                        <span class="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px] pointer-events-none">unfold_more</span>
                    </div>

                    <!-- Mobile filter button -->
                    <button
                        @click="isMobileSidebarOpen = true"
                        class="md:hidden relative flex items-center gap-2 border border-zinc-200 py-3 px-4 text-[11px] uppercase tracking-widest font-bold hover:border-zinc-900 transition-colors"
                    >
                        <span class="material-symbols-outlined text-[18px]">tune</span>
                        Lọc
                        <span
                            v-if="activeFilterCount > 0"
                            class="absolute -top-2 -right-2 w-5 h-5 bg-zinc-900 text-white text-[9px] rounded-full flex items-center justify-center font-bold"
                        >{{ activeFilterCount }}</span>
                    </button>
                </div>
            </div>

            <!-- ── MAIN LAYOUT ────────────────────────────────────── -->
            <div class="flex gap-12">

                <!-- Desktop Sidebar -->
                <aside class="hidden md:block w-60 shrink-0">
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
                <main class="flex-grow min-w-0">

                    <!-- Active filter chips -->
                    <div v-if="activeFilterCount > 0 || filters.search" class="flex flex-wrap gap-2 mb-8">
                        <span
                            v-if="filters.search"
                            class="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5"
                        >
                            <span class="material-symbols-outlined text-[12px]">search</span>
                            "{{ filters.search }}"
                            <button @click="filters.search = ''; applyFilters()" class="hover:text-red-500 ml-1">
                                <span class="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        </span>
                        <span
                            v-if="filters.category_id"
                            class="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5"
                        >
                            {{ categories.find(c => c.category_id === filters.category_id)?.name || 'Danh mục' }}
                            <button @click="setCategory(null)" class="hover:text-red-500 ml-1">
                                <span class="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        </span>
                        <span
                            v-if="filters.gender"
                            class="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5"
                        >
                            {{ { male: 'Nam', female: 'Nữ', unisex: 'Unisex', kids: 'Trẻ em' }[filters.gender] }}
                            <button @click="setGender(filters.gender)" class="hover:text-red-500 ml-1">
                                <span class="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        </span>
                        <span
                            v-if="filters.min_price !== null || filters.max_price !== null"
                            class="inline-flex items-center gap-1.5 bg-zinc-100 text-zinc-700 text-[10px] uppercase tracking-widest font-bold px-3 py-1.5"
                        >
                            <span class="material-symbols-outlined text-[12px]">payments</span>
                            {{ filters.min_price ? formatPrice(filters.min_price) : '0' }}
                            —
                            {{ filters.max_price ? formatPrice(filters.max_price) : '∞' }}
                            <button @click="filters.min_price = null; filters.max_price = null; priceRange.min = ''; priceRange.max = ''; applyFilters()" class="hover:text-red-500 ml-1">
                                <span class="material-symbols-outlined text-[12px]">close</span>
                            </button>
                        </span>
                        <button
                            @click="clearAllFilters"
                            class="text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-red-500 transition-colors underline underline-offset-4"
                        >
                            Xóa tất cả
                        </button>
                    </div>

                    <!-- Loading skeleton -->
                    <div v-if="isLoading" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                        <div v-for="i in PAGE_SIZE" :key="i" class="animate-pulse">
                            <div class="aspect-[3/4] bg-zinc-100 mb-4"></div>
                            <div class="h-3 bg-zinc-100 w-1/2 mb-2 mx-auto"></div>
                            <div class="h-3 bg-zinc-100 w-3/4 mb-2 mx-auto"></div>
                            <div class="h-3 bg-zinc-100 w-1/4 mx-auto"></div>
                        </div>
                    </div>

                    <!-- Products -->
                    <div v-else-if="products.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
                        <router-link
                            v-for="product in products"
                            :key="product.product_id"
                            :to="{ name: 'product-detail', params: { slug: product.slug } }"
                            class="group cursor-pointer"
                        >
                            <!-- Image -->
                            <div class="relative aspect-[3/4] overflow-hidden bg-zinc-100 mb-6">
                                <img
                                    v-if="getPrimaryImage(product)"
                                    :src="getImageUrl(getPrimaryImage(product)!.image_url)"
                                    :alt="product.name"
                                    class="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div v-else class="w-full h-full flex items-center justify-center">
                                    <span class="material-symbols-outlined text-4xl text-zinc-300">image_not_supported</span>
                                </div>
                                <div class="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors duration-500"></div>
                                <div class="absolute bottom-6 left-1/2 -translate-x-1/2 w-[80%] bg-white text-zinc-900 py-4 text-[10px] font-bold text-center tracking-[0.2em] uppercase opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-500 hover:bg-zinc-900 hover:text-white">
                                    Xem chi tiết
                                </div>
                            </div>
                            <!-- Info -->
                            <div class="text-center">
                                <p class="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-2">{{ product.brand || 'Azure Editorial' }}</p>
                                <h3 class="text-zinc-900 text-sm tracking-tight mb-2 group-hover:text-zinc-500 transition-colors line-clamp-2">{{ product.name }}</h3>
                                <div class="flex items-center justify-center gap-3">
                                    <p class="text-zinc-900 font-medium text-xs tracking-widest">{{ formatPrice(product.base_price) }}</p>
                                    <div v-if="product.avg_rating > 0" class="flex items-center gap-0.5">
                                        <span class="material-symbols-outlined text-amber-400 text-[13px]" style="font-variation-settings:'FILL' 1">star</span>
                                        <span class="text-[10px] text-zinc-400">{{ product.avg_rating.toFixed(1) }}</span>
                                    </div>
                                </div>
                            </div>
                        </router-link>
                    </div>

                    <!-- Empty state -->
                    <div v-else class="text-center py-32 border border-dashed border-zinc-200">
                        <span class="material-symbols-outlined text-5xl text-zinc-200 mb-4 block">search_off</span>
                        <p class="text-zinc-400 text-sm uppercase tracking-widest mb-6">Không tìm thấy sản phẩm nào.</p>
                        <button
                            @click="clearAllFilters"
                            class="text-[10px] uppercase tracking-widest font-bold text-zinc-900 border border-zinc-900 px-8 py-3 hover:bg-zinc-900 hover:text-white transition-all"
                        >
                            Xóa bộ lọc
                        </button>
                    </div>

                    <!-- Pagination -->
                    <div v-if="!isLoading && totalPages > 1" class="flex items-center justify-center gap-1.5 mt-20">
                        <button
                            @click="goToPage(currentPage - 1)"
                            :disabled="currentPage === 1"
                            class="w-10 h-10 flex items-center justify-center border border-zinc-200 hover:border-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                        </button>

                        <template v-for="p in visiblePages" :key="p">
                            <span v-if="p === '...'" class="w-10 h-10 flex items-center justify-center text-zinc-400 text-sm select-none">…</span>
                            <button
                                v-else
                                @click="goToPage(p as number)"
                                :class="[
                                    'w-10 h-10 text-[11px] font-bold tracking-widest border transition-colors',
                                    p === currentPage
                                        ? 'bg-zinc-900 text-white border-zinc-900'
                                        : 'border-zinc-200 hover:border-zinc-900 text-zinc-600'
                                ]"
                            >{{ p }}</button>
                        </template>

                        <button
                            @click="goToPage(currentPage + 1)"
                            :disabled="currentPage === totalPages"
                            class="w-10 h-10 flex items-center justify-center border border-zinc-200 hover:border-zinc-900 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                            <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                        </button>
                    </div>

                </main>
            </div>
        </div>

        <!-- Mobile Sidebar Overlay -->
        <Teleport to="body">
            <Transition name="slide">
                <div v-if="isMobileSidebarOpen" class="fixed inset-0 z-50 md:hidden flex">
                    <div class="absolute inset-0 bg-black/50 backdrop-blur-sm" @click="isMobileSidebarOpen = false"></div>
                    <aside class="relative w-80 max-w-[85vw] bg-white h-full overflow-y-auto shadow-2xl p-8 ml-0">
                        <div class="flex justify-between items-center mb-8">
                            <h2 class="text-[11px] uppercase tracking-[0.3em] font-bold text-zinc-900">Bộ lọc</h2>
                            <button @click="isMobileSidebarOpen = false" class="w-8 h-8 flex items-center justify-center hover:bg-zinc-100 rounded-full transition-colors">
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

<style scoped>
.serif-text { font-family: 'Playfair Display', serif; }

.slide-enter-active,
.slide-leave-active {
    transition: opacity 0.3s ease;
}
.slide-enter-active aside,
.slide-leave-active aside {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}
.slide-enter-from { opacity: 0; }
.slide-leave-to   { opacity: 0; }
.slide-enter-from aside { transform: translateX(-100%); }
.slide-leave-to   aside { transform: translateX(-100%); }
</style>
