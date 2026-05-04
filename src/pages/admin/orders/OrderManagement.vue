<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axiosClient from '@/lib/axiosClient'

const orders = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')
const filterStatus = ref('')

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
        const order = orders.value.find(o => o.order_id === orderId)
        if (order) order.status = newStatus
    } catch (error: any) {
        alert(error.response?.data?.detail || 'Cập nhật thất bại.')
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

const statusFlow = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED']

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

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
                                <button class="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100">
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
</template>

<style scoped>
.border-3 { border-width: 3px; }
</style>
