<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { productService, type Product } from '@/pages/products/productService'
import { getImageUrl } from '@/lib/urlHelper'
import axiosClient from '@/lib/axiosClient'
import { useUIStore } from '@/stores/useUIStore'

const uiStore = useUIStore()

    const products = ref<Product[]>([])
    const isLoading = ref(true)
    const isDrawerOpen = ref(false)
    const selectedProduct = ref<any>(null)
    const isSaving = ref(false)
    const isUploading = ref(false)
    const fileInput = ref<HTMLInputElement | null>(null)
    const showDeleted = ref(false)

    const allColors = ref<any[]>([])
    const allSizes = ref<any[]>([])
    const allCategories = ref<any[]>([])
    const genderOptions = ['male', 'female', 'unisex', 'kids']

    const isVariantFormOpen = ref(false)
    const editingVariantIndex = ref<number | null>(null)
    const variantImageInput = ref<HTMLInputElement | null>(null)
    const isVariantImageUploading = ref(false)

    const createVariantDraft = (basePrice = 0) => ({
        color_id: null,
        size_id: null,
        sku: '',
        price: basePrice,
        compare_price: null,
        stock_qty: 0,
        low_stock_threshold: 5,
        image_url: '',
        is_active: true,
    })

    const newVariant = ref(createVariantDraft())

    const normalizeVariantPayload = (variant: any) => ({
        variant_id: variant.variant_id ?? null,
        color_id: variant.color_id ?? null,
        size_id: variant.size_id ?? null,
        sku: variant.sku ?? '',
        price: variant.price ?? 0,
        compare_price: variant.compare_price ?? null,
        stock_qty: variant.stock_qty ?? 0,
        low_stock_threshold: variant.low_stock_threshold ?? 5,
        image_url: variant.image_url ?? '',
        is_active: variant.is_active ?? true,
    })

    const fetchProducts = async () => {
        isLoading.value = true
        try {
            const response = await axiosClient.get('/api/v1/products', { params: { page_size: 100 } })
            products.value = response.data.items
        } catch (error) {
            console.error('Lỗi lấy danh sách sản phẩm:', error)
        } finally {
            isLoading.value = false
        }
    }

    const filteredProducts = computed(() => {
        if (showDeleted.value) return products.value
        return products.value.filter(p => !p.deleted_at)
    })

    const fetchMetaData = async () => {
        try {
            const [colorsRes, sizesRes, categoriesRes] = await Promise.all([
                axiosClient.get('/api/v1/products/colors'),
                axiosClient.get('/api/v1/products/sizes'),
                axiosClient.get('/api/v1/categories')
            ])
            allColors.value = colorsRes.data
            allSizes.value = sizesRes.data
            allCategories.value = categoriesRes.data
        } catch (error) {
            console.error('Lỗi lấy meta data:', error)
        }
    }

    const openCreate = () => {
        selectedProduct.value = {
            name: '',
            base_price: 0,
            brand: '',
            description: '',
            is_active: true,
            category_id: allCategories.value[0]?.category_id || null,
            gender: 'unisex',
            images: [],
            variants: [],
        }
        newVariant.value = createVariantDraft(0)
        isVariantFormOpen.value = false
        editingVariantIndex.value = null
        isDrawerOpen.value = true
    }

    const openDetail = async (product: Product) => {
        isDrawerOpen.value = true
        selectedProduct.value = JSON.parse(JSON.stringify(product))
        newVariant.value = createVariantDraft(selectedProduct.value?.base_price || 0)
        isVariantFormOpen.value = false
        editingVariantIndex.value = null

        try {
            const response = await productService.getProductById(product.product_id)
            selectedProduct.value = JSON.parse(JSON.stringify(response.data))
            newVariant.value = createVariantDraft(selectedProduct.value?.base_price || 0)
            updateLocalProductSync()
        } catch (error) {
            console.error('Lỗi lấy chi tiết sản phẩm:', error)
        }
    }

    const closeDrawer = () => {
        isDrawerOpen.value = false
        selectedProduct.value = null
        isVariantFormOpen.value = false
        editingVariantIndex.value = null
        newVariant.value = createVariantDraft()
    }

    const triggerFileInput = () => {
        fileInput.value?.click()
    }

    const triggerVariantImageInput = () => {
        variantImageInput.value?.click()
    }

    const handleFileUpload = async (event: Event) => {
        const target = event.target as HTMLInputElement
        if (!target.files?.length || !selectedProduct.value) return

        const file = target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)
        formData.append('is_primary', selectedProduct.value.images.length === 0 ? 'true' : 'false')

        isUploading.value = true
        try {
            const response = await axiosClient.post(
                `/api/v1/products/${selectedProduct.value.product_id}/images`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )
            selectedProduct.value.images.push(response.data)
            updateLocalProductSync()
            uiStore.success('Upload ảnh thành công!')
        } catch (error: any) {
            console.error('Lỗi upload ảnh:', error)
            uiStore.error(error.response?.data?.detail || 'Lỗi upload ảnh.')
        } finally {
            isUploading.value = false
            target.value = ''
        }
    }

    const handleVariantImageUpload = async (event: Event) => {
        const target = event.target as HTMLInputElement
        if (!target.files?.length || !selectedProduct.value) return

        const file = target.files[0]
        if (!file) return

        const formData = new FormData()
        formData.append('file', file)
        formData.append('is_primary', 'false')

        isVariantImageUploading.value = true
        try {
            const response = await axiosClient.post(
                `/api/v1/products/${selectedProduct.value.product_id}/images`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
            )

            newVariant.value.image_url = response.data.image_url || ''
            selectedProduct.value.images = selectedProduct.value.images || []
            selectedProduct.value.images.push(response.data)
            updateLocalProductSync()
            uiStore.success('Upload ảnh biến thể thành công!')
        } catch (error: any) {
            console.error('Lỗi upload ảnh biến thể:', error)
            uiStore.error(error.response?.data?.detail || 'Lỗi upload ảnh biến thể.')
        } finally {
            isVariantImageUploading.value = false
            target.value = ''
        }
    }

    const handleSetPrimary = async (imageId: number) => {
        if (!selectedProduct.value) return
        try {
            await axiosClient.put(`/api/v1/products/${selectedProduct.value.product_id}/images/${imageId}/primary`)
            selectedProduct.value.images.forEach((img: any) => {
                img.is_primary = (img.image_id === imageId)
            })
            updateLocalProductSync()
        } catch (error) {
            uiStore.error('Lỗi khi đặt ảnh chính.')
        }
    }

    const handleDeleteImage = async (imageId: number) => {
        const confirmed = await uiStore.confirm({
            title: 'Xóa ảnh',
            message: 'Bạn có chắc muốn xóa ảnh này?',
            confirmLabel: 'Xóa',
            variant: 'danger',
        })
        if (!confirmed) return

        try {
            await axiosClient.delete(`/api/v1/products/images/${imageId}`)
            selectedProduct.value.images = selectedProduct.value.images.filter((img: any) => img.image_id !== imageId)
            updateLocalProductSync()
        } catch (error) {
            uiStore.error('Lỗi khi xóa ảnh.')
        }
    }

    const updateLocalProductSync = () => {
        if (!selectedProduct.value) return
        const index = products.value.findIndex(p => p.product_id === selectedProduct.value.product_id)
        if (index === -1) return

        const product = products.value[index]
        if (!product) return

        const syncedProduct = {
            ...product,
            ...selectedProduct.value,
        }
        syncedProduct.images = [...(selectedProduct.value.images || [])]
        products.value[index] = syncedProduct
    }

    const handleSave = async () => {
        if (!selectedProduct.value) return
        isSaving.value = true
        try {
            const payload = {
                name: selectedProduct.value.name,
                base_price: selectedProduct.value.base_price,
                brand: selectedProduct.value.brand,
                description: selectedProduct.value.description,
                is_active: selectedProduct.value.is_active,
                category_id: selectedProduct.value.category_id,
                gender: selectedProduct.value.gender,
                variants: (selectedProduct.value.variants || []).map(normalizeVariantPayload),
            }

            if (selectedProduct.value.product_id) {
                const response = await axiosClient.put(`/api/v1/products/${selectedProduct.value.product_id}`, payload)
                selectedProduct.value = JSON.parse(JSON.stringify(response.data))

                const index = products.value.findIndex(p => p.product_id === selectedProduct.value.product_id)
                if (index !== -1) {
                    products.value[index] = { ...products.value[index], ...response.data }
                }
                uiStore.success('Cập nhật sản phẩm thành công!')
            } else {
                const response = await axiosClient.post('/api/v1/products', payload)
                products.value.unshift(response.data)
                selectedProduct.value = response.data
                uiStore.success('Tạo sản phẩm thành công! Bạn có thể thêm ảnh và biến thể bây giờ.')
            }
        } catch (error: any) {
            console.error('Lỗi lưu sản phẩm:', error)
            uiStore.error(error.response?.data?.detail || 'Có lỗi xảy ra khi lưu.')
        } finally {
            isSaving.value = false
        }
    }

    const openVariantForm = (variant?: any, index?: number) => {
        if (!selectedProduct.value) return

        if (variant) {
            editingVariantIndex.value = typeof index === 'number' ? index : null
            newVariant.value = JSON.parse(JSON.stringify({
                ...normalizeVariantPayload(variant),
            }))
        } else {
            editingVariantIndex.value = null
            newVariant.value = createVariantDraft(selectedProduct.value.base_price)
        }

        isVariantFormOpen.value = true
    }

    const handleAddVariant = async () => {
        if (!selectedProduct.value) return
        if (!newVariant.value.color_id || !newVariant.value.size_id || !newVariant.value.sku) {
            uiStore.warning('Vui lòng điền đầy đủ thông tin biến thể!')
            return
        }

        selectedProduct.value.variants = selectedProduct.value.variants || []
        const variantPayload = JSON.parse(JSON.stringify(newVariant.value))

        if (editingVariantIndex.value !== null && selectedProduct.value.variants[editingVariantIndex.value]) {
            selectedProduct.value.variants[editingVariantIndex.value] = {
                ...selectedProduct.value.variants[editingVariantIndex.value],
                ...variantPayload,
            }
            uiStore.success('Đã cập nhật biến thể trong form. Bấm Lưu thay đổi để lưu sản phẩm.')
        } else {
            selectedProduct.value.variants.push(variantPayload)
            uiStore.success('Đã thêm biến thể vào form. Bấm Lưu thay đổi để lưu sản phẩm.')
        }

        newVariant.value = createVariantDraft(selectedProduct.value.base_price)
        isVariantFormOpen.value = false
        editingVariantIndex.value = null
    }

    const handleDeleteVariant = async (index: number) => {
        if (!selectedProduct.value?.variants) return
        const variant = selectedProduct.value.variants[index]
        if (!variant) return

        const confirmed = await uiStore.confirm({
            title: 'Xóa biến thể',
            message: `Bạn có chắc muốn xóa biến thể ${variant.sku || ''}?`,
            confirmLabel: 'Xóa',
            variant: 'danger',
        })
        if (!confirmed) return

        selectedProduct.value.variants.splice(index, 1)
        if (editingVariantIndex.value === index) {
            editingVariantIndex.value = null
            newVariant.value = createVariantDraft(selectedProduct.value.base_price)
            isVariantFormOpen.value = false
        }
    }

    const handleCancelVariantForm = () => {
        if (!selectedProduct.value) return
        newVariant.value = createVariantDraft(selectedProduct.value.base_price)
        editingVariantIndex.value = null
        isVariantFormOpen.value = false
        if (variantImageInput.value) {
            variantImageInput.value.value = ''
        }
    }

    const handleSoftDelete = async (product_id: number) => {
        const confirmed = await uiStore.confirm({
            title: 'Xóa sản phẩm',
            message: 'Bạn có chắc muốn xóa tạm sản phẩm này?',
            confirmLabel: 'Xóa',
            variant: 'danger',
        })
        if (!confirmed) return
        try {
            await axiosClient.delete(`/api/v1/products/${product_id}`)
            uiStore.success('Đã chuyển sản phẩm vào thùng rác.')
            fetchProducts()
        } catch (error) {
            uiStore.error('Lỗi khi xóa sản phẩm.')
        }
    }

    onMounted(() => {
        fetchProducts()
        fetchMetaData()
    })

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
    }
