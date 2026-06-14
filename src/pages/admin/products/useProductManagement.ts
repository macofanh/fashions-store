import { ref, onMounted, computed } from 'vue'
import { productService } from '@/pages/products/productService'
import type { Product } from '@/pages/products/types/product.types'
import { getImageUrl } from '@/lib/urlHelper'
import axiosClient from '@/lib/axiosClient'
import { useUIStore } from '@/stores/useUIStore'

export function useProductManagement() {
    const uiStore = useUIStore()

        const products = ref<Product[]>([])
        const isLoading = ref(true)
        const isDrawerOpen = ref(false)
        const selectedProduct = ref<any>(null)
        const isSaving = ref(false)
        const isUploading = ref(false)
        const fileInput = ref<HTMLInputElement | null>(null)
        const searchQuery = ref('')
        const selectedCategoryId = ref<number | null>(null)

        const allColors = ref<any[]>([])
        const allSizes = ref<any[]>([])
        const allCategories = ref<any[]>([])
        const genderOptions = ['male', 'female', 'unisex']

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
                const response = await axiosClient.get('/api/v1/products', { 
                    params: { 
                        page_size: 100,
                        is_active: null, // Lấy cả sp đang bán và sp ẩn
                        search: searchQuery.value || undefined,
                        category_id: selectedCategoryId.value || undefined
                    } 
                })
                products.value = response.data.items
            } catch (error) {
                console.error('Lỗi lấy danh sách sản phẩm:', error)
            } finally {
                isLoading.value = false
            }
        }

        // Debounce search
        let searchTimeout: any = null
        const handleSearch = () => {
            if (searchTimeout) clearTimeout(searchTimeout)
            searchTimeout = setTimeout(() => {
                fetchProducts()
            }, 500)
        }

        const filteredProducts = computed(() => {
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
            if (newVariant.value.price <= 0) {
                uiStore.warning('Giá biến thể phải lớn hơn 0!')
                return
            }

            selectedProduct.value.variants = selectedProduct.value.variants || []
            const variantPayload = JSON.parse(JSON.stringify(newVariant.value))

            // Parse numbers to make sure payload types are correct
            variantPayload.price = Number(variantPayload.price) || 0
            variantPayload.compare_price = variantPayload.compare_price ? Number(variantPayload.compare_price) : null
            variantPayload.stock_qty = Number(variantPayload.stock_qty) || 0
            variantPayload.low_stock_threshold = Number(variantPayload.low_stock_threshold) || 5

            // Tìm thông tin color và size từ danh sách meta data để gán trực tiếp hiển thị lên UI
            const foundColor = allColors.value.find(c => c.color_id === Number(variantPayload.color_id))
            const foundSize = allSizes.value.find(s => s.size_id === Number(variantPayload.size_id))
            variantPayload.color = foundColor ? { ...foundColor } : undefined
            variantPayload.size = foundSize ? { ...foundSize } : undefined

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

    return {
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
    }
}
