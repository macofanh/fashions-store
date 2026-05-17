import { ref, computed, onMounted } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useUIStore } from '@/stores/useUIStore'

export function useInventoryManagement() {
    const uiStore = useUIStore()

    const STOCK_CACHE_KEY = 'admin_inventory_stock_cache'
    const STOCK_CACHE_TS_KEY = 'admin_inventory_stock_cache_ts'
    const STOCK_CACHE_TTL = 60 * 1000

    interface VariantStock {
        variant_id: number; product_name: string; sku: string
        color_name: string; size_name: string; stock_qty: number
        base_price: number; image_url: string; low_stock_threshold: number
    }
    interface InventoryLog {
        log_id: number; variant_id: number; change_type: 'IN' | 'OUT' | 'RETURN' | 'ADJUST'
        quantity: number; stock_before: number; stock_after: number; note?: string; created_at: string
    }

    const activeTab = ref<'stock' | 'logs'>('stock')
    const stockList = ref<VariantStock[]>([])
    const logs = ref<InventoryLog[]>([])
    const isLoading = ref(true)
    const isRefreshingStock = ref(false)
    const isDrawerOpen = ref(false)
    const isSubmitting = ref(false)
    const searchQuery = ref('')
    const filterStock = ref<'all' | 'low' | 'out'>('all')

    const form = ref({ variant_id: '', change_type: 'IN', quantity: 1, note: '' })

    const hydrateStockCache = () => {
        try {
            const cached = localStorage.getItem(STOCK_CACHE_KEY)
            if (!cached) return false

            const cachedAt = Number(localStorage.getItem(STOCK_CACHE_TS_KEY) || 0)
            if (!cachedAt || Date.now() - cachedAt > STOCK_CACHE_TTL) return false

            const parsed = JSON.parse(cached)
            if (!Array.isArray(parsed)) return false

            stockList.value = parsed
            isLoading.value = false
            return true
        } catch (error) {
            console.error('Lỗi đọc cache kho hàng:', error)
            return false
        }
    }

    const persistStockCache = (items: VariantStock[]) => {
        try {
            localStorage.setItem(STOCK_CACHE_KEY, JSON.stringify(items))
            localStorage.setItem(STOCK_CACHE_TS_KEY, String(Date.now()))
        } catch (error) {
            console.error('Lỗi lưu cache kho hàng:', error)
        }
    }

    const filteredStock = computed(() => {
        let list = stockList.value
        if (filterStock.value === 'low') list = list.filter(v => v.stock_qty > 0 && v.stock_qty <= (v.low_stock_threshold || 5))
        if (filterStock.value === 'out') list = list.filter(v => v.stock_qty <= 0)
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase()
            list = list.filter(v => v.product_name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q))
        }
        return list
    })

    const stockStats = computed(() => ({
        total: stockList.value.length,
        low:   stockList.value.filter(v => v.stock_qty > 0 && v.stock_qty <= (v.low_stock_threshold || 5)).length,
        out:   stockList.value.filter(v => v.stock_qty <= 0).length,
    }))

    const fetchStock = async (options?: { background?: boolean }) => {
        const background = options?.background ?? false
        if (background) {
            isRefreshingStock.value = true
        } else {
            isLoading.value = true
        }
        try {
            const res = await axiosClient.get('/api/v1/products/variants')
            const items = res.data.map((v: any) => ({
                variant_id: v.variant_id,
                product_name: v.product?.name || 'N/A',
                sku: v.sku,
                color_name: v.color?.name || 'N/A',
                size_name: v.size?.name || 'N/A',
                stock_qty: v.stock_qty,
                base_price: v.price,
                low_stock_threshold: v.low_stock_threshold || 5,
                image_url: v.image_url || v.product?.images?.[0]?.image_url,
            }))
            stockList.value = items
            persistStockCache(items)
        } catch (e) { console.error(e) }
        finally {
            isLoading.value = false
            isRefreshingStock.value = false
        }
    }

    const fetchLogs = async () => {
        isLoading.value = true
        try {
            const res = await axiosClient.get('/api/v1/inventory/inventory-logs', { params: { page_size: 50 } })
            logs.value = res.data.items
        } catch (e) { console.error(e) }
        finally { isLoading.value = false }
    }

    const handleTabChange = (tab: 'stock' | 'logs') => {
        activeTab.value = tab
        tab === 'stock' ? fetchStock() : fetchLogs()
    }

    const openAdjustDrawer = (variant?: VariantStock) => {
        form.value = { variant_id: variant ? variant.variant_id.toString() : '', change_type: 'IN', quantity: 1, note: '' }
        isDrawerOpen.value = true
    }

    const handleAdjustStock = async () => {
        if (!form.value.variant_id) return uiStore.warning('Vui lòng chọn biến thể')
        isSubmitting.value = true
        try {
            await axiosClient.post('/api/v1/inventory/inventory-logs', {
                variant_id: Number(form.value.variant_id),
                change_type: form.value.change_type,
                quantity: form.value.change_type === 'OUT' ? -Math.abs(form.value.quantity) : Math.abs(form.value.quantity),
                note: form.value.note
            })
            isDrawerOpen.value = false
            uiStore.success('Cập nhật kho thành công!')
            activeTab.value === 'stock' ? fetchStock() : fetchLogs()
        } catch (e: any) {
            uiStore.error(e.response?.data?.detail || 'Lỗi khi cập nhật kho')
        } finally { isSubmitting.value = false }
    }

    const formatDateTime = (d: string) => new Date(d).toLocaleString('vi-VN')

    const changeTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
        IN:     { label: 'Nhập kho',  bg: 'bg-emerald-50', text: 'text-emerald-700' },
        OUT:    { label: 'Xuất kho',  bg: 'bg-red-50',     text: 'text-red-700'     },
        RETURN: { label: 'Hoàn trả',  bg: 'bg-blue-50',    text: 'text-blue-700'    },
        ADJUST: { label: 'Điều chỉnh',bg: 'bg-amber-50',   text: 'text-amber-700'   },
    }

    onMounted(() => {
        const hasCache = hydrateStockCache()
        void fetchStock({ background: hasCache })
    })

    return {
        uiStore,
        STOCK_CACHE_KEY,
        STOCK_CACHE_TS_KEY,
        STOCK_CACHE_TTL,
        activeTab,
        stockList,
        logs,
        isLoading,
        isRefreshingStock,
        isDrawerOpen,
        isSubmitting,
        searchQuery,
        filterStock,
        form,
        hydrateStockCache,
        persistStockCache,
        filteredStock,
        stockStats,
        fetchStock,
        fetchLogs,
        handleTabChange,
        openAdjustDrawer,
        handleAdjustStock,
        formatDateTime,
        changeTypeConfig
    }
}
