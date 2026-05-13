<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import axiosClient from '@/lib/axiosClient'

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
            axiosClient.get('/api/v1/users'),
            axiosClient.get('/api/v1/orders/my', { params: { mine_only: false } }),
        ])
        totalProducts.value = productsRes.data.total || 0
        totalUsers.value = Array.isArray(usersRes.data) ? usersRes.data.length : 0
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
    await Promise.all([fetchSummary(), fetchRevenue()])
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
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div>
            <h1 class="text-2xl font-bold text-gray-900">Tổng quan hệ thống</h1>
            <p class="text-sm text-gray-400 mt-1">Dữ liệu thống kê thời gian thực</p>
        </div>

        <div v-if="isLoading" class="py-20 flex justify-center">
            <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>

        <template v-else>
            <!-- ── STATS CARDS ──────────────────────────────────── -->
            <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <!-- Doanh thu -->
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                            <span class="material-symbols-outlined text-[22px] text-emerald-600">payments</span>
                        </div>
                        <span class="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">Tháng này</span>
                    </div>
                    <p class="text-xs font-semibold text-gray-400 mb-1">Doanh thu</p>
                    <h3 class="text-xl font-bold text-gray-900 leading-tight">
                        {{ revenueStats ? formatPriceShort(revenueStats.total_revenue) + '₫' : '—' }}
                    </h3>
                    <p class="text-xs text-gray-400 mt-1.5">{{ revenueStats?.total_orders || 0 }} đơn đã giao</p>
                </div>

                <!-- Đơn chờ -->
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                            <span class="material-symbols-outlined text-[22px] text-amber-600">shopping_bag</span>
                        </div>
                        <span class="text-[10px] font-semibold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Cần xử lý</span>
                    </div>
                    <p class="text-xs font-semibold text-gray-400 mb-1">Đơn chờ xác nhận</p>
                    <h3 class="text-xl font-bold text-gray-900">{{ pendingCount }}</h3>
                    <p class="text-xs text-gray-400 mt-1.5">Đang chờ xử lý</p>
                </div>

                <!-- Sản phẩm -->
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
                            <span class="material-symbols-outlined text-[22px] text-blue-600">inventory_2</span>
                        </div>
                        <span class="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">Kho hàng</span>
                    </div>
                    <p class="text-xs font-semibold text-gray-400 mb-1">Sản phẩm</p>
                    <h3 class="text-xl font-bold text-gray-900">{{ totalProducts.toLocaleString('vi-VN') }}</h3>
                    <p class="text-xs text-gray-400 mt-1.5">Đang kinh doanh</p>
                </div>

                <!-- Khách hàng -->
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-shadow">
                    <div class="flex items-center justify-between mb-4">
                        <div class="w-10 h-10 bg-violet-50 rounded-xl flex items-center justify-center">
                            <span class="material-symbols-outlined text-[22px] text-violet-600">group</span>
                        </div>
                        <span class="text-[10px] font-semibold text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Thành viên</span>
                    </div>
                    <p class="text-xs font-semibold text-gray-400 mb-1">Khách hàng</p>
                    <h3 class="text-xl font-bold text-gray-900">{{ totalUsers.toLocaleString('vi-VN') }}</h3>
                    <p class="text-xs text-gray-400 mt-1.5">Tài khoản đã đăng ký</p>
                </div>
            </div>

            <!-- ── REVENUE CHART ────────────────────────────────── -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <!-- Chart Header + Filters -->
                <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-5 border-b border-gray-50">
                    <div>
                        <h2 class="text-sm font-bold text-gray-900">Biểu đồ doanh thu</h2>
                        <p class="text-xs text-gray-400 mt-0.5">{{ modeLabel }} · Chỉ tính đơn đã giao thành công</p>
                    </div>

                    <!-- Bộ lọc -->
                    <div class="flex flex-wrap items-center gap-2">
                        <!-- Mode tabs -->
                        <div class="flex bg-gray-100 rounded-xl p-1 gap-1">
                            <button
                                v-for="m in [{ v: 'year', l: 'Năm' }, { v: 'month', l: 'Tháng' }, { v: 'day', l: 'Hôm nay' }]"
                                :key="m.v"
                                @click="revenueMode = m.v as any"
                                :class="['px-3 py-1.5 text-xs font-semibold rounded-lg transition-all', revenueMode === m.v ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700']"
                            >{{ m.l }}</button>
                        </div>

                        <!-- Năm -->
                        <select
                            v-model.number="selectedYear"
                            class="border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-semibold outline-none focus:border-indigo-400 bg-white"
                        >
                            <option v-for="y in yearOptions" :key="y" :value="y">{{ y }}</option>
                        </select>

                        <!-- Tháng -->
                        <select
                            v-if="revenueMode !== 'year'"
                            v-model.number="selectedMonth"
                            class="border border-gray-200 rounded-xl py-1.5 px-3 text-xs font-semibold outline-none focus:border-indigo-400 bg-white"
                        >
                            <option v-for="m in monthOptions" :key="m.value" :value="m.value">{{ m.label }}</option>
                        </select>
                    </div>
                </div>

                <!-- Tổng doanh thu -->
                <div class="flex items-end gap-6 mb-6">
                    <div>
                        <p class="text-xs text-gray-400 mb-1">Tổng doanh thu</p>
                        <p class="text-2xl font-bold text-gray-900">
                            {{ revenueStats ? formatPrice(revenueStats.total_revenue) : '—' }}
                        </p>
                    </div>
                    <div class="pb-0.5">
                        <p class="text-xs text-gray-400 mb-1">Đơn đã giao</p>
                        <p class="text-lg font-bold text-gray-500">{{ revenueStats?.total_orders || 0 }}</p>
                    </div>
                </div>

                <!-- Bar Chart -->
                <div class="relative">
                    <div v-if="isChartLoading" class="h-56 flex items-center justify-center">
                        <div class="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    </div>

                    <div v-else-if="!revenueStats || revenueStats.total_revenue === 0" class="h-56 flex flex-col items-center justify-center text-gray-300">
                        <span class="material-symbols-outlined text-4xl mb-2">bar_chart</span>
                        <p class="text-xs text-gray-400">Chưa có doanh thu trong kỳ này</p>
                    </div>

                    <!-- SVG Chart -->
                    <div v-else class="w-full select-none">
                        <svg
                            viewBox="0 0 800 220"
                            preserveAspectRatio="none"
                            class="w-full overflow-visible"
                            style="height: 220px"
                        >
                            <defs>
                                <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stop-color="#6366f1"/>
                                    <stop offset="100%" stop-color="#818cf8"/>
                                </linearGradient>
                            </defs>

                            <!-- Grid lines ngang: 5 mức (100%, 75%, 50%, 25%, 0%) -->
                            <line v-for="(_, gi) in 5" :key="gi"
                                x1="52" :y1="8 + gi * 46"
                                x2="792" :y2="8 + gi * 46"
                                :stroke="gi === 4 ? '#e2e8f0' : '#f1f5f9'"
                                :stroke-width="gi === 4 ? 1.5 : 1"
                            />

                            <!-- Y-axis labels -->
                            <text v-for="(val, yi) in yLabels" :key="yi"
                                x="48" :y="8 + yi * 46 + 3"
                                text-anchor="end"
                                font-size="9"
                                fill="#94a3b8"
                            >{{ formatPriceShort(val) }}</text>

                            <!-- Bars + X labels -->
                            <g v-for="(point, idx) in chartData" :key="idx">
                                <rect
                                    :x="barX(idx, chartData.length)"
                                    :y="barY(point.revenue, chartMax)"
                                    :width="barWidth(chartData.length)"
                                    :height="barH(point.revenue, chartMax)"
                                    :fill="point.revenue > 0 ? 'url(#barGrad)' : '#f1f5f9'"
                                    rx="3"
                                    class="cursor-pointer"
                                    style="transition: opacity 0.15s"
                                    @mouseenter="(e) => (e.target as SVGElement).style.opacity = '0.75'"
                                    @mouseleave="(e) => (e.target as SVGElement).style.opacity = '1'"
                                >
                                    <title>{{ point.label }}: {{ formatPrice(point.revenue) }} · {{ point.count }} đơn</title>
                                </rect>

                                <!-- X label -->
                                <text
                                    v-if="xLabelVisible(point, idx)"
                                    :x="labelX(idx, chartData.length)"
                                    y="210"
                                    text-anchor="middle"
                                    font-size="9"
                                    fill="#94a3b8"
                                >{{ point.label }}</text>
                            </g>
                        </svg>
                    </div>
                </div>
            </div>

            <!-- ── RECENT ORDERS ─────────────────────────────────── -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div class="px-6 py-4 border-b border-gray-50">
                    <h3 class="text-sm font-bold text-gray-900">Đơn hàng gần đây</h3>
                </div>
                <div class="divide-y divide-gray-50">
                    <div
                        v-for="order in recentOrders"
                        :key="order.order_id"
                        class="flex items-center justify-between px-6 py-4 hover:bg-gray-50/50 transition-colors"
                    >
                        <div class="flex items-center gap-3">
                            <div class="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center text-[10px] font-bold text-gray-600 shrink-0">
                                #{{ order.order_id }}
                            </div>
                            <div>
                                <p class="text-sm font-semibold text-gray-900">{{ order.address_snapshot?.recipient_name || 'Khách hàng' }}</p>
                                <p class="text-xs text-gray-400 mt-0.5">{{ formatTime(order.created_at) }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-4">
                            <span :class="['text-[10px] font-semibold px-2.5 py-1 rounded-full', statusConfig[order.status]?.cls || 'bg-gray-100 text-gray-500']">
                                {{ statusConfig[order.status]?.label || order.status }}
                            </span>
                            <p class="text-sm font-bold text-gray-900 text-right min-w-[90px]">{{ formatPrice(order.total_amount) }}</p>
                        </div>
                    </div>
                    <div v-if="recentOrders.length === 0" class="text-center py-12 text-gray-400 text-sm">
                        Chưa có đơn hàng nào
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
</style>
