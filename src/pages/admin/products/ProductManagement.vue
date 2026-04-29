<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { productService, type Product } from '@/api/productService'
import { getImageUrl } from '@/api/urlHelper'
import axiosClient from '@/api/axiosClient'

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

const newVariant = ref({
    color_id: null,
    size_id: null,
    sku: '',
    price: 0,
    stock_qty: 0,
    low_stock_threshold: 5
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
        variants: []
    }
    isDrawerOpen.value = true
}

const openDetail = (product: Product) => {
    selectedProduct.value = JSON.parse(JSON.stringify(product))
    isDrawerOpen.value = true
}

const closeDrawer = () => {
    isDrawerOpen.value = false
    selectedProduct.value = null
}

const triggerFileInput = () => {
    fileInput.value?.click()
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
        alert('Upload ảnh thành công!')
    } catch (error: any) {
        console.error('Lỗi upload ảnh:', error)
        alert(error.response?.data?.detail || 'Lỗi upload ảnh.')
    } finally {
        isUploading.value = false
        target.value = ''
    }
}

const handleSetPrimary = async (imageId: number) => {
    if (!selectedProduct.value) return
    try {
        await axiosClient.put(`/api/v1/products/${selectedProduct.value.product_id}/images/${imageId}/primary`)
        // Cập nhật state UI
        selectedProduct.value.images.forEach((img: any) => {
            img.is_primary = (img.image_id === imageId)
        })
        updateLocalProductSync()
    } catch (error) {
        alert('Lỗi khi đặt ảnh chính.')
    }
}

const handleDeleteImage = async (imageId: number) => {
    if (!confirm('Bạn có chắc muốn xóa ảnh này?')) return
    try {
        await axiosClient.delete(`/api/v1/products/images/${imageId}`)
        selectedProduct.value.images = selectedProduct.value.images.filter((img: any) => img.image_id !== imageId)
        updateLocalProductSync()
    } catch (error) {
        alert('Lỗi khi xóa ảnh.')
    }
}

// Helper để đồng bộ dữ liệu Drawer với List chính
const updateLocalProductSync = () => {
    const index = products.value.findIndex(p => p.product_id === selectedProduct.value.product_id)
    if (index !== -1 && products.value[index]) {
        products.value[index].images = [...selectedProduct.value.images]
    }
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
            gender: selectedProduct.value.gender
        }

        if (selectedProduct.value.product_id) {
            // Update
            await axiosClient.put(`/api/v1/products/${selectedProduct.value.product_id}`, payload)
            
            const index = products.value.findIndex(p => p.product_id === selectedProduct.value.product_id)
            if (index !== -1) {
                products.value[index] = { ...products.value[index], ...selectedProduct.value }
            }
            alert('Cập nhật sản phẩm thành công!')
        } else {
            // Create
            const response = await axiosClient.post('/api/v1/products', payload)
            products.value.unshift(response.data)
            selectedProduct.value = response.data
            alert('Tạo sản phẩm thành công! Bạn có thể thêm ảnh và biến thể bây giờ.')
        }
    } catch (error: any) {
        console.error('Lỗi lưu sản phẩm:', error)
        alert(error.response?.data?.detail || 'Có lỗi xảy ra khi lưu.')
    } finally {
        isSaving.value = false
    }
}

const handleAddVariant = async () => {
    if (!selectedProduct.value?.product_id) return
    if (!newVariant.value.color_id || !newVariant.value.size_id || !newVariant.value.sku) {
        alert('Vui lòng điền đầy đủ thông tin biến thể!')
        return
    }

    try {
        const response = await axiosClient.post(`/api/v1/products/${selectedProduct.value.product_id}/variants`, newVariant.value)
        selectedProduct.value.variants.push(response.data)
        
        // Reset form
        newVariant.value = {
            color_id: null,
            size_id: null,
            sku: '',
            price: selectedProduct.value.base_price,
            stock_qty: 0,
            low_stock_threshold: 5
        }
        alert('Thêm biến thể thành công!')
    } catch (error: any) {
        alert(error.response?.data?.detail || 'Lỗi khi thêm biến thể.')
    }
}

const handleUpdateVariant = async (variant: any) => {
    if (variant.stock_qty < 0) {
        alert('Số lượng tồn kho không được âm!')
        return
    }
    try {
        await axiosClient.put(`/api/v1/products/variants/${variant.variant_id}`, {
            price: variant.price,
            stock_qty: variant.stock_qty,
            low_stock_threshold: variant.low_stock_threshold || 5,
            is_active: variant.is_active,
            version: variant.version
        })
        alert('Cập nhật biến thể thành công!')
        fetchProducts()
    } catch (error: any) {
        if (error.response?.status === 409) {
            alert('Dữ liệu đã bị thay đổi bởi người khác, vui lòng tải lại trang!')
        } else {
            console.error('Lỗi cập nhật biến thể:', error)
            alert('Không thể cập nhật biến thể.')
        }
    }
}

