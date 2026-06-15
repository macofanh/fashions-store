<script setup lang="ts">
import { useOverviewAdmin } from './useOverviewAdmin'

const {
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
    statusConfig,
    surveyStats,
    recentSurveys
} = useOverviewAdmin()
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

            <!-- ── Grid 2 columns: Recent Orders & Survey Feedback ── -->
            <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <!-- Left: Recent Orders (7 columns) -->
                <div class="lg:col-span-7 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
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
                                <div class="text-left">
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

                <!-- Right: Survey Feedback (5 columns) -->
                <div class="lg:col-span-5 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden flex flex-col">
                    <div class="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
                        <h3 class="text-sm font-bold text-gray-900">Khảo sát dịch vụ gần đây</h3>
                        <span v-if="surveyStats" class="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">
                            {{ surveyStats.total_responses }} phản hồi
                        </span>
                    </div>

                    <!-- Survey Score Cards -->
                    <div v-if="surveyStats && surveyStats.total_responses > 0" class="p-4 bg-gray-50/50 border-b border-gray-100 grid grid-cols-3 gap-2 text-center">
                        <div class="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span class="block text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Sản phẩm</span>
                            <span class="text-sm font-bold text-indigo-600 mt-0.5 block">{{ surveyStats.avg_product }}★</span>
                        </div>
                        <div class="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span class="block text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Vận chuyển</span>
                            <span class="text-sm font-bold text-amber-500 mt-0.5 block">{{ surveyStats.avg_delivery }}★</span>
                        </div>
                        <div class="bg-white p-2.5 rounded-xl border border-gray-100">
                            <span class="block text-[9px] text-gray-400 font-semibold uppercase tracking-wider">Web / CSKH</span>
                            <span class="text-sm font-bold text-emerald-600 mt-0.5 block">{{ surveyStats.avg_service }}★</span>
                        </div>
                    </div>

                    <!-- Survey Logs list -->
                    <div class="divide-y divide-gray-50 flex-grow max-h-[360px] overflow-y-auto">
                        <div 
                            v-for="survey in recentSurveys" 
                            :key="survey.survey_id"
                            class="p-4 hover:bg-gray-50/50 transition-colors space-y-2 text-left"
                        >
                            <div class="flex items-center justify-between">
                                <div>
                                    <p class="text-xs font-bold text-gray-800">{{ survey.user_name }}</p>
                                    <p class="text-[9px] text-gray-400 mt-0.5">{{ survey.user_email }}</p>
                                </div>
                                <span class="text-[9px] text-gray-400">{{ formatTime(survey.created_at) }}</span>
                            </div>

                            <!-- Star ratings display -->
                            <div class="flex items-center gap-3 text-[9px] text-zinc-500">
                                <span>SP: <b class="text-indigo-600">{{ survey.rating_product }}★</b></span>
                                <span>Giao: <b class="text-amber-500">{{ survey.rating_delivery }}★</b></span>
                                <span>Dịch vụ: <b class="text-emerald-600">{{ survey.rating_service }}★</b></span>
                            </div>

                            <p v-if="survey.comment" class="text-xs font-light text-zinc-600 leading-relaxed bg-zinc-50 p-2 rounded-lg border border-zinc-100/50 italic">
                                "{{ survey.comment }}"
                            </p>
                        </div>

                        <div v-if="recentSurveys.length === 0" class="text-center py-12 text-gray-400 text-sm">
                            Chưa có phản hồi nào
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
</style>
