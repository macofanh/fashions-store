<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useUIStore } from '@/stores/useUIStore'

const uiStore = useUIStore()

const orders = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const filterStatus = ref('')

// ── Chi tiết đơn hàng ─────────────────────────────────────────
const selectedOrder = ref<any>(null)
const isDrawerOpen  = ref(false)
const isLoadingDetail = ref(false)

const openDetail = async (order: any) => {
    isDrawerOpen.value  = true
    isLoadingDetail.value = true
    selectedOrder.value = order // hiện ngay dữ liệu cơ bản
    try {
        // Gọi lại để lấy đầy đủ items, payment, shipping, status_logs
        const res = await axiosClient.get(`/api/v1/orders/${order.order_id}?mine_only=false`)
        selectedOrder.value = res.data
    } catch (e) {
        console.error('Lỗi lấy chi tiết đơn:', e)
    } finally {
        isLoadingDetail.value = false
    }
}

const closeDrawer = () => {
    isDrawerOpen.value  = false
    selectedOrder.value = null
}

const fetchAllOrders = async () => {
    isLoading.value = true
    try {
        const response = await axiosClient.get('/api/v1/orders/my?mine_only=false')
        orders.value = response.data
    } catch (error) {
        console.error('Lỗi lấy danh sách đơn hàng:', error)
    } finally {
        isLoading.value = false
    }
}

const filteredOrders = computed(() => {
    let list = orders.value
    if (filterStatus.value) list = list.filter(o => o.status === filterStatus.value)
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(o =>
            o.order_code?.toLowerCase().includes(q) ||
            o.address_snapshot?.recipient_name?.toLowerCase().includes(q) ||
            o.address_snapshot?.phone?.includes(q)
        )
    }
    return list
})

const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
        await axiosClient.put(`/api/v1/orders/${orderId}/status`, {
            to_status: newStatus,
            note: 'Cập nhật bởi Admin'
        })
        // Cập nhật cả list và drawer
        const order = orders.value.find(o => o.order_id === orderId)
        if (order) order.status = newStatus
        if (selectedOrder.value?.order_id === orderId) {
            selectedOrder.value.status = newStatus
        }
        uiStore.success('Cập nhật trạng thái thành công.')
    } catch (error: any) {
        uiStore.error(error.response?.data?.detail || 'Cập nhật thất bại.')
    }
}