</script>

<template>
    <div class="space-y-6 relative min-h-screen">
        <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Quản lý Sản phẩm</h1>
                <p class="text-sm text-slate-400 mt-1">Danh sách toàn bộ kho hàng của bạn</p>
            </div>
            <div class="flex items-center gap-3">
                <label class="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" v-model="showDeleted" class="w-4 h-4 rounded accent-indigo-600" />
                    <span class="text-sm text-slate-500">Hiện đã xóa</span>
                </label>
                <button @click="openCreate" class="bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm">
                    <span class="material-symbols-outlined text-[18px]">add</span>
                    Thêm sản phẩm
                </button>
            </div>
        </header>

        <!-- Product Table -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400">Sản phẩm</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 hidden md:table-cell">Danh mục</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 hidden lg:table-cell">Giá cơ bản</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 text-center">Trạng thái</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <tr v-if="isLoading">
                        <td colspan="5" class="px-5 py-20 text-center">
                            <div class="animate-spin h-7 w-7 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                        </td>
                    </tr>
                    <tr v-for="p in filteredProducts" :key="p.product_id" :class="['hover:bg-slate-50/60 transition-colors group', p.deleted_at ? 'opacity-50' : '']">
                        <td class="px-5 py-4 cursor-pointer" @click="openDetail(p)">
                            <div class="flex items-center gap-3">
                                <div class="w-11 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0">
                                    <img v-if="p.images?.find(img => img.is_primary)?.image_url || p.images?.[0]?.image_url"
                                        :src="getImageUrl(p.images.find(img => img.is_primary)?.image_url || p.images[0]?.image_url)"
                                        class="w-full h-full object-cover" />
                                    <div v-else class="w-full h-full flex items-center justify-center">
                                        <span class="material-symbols-outlined text-slate-300 text-lg">image_not_supported</span>
                                    </div>
                                </div>
                                <div>
                                    <p class="text-sm font-semibold text-slate-900 group-hover:text-indigo-600 transition-colors line-clamp-1">{{ p.name }}</p>
                                    <p class="text-xs text-slate-400 mt-0.5">{{ p.brand || '—' }} · #{{ p.product_id }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-5 py-4 hidden md:table-cell">
                            <span class="text-xs text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                                {{ allCategories.find(c => c.category_id === p.category_id)?.name || '—' }}
                            </span>
                        </td>
                        <td class="px-5 py-4 text-sm font-semibold text-slate-800 hidden lg:table-cell">
                            {{ formatPrice(p.base_price) }}
                        </td>
                        <td class="px-5 py-4 text-center">
                            <span v-if="p.deleted_at" class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-red-50 text-red-500">
                                <span class="w-1.5 h-1.5 rounded-full bg-red-400"></span>Đã xóa
                            </span>
                            <span v-else-if="!p.is_active" class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-slate-100 text-slate-500">
                                <span class="w-1.5 h-1.5 rounded-full bg-slate-400"></span>Ẩn
                            </span>
                            <span v-else class="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-600">
                                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>Đang bán
                            </span>
                        </td>
                        <td class="px-5 py-4 text-right">
                            <div class="flex justify-end gap-1">
                                <button @click="openDetail(p)" class="p-2 hover:bg-indigo-50 rounded-xl transition-colors text-slate-400 hover:text-indigo-600" title="Sửa/Chi tiết">
                                    <span class="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button v-if="!p.deleted_at" @click="handleSoftDelete(p.product_id)" class="p-2 hover:bg-red-50 rounded-xl transition-colors text-slate-400 hover:text-red-500" title="Xóa">
                                    <span class="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- SIDE DRAWER -->
        <Teleport to="body">
        <div v-if="isDrawerOpen" class="fixed inset-0 z-[60] flex justify-end">
            <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer"></div>
            <div class="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full rounded-l-2xl overflow-hidden">
                <!-- Drawer Header -->
                <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                    <div>
                        <h2 class="text-base font-bold text-slate-900">
                            {{ selectedProduct?.product_id ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới' }}
                        </h2>
                        <p class="text-xs text-slate-400 mt-0.5">
                            {{ selectedProduct?.product_id ? `#${selectedProduct.product_id} · ${selectedProduct.name}` : 'Điền thông tin sản phẩm mới' }}
                        </p>
                    </div>
                    <button @click="closeDrawer" class="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full transition-colors">
                        <span class="material-symbols-outlined text-[20px] text-slate-500">close</span>
                    </button>
                </div>

                <!-- Drawer Content -->
                <div class="flex-grow overflow-y-auto p-6 space-y-8">
                    <!-- SECTION 1: ẢNH -->
                    <section>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Hình ảnh sản phẩm</h3>
                        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />
                        <div class="grid grid-cols-5 gap-3">
                            <div v-for="(img, idx) in selectedProduct.images" :key="idx" class="aspect-[3/4] bg-slate-100 rounded-xl relative group overflow-hidden">
                                <img :src="getImageUrl(img.image_url)" class="w-full h-full object-cover" />
                                <div v-if="img.is_primary" class="absolute top-2 left-2 bg-indigo-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">Chính</div>
                                <div class="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl flex flex-col items-center justify-center gap-2">
                                    <button v-if="!img.is_primary" @click="handleSetPrimary(img.image_id)" class="bg-white text-slate-900 text-[9px] font-semibold px-3 py-1.5 rounded-lg hover:bg-indigo-600 hover:text-white transition-colors">Đặt chính</button>
                                    <button @click="handleDeleteImage(img.image_id)" class="text-white hover:text-red-300 transition-colors">
                                        <span class="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                            <button @click="triggerFileInput" :disabled="isUploading" class="aspect-[3/4] border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all disabled:opacity-50">
                                <span v-if="isUploading" class="animate-spin h-5 w-5 border-2 border-indigo-500 border-t-transparent rounded-full mb-1"></span>
                                <span v-else class="material-symbols-outlined text-2xl">add_a_photo</span>
                                <span class="text-[9px] font-semibold mt-1">{{ isUploading ? 'Đang tải...' : 'Thêm ảnh' }}</span>
                            </button>
                        </div>
                    </section>

                    <!-- SECTION 2: THÔNG TIN CƠ BẢN -->
                    <section>
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Thông tin cơ bản</h3>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="col-span-2">
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Tên sản phẩm</label>
                                <input v-model="selectedProduct.name" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Nhập tên sản phẩm..." />
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Giá cơ bản (₫)</label>
                                <input v-model.number="selectedProduct.base_price" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Thương hiệu</label>
                                <input v-model="selectedProduct.brand" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="VD: Nike, Adidas..." />
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Danh mục</label>
                                <select v-model="selectedProduct.category_id" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white">
                                    <option v-for="cat in allCategories" :key="cat.category_id" :value="cat.category_id">{{ cat.name }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Giới tính</label>
                                <select v-model="selectedProduct.gender" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white capitalize">
                                    <option v-for="g in genderOptions" :key="g" :value="g">{{ g }}</option>
                                </select>
                            </div>
                            <div class="col-span-2">
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Mô tả</label>
                                <textarea v-model="selectedProduct.description" rows="3" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all resize-none" placeholder="Mô tả sản phẩm..."></textarea>
                            </div>
                            <div class="col-span-2">
                                <label class="text-xs font-semibold text-slate-500 block mb-2">Trạng thái</label>
                                <button @click="selectedProduct.is_active = !selectedProduct.is_active"
                                    :class="['flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all w-full text-left', selectedProduct.is_active ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50']">
                                    <div :class="['w-10 h-5 rounded-full transition-colors relative shrink-0', selectedProduct.is_active ? 'bg-emerald-500' : 'bg-slate-300']">
                                        <div :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', selectedProduct.is_active ? 'translate-x-5' : 'translate-x-0.5']"></div>
                                    </div>
                                    <span :class="['text-sm font-semibold', selectedProduct.is_active ? 'text-emerald-700' : 'text-slate-500']">
                                        {{ selectedProduct.is_active ? 'Đang kinh doanh' : 'Ngừng bán' }}
                                    </span>
                                </button>
                            </div>
                        </div>
                    </section>

                    <!-- SECTION 3: BIẾN THỂ -->
                    <section v-if="selectedProduct">
                        <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Biến thể sản phẩm</h3>

                        <div v-if="selectedProduct.variants?.length" class="space-y-2">
                            <div v-for="(v, index) in selectedProduct.variants" :key="v.variant_id || index" class="bg-white border border-slate-100 rounded-xl p-3">
                                <div class="flex items-center justify-between gap-3">
                                    <div class="flex items-center gap-3 min-w-0">
                                        <div class="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-bold text-slate-600 shrink-0">
                                            {{ v.size?.name || '—' }}
                                        </div>
                                        <div class="w-4 h-4 rounded-full border border-slate-200 shrink-0" :style="{ backgroundColor: v.color?.hex_code || '#ccc' }"></div>
                                        <div class="min-w-0">
                                            <p class="text-xs font-semibold text-slate-800 truncate">{{ v.sku || 'Biến thể mới' }}</p>
                                            <p class="text-[10px] text-slate-400">{{ v.variant_id ? `#${v.variant_id}` : 'Bản nháp' }}</p>
                                        </div>
                                    </div>

                                    <div class="flex items-center gap-1.5 shrink-0">
                                        <button @click="openVariantForm(v, Number(index))" class="p-2 hover:bg-indigo-50 rounded-lg transition-colors text-slate-400 hover:text-indigo-600" title="Chỉnh sửa biến thể">
                                            <span class="material-symbols-outlined text-[18px]">edit</span>
                                        </button>
                                        <button @click="handleDeleteVariant(Number(index))" class="p-2 hover:bg-red-50 rounded-lg transition-colors text-slate-400 hover:text-red-500" title="Xóa biến thể">
                                            <span class="material-symbols-outlined text-[18px]">delete</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div v-else class="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-5 text-sm text-slate-500">
                            Chưa có biến thể nào cho sản phẩm này.
                        </div>

                        <button
                            @click="openVariantForm()"
                            class="mt-3 w-full border border-dashed border-indigo-200 text-indigo-600 bg-indigo-50/60 py-3 rounded-xl text-sm font-semibold hover:bg-indigo-50 transition-colors flex items-center justify-center gap-2"
                        >
                            <span class="material-symbols-outlined text-[18px]">add</span>
                            Thêm biến thể mới
                        </button>

                        <div v-if="isVariantFormOpen" class="mt-4 bg-indigo-50 border border-indigo-100 rounded-xl p-4 space-y-4">
                            <div class="flex items-center justify-between gap-3">
                                <p class="text-xs font-semibold text-indigo-700">
                                    {{ editingVariantIndex !== null ? 'Chỉnh sửa biến thể' : 'Thêm biến thể mới' }}
                                </p>
                                <button @click="handleCancelVariantForm" class="text-[10px] font-semibold uppercase tracking-widest text-slate-500 hover:text-slate-700">Đóng</button>
                            </div>

                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                <div>
                                    <label class="text-[10px] font-semibold text-slate-500 block mb-1">Màu sắc</label>
                                    <select v-model="newVariant.color_id" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400 bg-white">
                                        <option :value="null">Chọn màu</option>
                                        <option v-for="c in allColors" :key="c.color_id" :value="c.color_id">{{ c.name }}</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-slate-500 block mb-1">Kích cỡ</label>
                                    <select v-model="newVariant.size_id" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400 bg-white">
                                        <option :value="null">Chọn size</option>
                                        <option v-for="s in allSizes" :key="s.size_id" :value="s.size_id">{{ s.name }} ({{ s.size_type }})</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-slate-500 block mb-1">Mã sản phẩm</label>
                                    <input v-model="newVariant.sku" placeholder="VD: SMT-RED-M" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-slate-500 block mb-1">Giá (₫)</label>
                                    <input v-model.number="newVariant.price" type="number" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-slate-500 block mb-1">Giá so sánh (₫)</label>
                                    <input v-model.number="newVariant.compare_price" type="number" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400" placeholder="Tuỳ chọn" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-slate-500 block mb-1">Tồn kho</label>
                                    <input v-model.number="newVariant.stock_qty" type="number" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400" />
                                </div>
                                <div>
                                    <label class="text-[10px] font-semibold text-slate-500 block mb-1">Ngưỡng thấp</label>
                                    <input v-model.number="newVariant.low_stock_threshold" type="number" class="w-full border border-slate-200 rounded-lg px-3 py-2 text-xs outline-none focus:border-indigo-400" />
                                </div>
                                <div class="flex items-end">
                                    <button @click="newVariant.is_active = !newVariant.is_active"
                                        :class="['w-full px-3 py-2 rounded-lg border text-xs font-semibold transition-all flex items-center justify-center gap-2', newVariant.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500']">
                                        <span class="w-3 h-3 rounded-full" :class="newVariant.is_active ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                                        {{ newVariant.is_active ? 'Đang bán' : 'Tạm ẩn' }}
                                    </button>
                                </div>
                            </div>

                            <div class="flex justify-end gap-3">
                                <button @click="handleCancelVariantForm" class="px-4 py-2 rounded-lg border border-slate-200 text-sm font-semibold text-slate-600 hover:bg-white transition-colors">Hủy</button>
                                <button @click="handleAddVariant" class="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-semibold hover:bg-indigo-700 transition-colors">
                                    {{ editingVariantIndex !== null ? 'Cập nhật biến thể' : 'Thêm biến thể' }}
                                </button>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Drawer Footer -->
                <div class="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 shrink-0">
                    <button @click="closeDrawer" class="flex-1 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">Hủy</button>
                    <button @click="handleSave" :disabled="isSaving" class="flex-1 bg-indigo-600 text-white py-2.5 text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                        <span v-if="isSaving" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                    </button>
                </div>
            </div>
        </div>
        </Teleport>
    </div>
</template>

<style scoped>
.drawer-slide-enter-active, .drawer-slide-leave-active { transition: opacity 0.25s ease; }
.drawer-slide-enter-from, .drawer-slide-leave-to { opacity: 0; }
</style>
