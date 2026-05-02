<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axiosClient from '@/lib/axiosClient'

const orders = ref<any[]>([])
const isLoading = ref(true)

const fetchAllOrders = async () => {
    isLoading.value = true
    try {
        // Gọi API lấy danh sách đơn hàng dành cho Admin (mine_only=false)
        const response = await axiosClient.get('/api/v1/orders/my?mine_only=false')
        orders.value = response.data
    } catch (error) {
        console.error('Lỗi lấy danh sách đơn hàng:', error)
    } finally {
        isLoading.value = false
    }
}

const handleUpdateStatus = async (orderId: number, newStatus: string) => {
    try {
        await axiosClient.put(`/api/v1/orders/${orderId}/status`, {
            to_status: newStatus,
            note: 'Cập nhật bởi Admin'
        })
        const order = orders.value.find(o => o.order_id === orderId)
        if (order) order.status = newStatus
        alert('Cập nhật trạng thái thành công!')
    } catch (error) {
        console.error('Lỗi cập nhật trạng thái:', error)
        alert('Cập nhật thất bại, vui lòng thử lại.')
    }
}

onMounted(fetchAllOrders)

const getStatusClass = (status: string) => {
    switch (status) {
        case 'DELIVERED': return 'bg-green-50 text-green-600'
        case 'CANCELLED': return 'bg-red-50 text-red-600'
        case 'PENDING': return 'bg-amber-50 text-amber-600'
        case 'SHIPPING': return 'bg-blue-50 text-blue-600'
        default: return 'bg-zinc-50 text-zinc-600'
    }
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
</script>

<template>
    <div class="space-y-10">
        <header>
            <h1 class="text-3xl serif-text italic text-zinc-900">Quản lý Đơn hàng</h1>
            <p class="text-xs text-zinc-400 uppercase tracking-widest mt-2 font-bold">Theo dõi và cập nhật trạng thái vận chuyển hệ thống</p>
        </header>

        <div class="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Mã đơn hàng</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Khách hàng</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Ngày đặt</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-right">Tổng tiền</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-center">Trạng thái</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-50">
                    <tr v-if="isLoading">
                        <td colspan="6" class="px-8 py-20 text-center">
                             <div class="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full mx-auto"></div>
                        </td>
                    </tr>
                    <tr v-else-if="orders.length === 0">
                        <td colspan="6" class="px-8 py-20 text-center text-zinc-400 text-xs uppercase tracking-widest">
                            Chưa có đơn hàng nào trong hệ thống
                        </td>
                    </tr>
                    <tr v-for="o in orders" :key="o.order_id" class="hover:bg-zinc-50/50 transition-colors text-xs">
                        <td class="px-8 py-6 font-bold text-zinc-900">{{ o.order_code }}</td>
                        <td class="px-8 py-6">
                            <p class="font-medium text-zinc-900">{{ o.address_snapshot?.recipient_name || 'N/A' }}</p>
                            <p class="text-[10px] text-zinc-400 mt-1">{{ o.address_snapshot?.phone || '' }}</p>
                        </td>
                        <td class="px-8 py-6 text-zinc-500 italic">{{ formatDate(o.created_at) }}</td>
                        <td class="px-8 py-6 text-right font-bold">{{ formatPrice(o.total_amount) }}</td>
                        <td class="px-8 py-6 text-center">
                            <select 
                                :value="o.status"
                                @change="(e) => handleUpdateStatus(o.order_id, (e.target as HTMLSelectElement).value)"
                                :class="['text-[9px] uppercase tracking-[0.1em] font-bold px-3 py-1.5 rounded-full cursor-pointer outline-none border-none shadow-sm', getStatusClass(o.status)]"
                            >
                                <option value="PENDING">PENDING</option>
                                <option value="CONFIRMED">CONFIRMED</option>
                                <option value="SHIPPING">SHIPPING</option>
                                <option value="DELIVERED">DELIVERED</option>
                                <option value="CANCELLED">CANCELLED</option>
                                <option value="REFUNDED">REFUNDED</option>
                            </select>
                        </td>
                        <td class="px-8 py-6 text-right">
                            <button class="text-[10px] uppercase tracking-widest font-bold text-zinc-900 underline underline-offset-4 hover:text-zinc-500 transition-colors">
                                Chi tiết
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>

<style scoped>
.serif-text { font-family: 'Playfair Display', serif; }
</style>