const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
    PENDING:   { label: 'Chờ xử lý',   bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400'  },
    CONFIRMED: { label: 'Đã xác nhận', bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-400'   },
    SHIPPING:  { label: 'Đang giao',   bg: 'bg-indigo-50',  text: 'text-indigo-700', dot: 'bg-indigo-400' },
    DELIVERED: { label: 'Đã giao',     bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-400'},
    CANCELLED: { label: 'Đã hủy',      bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-400'    },
    REFUNDED:  { label: 'Hoàn tiền',   bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400'  },
}

const paymentStatusConfig: Record<string, { label: string; cls: string }> = {
    PENDING:  { label: 'Chờ thanh toán', cls: 'bg-amber-50 text-amber-700'   },
    PAID:     { label: 'Đã thanh toán',  cls: 'bg-emerald-50 text-emerald-700'},
    FAILED:   { label: 'Thất bại',       cls: 'bg-red-50 text-red-600'        },
    REFUNDED: { label: 'Đã hoàn tiền',   cls: 'bg-slate-100 text-slate-600'   },
}

const statusFlow = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

const formatDateShort = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

// Stats
const stats = computed(() => ({
    total:     orders.value.length,
    pending:   orders.value.filter(o => o.status === 'PENDING').length,
    shipping:  orders.value.filter(o => o.status === 'SHIPPING').length,
    delivered: orders.value.filter(o => o.status === 'DELIVERED').length,
}))

onMounted(fetchAllOrders)
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Quản lý Đơn hàng</h1>
                <p class="text-sm text-slate-500 mt-1">Theo dõi và cập nhật trạng thái vận chuyển</p>
            </div>
        </div>

        <!-- Stats mini -->
        <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div v-for="(item, key) in [
                { label: 'Tổng đơn',    value: stats.total,     icon: 'receipt_long',  color: 'text-slate-600',   bg: 'bg-slate-100'   },
                { label: 'Chờ xử lý',   value: stats.pending,   icon: 'pending',       color: 'text-amber-600',   bg: 'bg-amber-50'    },
                { label: 'Đang giao',   value: stats.shipping,  icon: 'local_shipping',color: 'text-indigo-600',  bg: 'bg-indigo-50'   },
                { label: 'Đã giao',     value: stats.delivered, icon: 'check_circle',  color: 'text-emerald-600', bg: 'bg-emerald-50'  },
            ]" :key="key"
                class="bg-white rounded-2xl border border-slate-200 p-5 flex items-center gap-4 shadow-sm"
            >
                <div :class="['w-10 h-10 rounded-xl flex items-center justify-center shrink-0', item.bg]">
                    <span :class="['material-symbols-outlined text-[20px]', item.color]">{{ item.icon }}</span>
                </div>
                <div>
                    <p class="text-2xl font-bold text-slate-900">{{ item.value }}</p>
                    <p class="text-xs text-slate-500">{{ item.label }}</p>
                </div>
            </div>
        </div>

        <!-- Filters -->
        <div class="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-wrap gap-3 items-center">
            <!-- Search -->
            <div class="relative flex-grow min-w-[200px] max-w-sm">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Tìm mã đơn, tên khách..."
                    class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all bg-slate-50"
                />
            </div>
            <!-- Status filter -->
            <div class="flex flex-wrap gap-2">
                <button
                    @click="filterStatus = ''"
                    :class="['px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all', filterStatus === '' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
                >Tất cả</button>
                <button
                    v-for="(cfg, key) in statusConfig" :key="key"
                    @click="filterStatus = key"
                    :class="['px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all flex items-center gap-1.5',
                        filterStatus === key ? `${cfg.bg} ${cfg.text} ring-2 ring-offset-1 ring-current` : 'bg-slate-100 text-slate-600 hover:bg-slate-200']"
                >
                    <span :class="['w-1.5 h-1.5 rounded-full', cfg.dot]"></span>
                    {{ cfg.label }}
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div class="overflow-x-auto">
                <table class="w-full text-left">
                    <thead>
                        <tr class="border-b border-slate-100 bg-slate-50/60">
                            <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Mã đơn</th>
                            <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Khách hàng</th>
                            <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 hidden md:table-cell">Ngày đặt</th>
                            <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-right">Tổng tiền</th>
                            <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-center">Trạng thái</th>
                            <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-slate-100">
                        <tr v-if="isLoading">
                            <td colspan="6" class="py-20 text-center">
                                <div class="animate-spin h-8 w-8 border-3 border-slate-900 border-t-transparent rounded-full mx-auto"></div>
                            </td>
                        </tr>
                        <tr v-else-if="filteredOrders.length === 0">
                            <td colspan="6" class="py-20 text-center">
                                <span class="material-symbols-outlined text-4xl text-slate-200 block mb-3">inbox</span>
                                <p class="text-slate-400 text-sm">Không tìm thấy đơn hàng nào</p>
                            </td>
                        </tr>
                        <tr v-for="o in filteredOrders" :key="o.order_id" class="hover:bg-slate-50/60 transition-colors">
                            <td class="px-6 py-4">
                                <span class="text-sm font-bold text-slate-800">{{ o.order_code }}</span>
                            </td>
                            <td class="px-6 py-4">
                                <p class="text-sm font-medium text-slate-800">{{ o.address_snapshot?.recipient_name || 'N/A' }}</p>
                                <p class="text-xs text-slate-400 mt-0.5">{{ o.address_snapshot?.phone || '' }}</p>
                            </td>
                            <td class="px-6 py-4 hidden md:table-cell">
                                <p class="text-sm text-slate-500">{{ formatDate(o.created_at) }}</p>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <span class="text-sm font-bold text-slate-800">{{ formatPrice(o.total_amount) }}</span>
                            </td>
                            <td class="px-6 py-4 text-center">
                                <div class="relative inline-block">
                                    <select
                                        :value="o.status"
                                        @change="(e) => handleUpdateStatus(o.order_id, (e.target as HTMLSelectElement).value)"
                                        :class="['appearance-none text-[11px] font-semibold pl-6 pr-7 py-1.5 rounded-full cursor-pointer outline-none border-0 transition-all',
                                            statusConfig[o.status]?.bg, statusConfig[o.status]?.text]"
                                    >
                                        <option v-for="s in statusFlow" :key="s" :value="s">{{ statusConfig[s]?.label || s }}</option>
                                    </select>
                                    <span :class="['absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none', statusConfig[o.status]?.dot]"></span>
                                    <span class="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none opacity-50">expand_more</span>
                                </div>
                            </td>
                            <td class="px-6 py-4 text-right">
                                <button
                                    @click="openDetail(o)"
                                    class="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50 flex items-center gap-1 ml-auto"
                                >
                                    <span class="material-symbols-outlined text-[14px]">open_in_new</span>
                                    Chi tiết
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div v-if="!isLoading" class="px-6 py-3 border-t border-slate-100 text-xs text-slate-400">
                Hiển thị {{ filteredOrders.length }} / {{ orders.length }} đơn hàng
            </div>
        </div>
    </div>

    <!-- ── ORDER DETAIL DRAWER ──────────────────────────────────── -->
    <Teleport to="body">
        <Transition name="drawer">
            <div v-if="isDrawerOpen" class="fixed inset-0 z-[100] flex justify-end">
                <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer"></div>

                <div class="relative w-full max-w-2xl bg-white shadow-2xl flex flex-col h-full rounded-l-2xl overflow-hidden">

                    <!-- Header -->
                    <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
                        <div>
                            <h2 class="text-base font-bold text-slate-900">
                                Chi tiết đơn hàng
                                <span v-if="selectedOrder" class="text-indigo-600 ml-1">{{ selectedOrder.order_code }}</span>
                            </h2>
                            <p class="text-xs text-slate-400 mt-0.5">
                                {{ selectedOrder ? formatDate(selectedOrder.created_at) : '' }}
                            </p>
                        </div>
                        <button @click="closeDrawer" class="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full transition-colors">
                            <span class="material-symbols-outlined text-[20px] text-slate-500">close</span>
                        </button>
                    </div>

                    <!-- Loading -->
                    <div v-if="isLoadingDetail" class="flex-grow flex items-center justify-center">
                        <div class="animate-spin h-8 w-8 border-2 border-indigo-500 border-t-transparent rounded-full"></div>
                    </div>

                    <!-- Content -->
                    <div v-else-if="selectedOrder" class="flex-grow overflow-y-auto p-6 space-y-6">

                        <!-- ── Trạng thái + cập nhật ── -->
                        <section class="bg-white border border-slate-100 rounded-xl p-5 space-y-4">
                            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng thái đơn hàng</h3>

                            <div class="flex items-center gap-3 flex-wrap">
                                <!-- Order status -->
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-slate-500">Đơn hàng:</span>
                                    <div class="relative inline-block">
                                        <select
                                            :value="selectedOrder.status"
                                            @change="(e) => handleUpdateStatus(selectedOrder.order_id, (e.target as HTMLSelectElement).value)"
                                            :class="['appearance-none text-[11px] font-semibold pl-6 pr-7 py-1.5 rounded-full cursor-pointer outline-none border-0 transition-all',
                                                statusConfig[selectedOrder.status]?.bg, statusConfig[selectedOrder.status]?.text]"
                                        >
                                            <option v-for="s in statusFlow" :key="s" :value="s">{{ statusConfig[s]?.label || s }}</option>
                                        </select>
                                        <span :class="['absolute left-2 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full pointer-events-none', statusConfig[selectedOrder.status]?.dot]"></span>
                                        <span class="material-symbols-outlined absolute right-1.5 top-1/2 -translate-y-1/2 text-[14px] pointer-events-none opacity-50">expand_more</span>
                                    </div>
                                </div>

                                <!-- Payment status -->
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-slate-500">Thanh toán:</span>
                                    <span :class="['text-[11px] font-semibold px-2.5 py-1 rounded-full', paymentStatusConfig[selectedOrder.payment_status]?.cls || 'bg-slate-100 text-slate-500']">
                                        {{ paymentStatusConfig[selectedOrder.payment_status]?.label || selectedOrder.payment_status }}
                                    </span>
                                </div>
                            </div>

                            <!-- Timeline lịch sử trạng thái -->
                            <div v-if="selectedOrder.status_logs?.length" class="space-y-2 pt-2 border-t border-slate-50">
                                <p class="text-[10px] uppercase tracking-wider text-slate-400 font-semibold mb-3">Lịch sử</p>
                                <div v-for="log in [...selectedOrder.status_logs].reverse()" :key="log.history_id"
                                    class="flex items-start gap-3 text-xs">
                                    <div class="w-2 h-2 rounded-full bg-slate-300 mt-1.5 shrink-0"></div>
                                    <div>
                                        <span class="font-semibold text-slate-700">
                                            {{ log.from_status ? `${statusConfig[log.from_status]?.label || log.from_status} → ` : '' }}{{ statusConfig[log.to_status]?.label || log.to_status }}
                                        </span>
                                        <span v-if="log.note" class="text-slate-400 ml-1">· {{ log.note }}</span>
                                        <p class="text-slate-400 mt-0.5">{{ formatDate(log.created_at) }}</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <!-- ── Sản phẩm ── -->
                        <section class="bg-white border border-slate-100 rounded-xl p-5 space-y-3">
                            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Sản phẩm đặt mua</h3>
                            <div v-for="item in selectedOrder.items" :key="item.item_id"
                                class="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
                                <div class="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                    <span class="material-symbols-outlined text-slate-400 text-[18px]">checkroom</span>
                                </div>
                                <div class="flex-grow min-w-0">
                                    <p class="text-sm font-semibold text-slate-800 truncate">{{ item.product_name }}</p>
                                    <p class="text-xs text-slate-400">{{ item.variant_info }} · SKU: {{ item.sku_snapshot }}</p>
                                </div>
                                <div class="text-right shrink-0">
                                    <p class="text-sm font-bold text-slate-800">{{ formatPrice(item.unit_price * item.quantity) }}</p>
                                    <p class="text-xs text-slate-400">{{ formatPrice(item.unit_price) }} × {{ item.quantity }}</p>
                                </div>
                            </div>

                            <!-- Tổng tiền -->
                            <div class="pt-3 space-y-1.5 border-t border-slate-100">
                                <div class="flex justify-between text-xs text-slate-500">
                                    <span>Tạm tính</span>
                                    <span>{{ formatPrice(selectedOrder.subtotal) }}</span>
                                </div>
                                <div v-if="selectedOrder.discount_amount > 0" class="flex justify-between text-xs text-emerald-600">
                                    <span>Giảm giá</span>
                                    <span>-{{ formatPrice(selectedOrder.discount_amount) }}</span>
                                </div>
                                <div class="flex justify-between text-xs text-slate-500">
                                    <span>Phí vận chuyển</span>
                                    <span>{{ formatPrice(selectedOrder.shipping_fee) }}</span>
                                </div>
                                <div v-if="selectedOrder.points_used > 0" class="flex justify-between text-xs text-amber-600">
                                    <span>Điểm thưởng dùng</span>
                                    <span>-{{ formatPrice(selectedOrder.points_used) }}</span>
                                </div>
                                <div class="flex justify-between text-sm font-bold text-slate-900 pt-1.5 border-t border-slate-100">
                                    <span>Tổng cộng</span>
                                    <span>{{ formatPrice(selectedOrder.total_amount) }}</span>
                                </div>
                            </div>
                        </section>

                        <!-- ── Địa chỉ giao hàng ── -->
                        <section class="bg-white border border-slate-100 rounded-xl p-5 space-y-3">
                            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Địa chỉ giao hàng</h3>
                            <div class="flex items-start gap-3">
                                <span class="material-symbols-outlined text-slate-400 text-[18px] mt-0.5 shrink-0" style="font-variation-settings:'FILL' 1">location_on</span>
                                <div>
                                    <p class="text-sm font-semibold text-slate-800">{{ selectedOrder.address_snapshot?.recipient_name }}</p>
                                    <p class="text-xs text-slate-500 mt-0.5">{{ selectedOrder.address_snapshot?.phone }}</p>
                                    <p class="text-xs text-slate-500 mt-1 leading-relaxed">
                                        {{ selectedOrder.address_snapshot?.street_address }},
                                        {{ selectedOrder.address_snapshot?.ward }},
                                        {{ selectedOrder.address_snapshot?.district }},
                                        {{ selectedOrder.address_snapshot?.province }}
                                    </p>
                                </div>
                            </div>
                            <div v-if="selectedOrder.note" class="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
                                <span class="material-symbols-outlined text-amber-500 text-[16px] shrink-0 mt-0.5">sticky_note_2</span>
                                <p class="text-xs text-amber-700">{{ selectedOrder.note }}</p>
                            </div>
                        </section>

                        <!-- ── Thanh toán ── -->
                        <section v-if="selectedOrder.payment" class="bg-white border border-slate-100 rounded-xl p-5 space-y-3">
                            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin thanh toán</h3>
                            <div class="grid grid-cols-2 gap-3 text-xs">
                                <div class="bg-slate-50 rounded-lg p-3">
                                    <p class="text-slate-400 mb-1">Phương thức</p>
                                    <p class="font-semibold text-slate-700">{{ selectedOrder.payment_method }}</p>
                                </div>
                                <div class="bg-slate-50 rounded-lg p-3">
                                    <p class="text-slate-400 mb-1">Trạng thái</p>
                                    <span :class="['font-semibold px-2 py-0.5 rounded-full text-[10px]', paymentStatusConfig[selectedOrder.payment.status]?.cls || 'bg-slate-100 text-slate-500']">
                                        {{ paymentStatusConfig[selectedOrder.payment.status]?.label || selectedOrder.payment.status }}
                                    </span>
                                </div>
                                <div v-if="selectedOrder.payment.transaction_id" class="bg-slate-50 rounded-lg p-3 col-span-2">
                                    <p class="text-slate-400 mb-1">Mã giao dịch</p>
                                    <p class="font-semibold text-slate-700 font-mono text-[11px]">{{ selectedOrder.payment.transaction_id }}</p>
                                </div>
                                <div v-if="selectedOrder.payment.paid_at" class="bg-slate-50 rounded-lg p-3 col-span-2">
                                    <p class="text-slate-400 mb-1">Thời gian thanh toán</p>
                                    <p class="font-semibold text-slate-700">{{ formatDate(selectedOrder.payment.paid_at) }}</p>
                                </div>
                            </div>
                        </section>

                        <!-- ── Vận chuyển ── -->
                        <section v-if="selectedOrder.shipping_info" class="bg-white border border-slate-100 rounded-xl p-5 space-y-3">
                            <h3 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Thông tin vận chuyển</h3>
                            <div class="grid grid-cols-2 gap-3 text-xs">
                                <div class="bg-slate-50 rounded-lg p-3">
                                    <p class="text-slate-400 mb-1">Đơn vị vận chuyển</p>
                                    <p class="font-semibold text-slate-700">{{ selectedOrder.shipping_info.carrier }}</p>
                                </div>
                                <div v-if="selectedOrder.shipping_info.tracking_code" class="bg-slate-50 rounded-lg p-3">
                                    <p class="text-slate-400 mb-1">Mã tracking</p>
                                    <p class="font-semibold text-slate-700 font-mono text-[11px]">{{ selectedOrder.shipping_info.tracking_code }}</p>
                                </div>
                                <div v-if="selectedOrder.shipping_info.estimated_date" class="bg-slate-50 rounded-lg p-3">
                                    <p class="text-slate-400 mb-1">Dự kiến giao</p>
                                    <p class="font-semibold text-slate-700">{{ formatDateShort(selectedOrder.shipping_info.estimated_date) }}</p>
                                </div>
                                <div v-if="selectedOrder.shipping_info.status" class="bg-slate-50 rounded-lg p-3">
                                    <p class="text-slate-400 mb-1">Trạng thái ship</p>
                                    <p class="font-semibold text-slate-700">{{ selectedOrder.shipping_info.status }}</p>
                                </div>
                            </div>
                        </section>

                        <!-- ── Hoàn tiền ── -->
                        <section v-if="selectedOrder.refund" class="bg-red-50 border border-red-100 rounded-xl p-5 space-y-3">
                            <h3 class="text-xs font-bold text-red-500 uppercase tracking-wider flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[15px]">currency_exchange</span>
                                Yêu cầu hoàn tiền
                            </h3>
                            <div class="grid grid-cols-2 gap-3 text-xs">
                                <div class="bg-white rounded-lg p-3">
                                    <p class="text-slate-400 mb-1">Số tiền hoàn</p>
                                    <p class="font-bold text-red-600">{{ formatPrice(selectedOrder.refund.amount) }}</p>
                                </div>
                                <div class="bg-white rounded-lg p-3">
                                    <p class="text-slate-400 mb-1">Trạng thái</p>
                                    <p class="font-semibold text-slate-700">{{ selectedOrder.refund.status }}</p>
                                </div>
                                <div v-if="selectedOrder.refund.reason" class="bg-white rounded-lg p-3 col-span-2">
                                    <p class="text-slate-400 mb-1">Lý do</p>
                                    <p class="text-slate-700">{{ selectedOrder.refund.reason }}</p>
                                </div>
                            </div>
                        </section>

                        <!-- ── Điểm thưởng ── -->
                        <section v-if="selectedOrder.points_earned > 0 || selectedOrder.points_used > 0"
                            class="bg-amber-50 border border-amber-100 rounded-xl p-5">
                            <h3 class="text-xs font-bold text-amber-600 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                                <span class="material-symbols-outlined text-[15px]" style="font-variation-settings:'FILL' 1">stars</span>
                                Điểm thưởng
                            </h3>
                            <div class="flex gap-4 text-xs">
                                <div v-if="selectedOrder.points_used > 0">
                                    <p class="text-amber-600/70 mb-0.5">Đã dùng</p>
                                    <p class="font-bold text-amber-700">-{{ selectedOrder.points_used.toLocaleString('vi-VN') }} điểm</p>
                                </div>
                                <div v-if="selectedOrder.points_earned > 0">
                                    <p class="text-amber-600/70 mb-0.5">Tích được</p>
                                    <p class="font-bold text-amber-700">+{{ selectedOrder.points_earned.toLocaleString('vi-VN') }} điểm</p>
                                </div>
                            </div>
                        </section>

                    </div>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.border-3 { border-width: 3px; }
.drawer-enter-active { transition: opacity 0.25s ease; }
.drawer-leave-active { transition: opacity 0.2s ease; }
.drawer-enter-active .relative, .drawer-leave-active .relative { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from { opacity: 0; }
.drawer-leave-to   { opacity: 0; }
.drawer-enter-from .relative { transform: translateX(100%); }
.drawer-leave-to   .relative { transform: translateX(100%); }
</style>
