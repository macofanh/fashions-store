import { ref, computed, onMounted, watch } from 'vue'
import axiosClient from '@/lib/axiosClient'

export function useOverviewAdmin() {
    // ── Types ─────────────────────────────────────────────────────────
    interface RevenuePoint { label: string; period: number; revenue: number; count: number }
    interface RevenueStats {
        mode: string; year: number; month: number | null
        total_revenue: number; total_orders: number; data: RevenuePoint[]
    }

    // ── State ─────────────────────────────────────────────────────────
    const isLoading = ref(true)
    const isChartLoading = ref(false)

    // Summary cards
    const totalProducts = ref(0)
    const totalUsers = ref(0)
    const recentOrders = ref<any[]>([])
    const pendingCount = ref(0)

    // Revenue chart
    const revenueMode = ref<'year' | 'month' | 'day'>('month')
    const selectedYear = ref(new Date().getFullYear())
    const selectedMonth = ref(new Date().getMonth() + 1)
    const revenueStats = ref<RevenueStats | null>(null)

    const currentYear = new Date().getFullYear()
    const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - i)
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))

    // ── Fetch ─────────────────────────────────────────────────────────
    const fetchSummary = async () => {
        try {
            const [productsRes, usersRes, ordersRes] = await Promise.all([
                axiosClient.get('/api/v1/products', { params: { page_size: 1 } }),
                axiosClient.get('/api/v1/users', { params: { page_size: 1 } }),
                axiosClient.get('/api/v1/orders/my', { params: { mine_only: false } }),
            ])
            totalProducts.value = productsRes.data.total || 0
            totalUsers.value = usersRes.data.total || 0
            const orders: any[] = ordersRes.data || []
            pendingCount.value = orders.filter(o => o.status === 'PENDING').length
            recentOrders.value = orders.slice(0, 6)
        } catch (e) {
            console.error('Lỗi lấy summary:', e)
        }
    }

    const fetchRevenue = async () => {
        isChartLoading.value = true
        try {
            const params: any = { mode: revenueMode.value, year: selectedYear.value }
            if (revenueMode.value === 'month' || revenueMode.value === 'day') {
                params.month = selectedMonth.value
            }
            const res = await axiosClient.get('/api/v1/orders/stats/revenue', { params })
            revenueStats.value = res.data
        } catch (e) {
            console.error('Lỗi lấy doanh thu:', e)
        } finally {
            isChartLoading.value = false
        }
    }

    // ── Computed ──────────────────────────────────────────────────────
    const chartData = computed(() => revenueStats.value?.data ?? [])

    const chartMax = computed(() => {
        const max = Math.max(...chartData.value.map(d => d.revenue), 0)
        if (max === 0) return 1
        // Làm tròn lên để trục Y đẹp hơn
        const magnitude = Math.pow(10, Math.floor(Math.log10(max)))
        return Math.ceil(max / magnitude) * magnitude
    })

    // Nhãn trục Y: 5 mức đều nhau
    const yLabels = computed(() => {
        const max = chartMax.value
        return [max, max * 0.75, max * 0.5, max * 0.25, 0]
    })

    // Nhãn trục X: chỉ hiện một số nhãn tránh chật
    const xLabelVisible = computed(() => {
        const n = chartData.value.length
        if (n === 0) return () => false
        if (revenueMode.value === 'year') return (_: RevenuePoint, i: number) => true          // 12 tháng → hiện hết
        if (revenueMode.value === 'month') return (d: RevenuePoint) => d.period % 5 === 1      // ngày 1,6,11,16,21,26,31
        return (d: RevenuePoint) => d.period % 6 === 0                                          // giờ 0,6,12,18
    })

    // Helper tính toán vị trí/kích thước cột trong SVG
    // chartWidth=740 (x: 52→792), chartHeight=184 (y: 8→192)
    const CHART_X0 = 52
    const CHART_W  = 740
    const CHART_Y0 = 8
    const CHART_H  = 184

    function barSlotWidth(n: number) { return CHART_W / n }
    function barWidth(n: number)     { return Math.min(barSlotWidth(n) * 0.6, 32) }
    function barX(idx: number, n: number) {
        return CHART_X0 + (idx + 0.5) * barSlotWidth(n) - barWidth(n) / 2
    }
    function barY(revenue: number, max: number) {
        return revenue > 0 ? CHART_Y0 + (1 - revenue / max) * CHART_H : CHART_Y0 + CHART_H - 1
    }
    function barH(revenue: number, max: number) {
        return revenue > 0 ? (revenue / max) * CHART_H : 1
    }
    function labelX(idx: number, n: number) {
        return CHART_X0 + (idx + 0.5) * barSlotWidth(n)
    }

    const modeLabel = computed(() => {
        if (revenueMode.value === 'year') return `Năm ${selectedYear.value}`
        if (revenueMode.value === 'month') return `Tháng ${selectedMonth.value}/${selectedYear.value}`
        return `Hôm nay ${new Date().toLocaleDateString('vi-VN')}`
    })

    // ── Watchers ──────────────────────────────────────────────────────
    watch([revenueMode, selectedYear, selectedMonth], fetchRevenue)

    // ── Lifecycle ─────────────────────────────────────────────────────
    onMounted(async () => {
        isLoading.value = true
        void fetchRevenue()
        await fetchSummary()
        isLoading.value = false
    })

    // ── Helpers ───────────────────────────────────────────────────────
    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    const formatPriceShort = (price: number) => {
        if (price >= 1_000_000_000) return (price / 1_000_000_000).toFixed(1) + 'B'
        if (price >= 1_000_000) return (price / 1_000_000).toFixed(1) + 'M'
        if (price >= 1_000) return (price / 1_000).toFixed(0) + 'K'
        return price.toString()
    }

    const formatTime = (dateStr: string) => {
        const d = new Date(dateStr)
        return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
            ' · ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
    }

    const statusConfig: Record<string, { label: string; cls: string }> = {
        PENDING:   { label: 'Chờ xử lý',  cls: 'bg-amber-50 text-amber-600' },
        CONFIRMED: { label: 'Đã xác nhận', cls: 'bg-blue-50 text-blue-600' },
        SHIPPING:  { label: 'Đang giao',   cls: 'bg-indigo-50 text-indigo-600' },
        DELIVERED: { label: 'Đã giao',     cls: 'bg-green-50 text-green-600' },
        CANCELLED: { label: 'Đã hủy',      cls: 'bg-red-50 text-red-500' },
        REFUNDED:  { label: 'Hoàn tiền',   cls: 'bg-zinc-100 text-zinc-500' },
    }

    return {
        isLoading,
        isChartLoading,
        totalProducts,
        totalUsers,
        recentOrders,
        pendingCount,
        revenueMode,
        selectedYear,
        selectedMonth,
        revenueStats,
        currentYear,
        yearOptions,
        monthOptions,
        fetchSummary,
        fetchRevenue,
        chartData,
        chartMax,
        yLabels,
        xLabelVisible,
        CHART_X0,
        CHART_W,
        CHART_Y0,
        CHART_H,
        barSlotWidth,
        barWidth,
        barX,
        barY,
        barH,
        labelX,
        modeLabel,
        formatPrice,
        formatPriceShort,
        formatTime,
        statusConfig
    }
}
