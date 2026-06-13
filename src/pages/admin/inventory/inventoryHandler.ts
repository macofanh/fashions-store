import { computed, onMounted, ref, watch } from 'vue'
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
    const currentPage = ref(1)
    const pageSize = ref(10)
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

    const totalItems = ref(0)
    const totalPages = ref(1)
    const stockStats = ref({ total: 0, low: 0, out: 0 })

    const filteredStock = computed(() => stockList.value)

    const handlePageChange = (page: number) => {
        currentPage.value = Math.min(Math.max(page, 1), totalPages.value)
    }

    const fetchStock = async (options?: { background?: boolean }) => {
        const background = options?.background ?? false
        if (background) {
            isRefreshingStock.value = true
        } else {
            isLoading.value = true
        }

        try {
            const result = await inventoryService.getVariantStocks(
                currentPage.value,
                pageSize.value,
                searchQuery.value,
                filterStock.value
            )
            stockList.value = result.items
            totalItems.value = result.total
            totalPages.value = result.totalPages
            if (result.stats) {
                stockStats.value = result.stats
            }
            persistStockCache(result.items)
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
        currentPage.value = 1
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
        // Hydrate cache locally but still trigger initial fetch
        hydrateStockCache()
        void fetchStock()
    })

    let searchTimeout: any = null
    watch(searchQuery, () => {
        if (searchTimeout) clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            currentPage.value = 1
            void fetchStock()
        }, 500)
    })

    watch(filterStock, () => {
        currentPage.value = 1
        void fetchStock()
    })

    watch(currentPage, () => {
        void fetchStock()
    })

    watch(totalPages, pages => {
        if (currentPage.value > pages) {
            currentPage.value = pages
        }
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
        currentPage,
        pageSize,
        totalItems,
        totalPages,
        form,
        filteredStock,
        stockStats,
        fetchStock,
        fetchLogs,
        handlePageChange,
        handleTabChange,
        selectStockFilter,
        openAdjustDrawer,
        closeAdjustDrawer,
        handleAdjustStock,
        formatDateTime,
        changeTypeConfig,
    }
}
