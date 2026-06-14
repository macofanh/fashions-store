<script setup lang="ts">
import { useProductManagement } from './useProductManagement'

const {
    getImageUrl,
    products,
    isLoading,
    isDrawerOpen,
    selectedProduct,
    isSaving,
    isUploading,
    fileInput,
    searchQuery,
    selectedCategoryId,
    handleSearch,
    allColors,
    allSizes,
    allCategories,
    genderOptions,
    isVariantFormOpen,
    editingVariantIndex,
    variantImageInput,
    isVariantImageUploading,
    createVariantDraft,
    newVariant,
    normalizeVariantPayload,
    fetchProducts,
    filteredProducts,
    fetchMetaData,
    openCreate,
    openDetail,
    closeDrawer,
    triggerFileInput,
    triggerVariantImageInput,
    handleFileUpload,
    handleVariantImageUpload,
    handleSetPrimary,
    handleDeleteImage,
    updateLocalProductSync,
    handleSave,
    openVariantForm,
    handleAddVariant,
    handleDeleteVariant,
    handleCancelVariantForm,
    handleSoftDelete,
    formatPrice
} = useProductManagement()
</script>

<template>
    <div class="space-y-6 relative min-h-screen">
        <header class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Quản lý Sản phẩm</h1>
                <p class="text-sm text-slate-400 mt-1">Danh sách toàn bộ kho hàng của bạn</p>
            </div>
            <div class="flex items-center gap-3">
                <div class="relative group">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-500 transition-colors">search</span>
                    <input 
                        v-model="searchQuery" 
                        @input="handleSearch"
                        type="text" 
                        placeholder="Tìm sản phẩm..." 
                        class="pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50 transition-all w-[240px] shadow-sm"
                    />
                </div>

                <select 
                    v-model="selectedCategoryId" 
                    @change="fetchProducts"
                    class="pl-4 pr-10 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400 focus:ring-4 focus:ring-indigo-50/50 transition-all shadow-sm bg-no-repeat bg-[right_1rem_center] appearance-none min-w-[160px]"
                    style="background-image: url('data:image/svg+xml;charset=utf-8,%3Csvg xmlns=%27http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3E%3Cpath stroke=%27%2364748b%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27m6 8 4 4 4-4%27%2F%3E%3C%2Fsvg%3E');"
                >
                    <option :value="null">Tất cả danh mục</option>
                    <option v-for="cat in allCategories" :key="cat.category_id" :value="cat.category_id">
                        {{ cat.name }}
                    </option>
                </select>

                <button @click="openCreate" class="bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm shrink-0">
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
                    <tr v-else-if="filteredProducts.length === 0">
                        <td colspan="5" class="px-5 py-20 text-center">
                            <div class="flex flex-col items-center gap-2 text-slate-400">
                                <span class="material-symbols-outlined text-4xl">search_off</span>
                                <p class="text-sm font-medium">Không tìm thấy sản phẩm nào</p>
                            </div>
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
                                {{ p.category?.name || '—' }}
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

        <!-- POPUP MODAL FOR ADD/EDIT VARIANT -->
        <Teleport to="body">
            <div v-if="isVariantFormOpen" class="fixed inset-0 z-[70] flex items-center justify-center p-4">
                <!-- Backdrop -->
                <div class="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" @click="handleCancelVariantForm"></div>
                
                <!-- Modal Box -->
                <div class="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-slate-100 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    <!-- Modal Header -->
                    <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                        <div>
                            <h3 class="text-base font-bold text-slate-900">
                                {{ editingVariantIndex !== null ? 'Chỉnh sửa biến thể' : 'Thêm biến thể mới' }}
                            </h3>
                            <p class="text-xs text-slate-400 mt-0.5">
                                {{ editingVariantIndex !== null ? 'Cập nhật thông tin cho biến thể này' : 'Tạo thêm biến thể mới cho sản phẩm' }}
                            </p>
                        </div>
                        <button @click="handleCancelVariantForm" class="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full transition-colors">
                            <span class="material-symbols-outlined text-[20px] text-slate-500">close</span>
                        </button>
                    </div>

                    <!-- Modal Body -->
                    <div class="p-6 overflow-y-auto space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Màu sắc</label>
                                <select v-model="newVariant.color_id" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white">
                                    <option :value="null">Chọn màu</option>
                                    <option v-for="c in allColors" :key="c.color_id" :value="c.color_id">{{ c.name }}</option>
                                </select>
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Kích cỡ</label>
                                <select v-model="newVariant.size_id" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white">
                                    <option :value="null">Chọn size</option>
                                    <option v-for="s in allSizes" :key="s.size_id" :value="s.size_id">{{ s.name }} ({{ s.size_type }})</option>
                                </select>
                            </div>
                            <div class="col-span-2">
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Mã sản phẩm (SKU)</label>
                                <input v-model="newVariant.sku" placeholder="VD: SMT-RED-M" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Giá bán (₫)</label>
                                <input v-model.number="newVariant.price" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Giá so sánh (₫)</label>
                                <input v-model.number="newVariant.compare_price" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" placeholder="Tùy chọn" />
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Tồn kho</label>
                                <input v-model.number="newVariant.stock_qty" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                            </div>
                            <div>
                                <label class="text-xs font-semibold text-slate-500 block mb-1.5">Ngưỡng báo sắp hết hàng</label>
                                <input v-model.number="newVariant.low_stock_threshold" type="number" class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                            </div>
                            <div class="col-span-2 pt-2">
                                <button @click="newVariant.is_active = !newVariant.is_active"
                                    :class="['w-full px-4 py-3 rounded-xl border-2 transition-all flex items-center justify-center gap-3 font-semibold text-sm', newVariant.is_active ? 'border-emerald-200 bg-emerald-50 text-emerald-700' : 'border-slate-200 bg-slate-50 text-slate-500']">
                                    <span class="w-2.5 h-2.5 rounded-full" :class="newVariant.is_active ? 'bg-emerald-500' : 'bg-slate-300'"></span>
                                    {{ newVariant.is_active ? 'Biến thể đang bán' : 'Biến thể tạm ẩn' }}
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Modal Footer -->
                    <div class="px-6 py-4 border-t border-slate-100 flex gap-3 bg-slate-50 shrink-0">
                        <button @click="handleCancelVariantForm" class="flex-1 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">Hủy</button>
                        <button @click="handleAddVariant" class="flex-1 bg-indigo-600 text-white py-2.5 text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                            {{ editingVariantIndex !== null ? 'Cập nhật biến thể' : 'Thêm biến thể' }}
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
