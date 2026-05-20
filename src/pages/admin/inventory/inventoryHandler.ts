import { computed, onMounted, ref } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { inventoryService } from './inventoryService'
import type {
    AdjustStockForm,
    ChangeTypeDisplay,
    InventoryLog,
    InventoryTab,
    StockFilter,
    VariantStock,
} from './inventory.types'

const STOCK_CACHE_KEY = 'admin_inventory_stock_cache'
const STOCK_CACHE_TS_KEY = 'admin_inventory_stock_cache_ts'
const STOCK_CACHE_TTL = 60 * 1000

const defaultForm = (): AdjustStockForm => ({
    variant_id: '',
    change_type: 'IN',
    quantity: 1,
    note: '',
})

export function useInventoryManagement() {
    const uiStore = useUIStore()

    const activeTab = ref<InventoryTab>('stock')
    const stockList = ref<VariantStock[]>([])
    const logs = ref<InventoryLog[]>([])
    const isLoading = ref(true)
    const isRefreshingStock = ref(false)
    const isDrawerOpen = ref(false)
    const isSubmitting = ref(false)
    const searchQuery = ref('')
    const filterStock = ref<StockFilter>('all')
    const form = ref<AdjustStockForm>(defaultForm())

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

    const isLowStock = (item: VariantStock) =>
        item.stock_qty > 0 && item.stock_qty <= (item.low_stock_threshold || 5)

    const filteredStock = computed(() => {
        let list = stockList.value

        if (filterStock.value === 'low') {
            list = list.filter(isLowStock)
        }

        if (filterStock.value === 'out') {
            list = list.filter(item => item.stock_qty <= 0)
        }

        const query = searchQuery.value.trim().toLowerCase()
        if (query) {
            list = list.filter(item =>
                item.product_name.toLowerCase().includes(query) ||
                item.sku.toLowerCase().includes(query),
            )
        }

        return list
    })

    const stockStats = computed(() => ({
        total: stockList.value.length,
        low: stockList.value.filter(isLowStock).length,
        out: stockList.value.filter(item => item.stock_qty <= 0).length,
    }))

    const fetchStock = async (options?: { background?: boolean }) => {
        const background = options?.background ?? false
        if (background) {
            isRefreshingStock.value = true
        } else {
            isLoading.value = true
        }

        try {
            const items = await inventoryService.getVariantStocks()
            stockList.value = items
            persistStockCache(items)
        } catch (error) {
            console.error(error)
            uiStore.error('Không thể tải tồn kho')
        } finally {
            isLoading.value = false
            isRefreshingStock.value = false
        }
    }

    const fetchLogs = async () => {
        isLoading.value = true

        try {
            logs.value = await inventoryService.getInventoryLogs()
        } catch (error) {
            console.error(error)
            uiStore.error('Không thể tải lịch sử kho')
        } finally {
            isLoading.value = false
        }
    }

    const handleTabChange = (tab: InventoryTab) => {
        activeTab.value = tab

        if (tab === 'stock') {
            void fetchStock()
        } else {
            void fetchLogs()
        }
    }

    const selectStockFilter = (filter: StockFilter) => {
        filterStock.value = filter
        activeTab.value = 'stock'
    }

    const openAdjustDrawer = (variant?: VariantStock) => {
        form.value = {
            ...defaultForm(),
            variant_id: variant ? String(variant.variant_id) : '',
        }
        isDrawerOpen.value = true
    }

    const closeAdjustDrawer = () => {
        isDrawerOpen.value = false
    }

    const handleAdjustStock = async () => {
        if (!form.value.variant_id) {
            uiStore.warning('Vui lòng chọn biến thể')
            return
        }

        isSubmitting.value = true

        try {
            await inventoryService.adjustStock(form.value)
            isDrawerOpen.value = false
            uiStore.success('Cập nhật kho thành công!')

            if (activeTab.value === 'stock') {
                void fetchStock()
            } else {
                void fetchLogs()
            }
        } catch (error: any) {
            uiStore.error(error.response?.data?.detail || 'Lỗi khi cập nhật kho')
        } finally {
            isSubmitting.value = false
        }
    }

    const formatDateTime = (date: string) => new Date(date).toLocaleString('vi-VN')

    const changeTypeConfig: Record<string, ChangeTypeDisplay> = {
        IN: { label: 'Nhập kho', bg: 'bg-emerald-50', text: 'text-emerald-700' },
        OUT: { label: 'Xuất kho', bg: 'bg-red-50', text: 'text-red-700' },
        RETURN: { label: 'Hoàn trả', bg: 'bg-blue-50', text: 'text-blue-700' },
        ADJUST: { label: 'Điều chỉnh', bg: 'bg-amber-50', text: 'text-amber-700' },
    }

    onMounted(() => {
        const hasCache = hydrateStockCache()
        void fetchStock({ background: hasCache })
    })

    return {
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
        filteredStock,
        stockStats,
        fetchStock,
        fetchLogs,
        handleTabChange,
        selectStockFilter,
        openAdjustDrawer,
        closeAdjustDrawer,
        handleAdjustStock,
        formatDateTime,
        changeTypeConfig,
    }
}