const handleSoftDelete = async (product_id: number) => {
    if (!confirm('Bạn có chắc muốn xóa tạm sản phẩm này?')) return
    try {
        await axiosClient.delete(`/api/v1/products/${product_id}`)
        alert('Đã chuyển sản phẩm vào thùng rác.')
        fetchProducts()
    } catch (error) {
        alert('Lỗi khi xóa sản phẩm.')
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
    <div class="space-y-10 relative min-h-screen">
        <header class="flex justify-between items-end">
            <div>
                <h1 class="text-3xl serif-text italic text-zinc-900">Quản lý Sản phẩm</h1>
                <p class="text-xs text-zinc-400 uppercase tracking-widest mt-2 font-bold">Danh sách toàn bộ kho hàng của bạn</p>
            </div>
            <div class="flex items-center gap-6">
                <label class="flex items-center gap-2 cursor-pointer group">
                    <input type="checkbox" v-model="showDeleted" class="hidden" />
                    <span :class="['material-symbols-outlined text-xl transition-colors', showDeleted ? 'text-zinc-900' : 'text-zinc-200 group-hover:text-zinc-400']">
                        {{ showDeleted ? 'visibility' : 'visibility_off' }}
                    </span>
                    <span class="text-[10px] uppercase font-bold tracking-widest text-zinc-400 group-hover:text-zinc-900 transition-colors">Hiện mục đã xóa</span>
                </label>
                <button @click="openCreate" class="bg-zinc-900 text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-black/10">
                    <span class="material-symbols-outlined text-sm">add</span>
                    Thêm sản phẩm mới
                </button>
            </div>
        </header>

        <!-- Product Table -->
        <div class="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Hình ảnh</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Tên sản phẩm</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Giá cơ bản</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-center">Trạng thái</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-50">
                    <tr v-if="isLoading">
                        <td colspan="5" class="px-8 py-20 text-center">
                             <div class="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full mx-auto"></div>
                        </td>
                    </tr>
                    <tr v-for="p in filteredProducts" :key="p.product_id" :class="['hover:bg-zinc-50/50 transition-colors group', p.deleted_at ? 'opacity-50' : '']">
                        <td class="px-8 py-6">
                            <div class="w-12 h-16 bg-zinc-100 overflow-hidden">
                                <img :src="getImageUrl(p.images.find(img => img.is_primary)?.image_url || p.images[0]?.image_url)" class="w-full h-full object-cover" />
                            </div>
                        </td>
                        <td class="px-8 py-6 cursor-pointer" @click="openDetail(p)">
                            <p class="text-sm font-bold text-zinc-900 group-hover:text-zinc-600 transition-colors">{{ p.name }}</p>
                            <p class="text-[10px] text-zinc-400 mt-1">ID: #{{ p.product_id }} | Slug: {{ p.slug }}</p>
                        </td>
                        <td class="px-8 py-6 text-sm font-medium">
                            {{ formatPrice(p.base_price) }}
                        </td>
                        <td class="px-8 py-6 text-center">
                            <span v-if="p.deleted_at" class="bg-red-50 text-red-500 text-[8px] uppercase px-2 py-1 font-black tracking-tighter">Đã xóa tạm</span>
                            <span v-else :class="p.is_active ? 'bg-green-50 text-green-600' : 'bg-zinc-100 text-zinc-400'" class="text-[8px] uppercase px-2 py-1 font-black tracking-tighter">
                                {{ p.is_active ? 'Đang bán' : 'Ẩn' }}
                            </span>
                        </td>
                        <td class="px-8 py-6 text-right">
                            <div class="flex justify-end gap-2">
                                <button @click="openDetail(p)" class="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-zinc-900" title="Sửa/Chi tiết">
                                    <span class="material-symbols-outlined text-xl">visibility</span>
                                </button>
                                <button v-if="!p.deleted_at" @click="handleSoftDelete(p.product_id)" class="p-2 hover:bg-zinc-100 rounded-full transition-colors text-zinc-400 hover:text-red-500" title="Xóa">
                                    <span class="material-symbols-outlined text-xl">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- SIDE DRAWER -->
        <div v-if="isDrawerOpen" class="fixed inset-0 z-[60] overflow-hidden">
            <div class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" @click="closeDrawer"></div>
            
            <div class="absolute inset-y-0 right-0 w-full max-w-3xl bg-white shadow-2xl flex flex-col transform transition-transform duration-500">
                <!-- Drawer Header -->
                <div class="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <div>
                        <h2 class="text-lg serif-text italic text-zinc-900">Chi tiết sản phẩm</h2>
                        <p class="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Chế độ xem và chỉnh sửa nâng cao</p>
                    </div>
                    <button @click="closeDrawer" class="w-10 h-10 flex items-center justify-center hover:bg-zinc-200 rounded-full transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>

                <!-- Drawer Content -->
                <div class="flex-grow overflow-y-auto p-8 space-y-12">
                    <!-- SECTION 1: ẢNH VÀ CƠ BẢN -->
                    <section class="space-y-6">
                        <h3 class="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-900 border-b border-zinc-100 pb-2">Hình ảnh sản phẩm</h3>
                        
                        <input type="file" ref="fileInput" class="hidden" accept="image/*" @change="handleFileUpload" />

                        <div class="grid grid-cols-4 gap-4">
                            <div v-for="(img, idx) in selectedProduct.images" :key="idx" class="aspect-[3/4] bg-zinc-100 relative group overflow-hidden border border-zinc-200">
                                <img :src="getImageUrl(img.image_url)" class="w-full h-full object-cover" />
                                
                                <!-- Badge Primary -->
                                <div v-if="img.is_primary" class="absolute top-2 left-2 bg-zinc-900 text-white text-[8px] uppercase px-2 py-1 font-bold tracking-widest shadow-lg">Chính</div>
                                
                                <!-- Overlay Actions -->
                                <div class="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                    <button v-if="!img.is_primary" @click="handleSetPrimary(img.image_id)" class="bg-white text-zinc-900 text-[8px] uppercase font-bold tracking-widest px-3 py-2 hover:bg-zinc-900 hover:text-white transition-colors">
                                        Đặt làm chính
                                    </button>
                                    <button @click="handleDeleteImage(img.image_id)" class="text-white hover:text-red-400 transition-colors">
                                        <span class="material-symbols-outlined text-sm">delete</span>
                                    </button>
                                </div>
                            </div>
                            <button @click="triggerFileInput" :disabled="isUploading" class="aspect-[3/4] border-2 border-dashed border-zinc-200 flex flex-col items-center justify-center text-zinc-400 hover:border-zinc-900 hover:text-zinc-900 transition-all disabled:opacity-50">
                                <span v-if="isUploading" class="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full mb-2"></span>
                                <span v-else class="material-symbols-outlined">add_a_photo</span>
                                <span class="text-[8px] uppercase mt-2 font-bold tracking-widest">{{ isUploading ? 'Đang tải...' : 'Thêm ảnh' }}</span>
                            </button>
                        </div>
                    </section>

                    <!-- SECTION 2: THÔNG TIN CƠ BẢN -->
                    <section class="space-y-6">
                        <h3 class="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-900 border-b border-zinc-100 pb-2">Thông tin cơ bản</h3>
                        <div class="grid grid-cols-2 gap-6">
                            <div class="space-y-2">
                                <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Tên sản phẩm</label>
                                <input v-model="selectedProduct.name" class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none transition-colors text-sm" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Giá cơ bản</label>
                                <input v-model.number="selectedProduct.base_price" type="number" class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none transition-colors text-sm" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Thương hiệu</label>
                                <input v-model="selectedProduct.brand" class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none transition-colors text-sm" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Danh mục</label>
                                <select v-model="selectedProduct.category_id" class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none transition-colors text-sm bg-transparent">
                                    <option v-for="cat in allCategories" :key="cat.category_id" :value="cat.category_id">{{ cat.name }}</option>
                                </select>
                            </div>
                            <div class="space-y-2">
                                <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Giới tính</label>
                                <select v-model="selectedProduct.gender" class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none transition-colors text-sm bg-transparent capitalize">
                                    <option v-for="g in genderOptions" :key="g" :value="g">{{ g }}</option>
                                </select>
                            </div>
                            <div class="space-y-2 flex items-center gap-4 pt-6">
                                <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Trạng thái:</label>
                                <button @click="selectedProduct.is_active = !selectedProduct.is_active" 
                                    :class="selectedProduct.is_active ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'"
                                    class="text-[8px] uppercase font-black px-3 py-1 tracking-tighter transition-all">
                                    {{ selectedProduct.is_active ? 'Đang kinh doanh' : 'Ngừng bán' }}
                                </button>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Mô tả</label>
                            <textarea v-model="selectedProduct.description" rows="4" class="w-full border border-zinc-200 p-3 focus:border-zinc-900 outline-none transition-colors text-sm resize-none"></textarea>
                        </div>
                    </section>

                    <!-- SECTION 3: BIẾN THỂ -->
                    <section v-if="selectedProduct.product_id" class="space-y-6">
                        <div class="flex justify-between items-end border-b border-zinc-100 pb-2">
                            <h3 class="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-900">Các phiên bản (Variants)</h3>
                        </div>
                        
                        <!-- Form thêm biến thể mới -->
                        <div class="p-4 border-2 border-dashed border-zinc-100 space-y-4">
                            <p class="text-[9px] uppercase font-bold text-zinc-400 tracking-[0.2em]">Thêm biến thể mới</p>
                            <div class="grid grid-cols-3 gap-4">
                                <div class="space-y-1">
                                    <label class="text-[8px] uppercase font-bold text-zinc-400">Màu sắc</label>
                                    <select v-model="newVariant.color_id" class="w-full border-b border-zinc-200 py-1 text-[10px] focus:border-zinc-900 outline-none bg-transparent">
                                        <option :value="null">Chọn màu</option>
                                        <option v-for="c in allColors" :key="c.color_id" :value="c.color_id">{{ c.name }}</option>
                                    </select>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[8px] uppercase font-bold text-zinc-400">Kích cỡ</label>
                                    <select v-model="newVariant.size_id" class="w-full border-b border-zinc-200 py-1 text-[10px] focus:border-zinc-900 outline-none bg-transparent">
                                        <option :value="null">Chọn size</option>
                                        <option v-for="s in allSizes" :key="s.size_id" :value="s.size_id">{{ s.name }} ({{ s.size_type }})</option>
                                    </select>
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[8px] uppercase font-bold text-zinc-400">SKU</label>
                                    <input v-model="newVariant.sku" placeholder="VD: SMT-RED-M" class="w-full border-b border-zinc-200 py-1 text-[10px] focus:border-zinc-900 outline-none" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[8px] uppercase font-bold text-zinc-400">Giá riêng (nếu có)</label>
                                    <input v-model.number="newVariant.price" type="number" class="w-full border-b border-zinc-200 py-1 text-[10px] focus:border-zinc-900 outline-none" />
                                </div>
                                <div class="space-y-1">
                                    <label class="text-[8px] uppercase font-bold text-zinc-400">Tồn kho</label>
                                    <input v-model.number="newVariant.stock_qty" type="number" class="w-full border-b border-zinc-200 py-1 text-[10px] focus:border-zinc-900 outline-none" />
                                </div>
                                <div class="flex items-end">
                                    <button @click="handleAddVariant" class="w-full bg-zinc-900 text-white py-2 text-[8px] uppercase font-bold tracking-widest hover:bg-zinc-800 transition-colors">
                                        Thêm
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Danh sách biến thể hiện tại -->
                        <div class="space-y-4">
                            <div v-for="v in selectedProduct.variants" :key="v.variant_id" class="p-4 bg-zinc-50 border border-zinc-100 flex items-center justify-between gap-4">
                                <div class="flex gap-4 items-center">
                                    <div class="w-10 h-10 bg-white border border-zinc-200 flex items-center justify-center text-[10px] font-bold">
                                        {{ v.size?.name }}
                                    </div>
                                    <div class="w-4 h-4 rounded-full border border-zinc-200" :style="{ backgroundColor: v.color?.hex_code }"></div>
                                    <div class="text-[10px] font-bold text-zinc-400">#{{ v.sku }}</div>
                                </div>
                                <div class="flex items-center gap-6">
                                    <div class="space-y-1">
                                        <p class="text-[8px] uppercase text-zinc-400 font-bold">Giá</p>
                                        <input v-model.number="v.price" type="number" class="w-24 bg-transparent border-b border-zinc-200 py-1 text-xs focus:border-zinc-900 outline-none" />
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[8px] uppercase text-zinc-400 font-bold">Kho</p>
                                        <input v-model.number="v.stock_qty" type="number" min="0" class="w-16 bg-transparent border-b border-zinc-200 py-1 text-xs focus:border-zinc-900 outline-none" />
                                    </div>
                                    <div class="space-y-1">
                                        <p class="text-[8px] uppercase text-zinc-400 font-bold">Ngưỡng báo</p>
                                        <input v-model.number="v.low_stock_threshold" type="number" class="w-12 bg-transparent border-b border-zinc-200 py-1 text-xs focus:border-zinc-900 outline-none" />
                                    </div>
                                    <button @click="handleUpdateVariant(v)" class="p-2 hover:bg-zinc-200 rounded-full transition-colors text-zinc-900">
                                        <span class="material-symbols-outlined text-sm">save</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>
                </div>

                <!-- Drawer Footer -->
                <div class="p-8 border-t border-zinc-100 flex justify-end gap-4 bg-zinc-50">
                    <button @click="closeDrawer" class="px-8 py-3 text-[10px] uppercase font-bold tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors">Hủy</button>
                    <button @click="handleSave" :disabled="isSaving" class="bg-zinc-900 text-white px-10 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-all disabled:opacity-50">
                        {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.serif-text { font-family: 'Playfair Display', serif; }

.fixed > div:last-child {
    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}
</style>
