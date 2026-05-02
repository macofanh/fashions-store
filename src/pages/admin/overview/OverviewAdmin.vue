<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axiosClient from '@/lib/axiosClient'

interface StatItem {
    name: string
    value: string | number
    icon: string
    color: string
}

const orders = ref<any[]>([])
const totalProducts = ref(0)
const totalUsers = ref(0)
const isLoading = ref(true)

const fetchDashboardData = async () => {
    isLoading.value = true
    try {
        const [ordersRes, productsRes, usersRes] = await Promise.all([
            axiosClient.get('/api/v1/orders/my?mine_only=false'),
            axiosClient.get('/api/v1/products'),
            axiosClient.get('/api/v1/users')
        ])
        
        orders.value = ordersRes.data
        totalProducts.value = productsRes.data.total || 0
        totalUsers.value = Array.isArray(usersRes.data) ? usersRes.data.length : 0
    } catch (error) {
        console.error('Lỗi lấy dữ liệu tổng quan:', error)
    } finally {
        isLoading.value = false
    }
}

const stats = computed(() => {
    // Tính toán doanh thu tháng hiện tại
    const now = new Date()
    const currentMonth = now.getMonth()
    const currentYear = now.getFullYear()
    
    const monthlyRevenue = orders.value
        .filter(o => {
            const date = new Date(o.created_at)
            return date.getMonth() === currentMonth && 
                   date.getFullYear() === currentYear &&
                   o.status !== 'CANCELLED'
        })
        .reduce((sum, o) => sum + Number(o.total_amount), 0)

    const pendingOrders = orders.value.filter(o => o.status === 'PENDING').length

    return [
        { 
            name: 'Doanh thu tháng', 
            value: formatPrice(monthlyRevenue), 
            icon: 'payments', 
            color: 'text-emerald-600' 
        },
        { 
            name: 'Đơn hàng mới', 
            value: pendingOrders.toString(), 
            icon: 'shopping_bag', 
            color: 'text-blue-600' 
        },
        { 
            name: 'Sản phẩm', 
            value: totalProducts.value.toString(), 
            icon: 'inventory_2', 
            color: 'text-amber-600' 
        },
        { 
            name: 'Khách hàng', 
            value: totalUsers.value.toLocaleString('vi-VN'), 
            icon: 'group', 
            color: 'text-purple-600' 
        },
    ]
})

const recentOrders = computed(() => {
    return orders.value.slice(0, 5)
})

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}

const formatTimeAgo = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
}

onMounted(fetchDashboardData)
</script>

<template>
    <div class="space-y-10">
        <header>
            <h1 class="text-3xl serif-text italic text-zinc-900">Tổng quan hệ thống</h1>
            <p class="text-xs text-zinc-400 uppercase tracking-widest mt-2 font-bold">Dữ liệu thống kê thời gian thực</p>
        </header>

        <div v-if="isLoading" class="py-20 flex justify-center">
            <div class="animate-spin h-8 w-8 border-4 border-zinc-900 border-t-transparent rounded-full"></div>
        </div>

        <template v-else>
            <!-- Stats Grid -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div v-for="stat in stats" :key="stat.name" class="bg-white p-8 border border-zinc-100 shadow-sm hover:shadow-md transition-shadow">
                    <div class="flex justify-between items-start mb-4">
                        <span :class="['material-symbols-outlined text-3xl', stat.color]">{{ stat.icon }}</span>
                    </div>
                    <p class="text-[10px] uppercase tracking-widest font-bold text-zinc-400 mb-1">{{ stat.name }}</p>
                    <h3 class="text-2xl font-bold text-zinc-900">{{ stat.value }}</h3>
                </div>
            </div>

            <!-- Recent Activity -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-10">
                <div class="bg-white border border-zinc-100 p-8 shadow-sm">
                    <h3 class="text-[11px] uppercase tracking-[0.2em] font-bold text-zinc-900 mb-8 border-b border-zinc-50 pb-4">Biểu đồ doanh thu</h3>
                    <div class="h-64 flex items-center justify-center bg-zinc-50 border border-dashed border-zinc-200">
                        <p class="text-zinc-400 text-xs italic">Dữ liệu dựa trên {{ orders.length }} đơn hàng hiện có</p>
                    </div>
                </div>
                <div class="bg-white border border-zinc-100 p-8 shadow-sm">
                    <h3 class="text-[11px] uppercase tracking-[0.2em] font-bold text-zinc-900 mb-8 border-b border-zinc-50 pb-4">Đơn hàng vừa đặt</h3>
                    <div class="space-y-6">
                        <div v-for="order in recentOrders" :key="order.order_id" class="flex justify-between items-center py-2 border-b border-zinc-50 last:border-0">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-10 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-900">
                                    #{{ order.order_id }}
                                </div>
                                <div>
                                    <p class="text-xs font-bold text-zinc-900">{{ order.address_snapshot?.recipient_name || 'Khách hàng' }}</p>
                                    <p class="text-[10px] text-zinc-400">{{ formatTimeAgo(order.created_at) }}</p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p class="text-xs font-bold text-zinc-900">{{ formatPrice(order.total_amount) }}</p>
                                <p :class="['text-[8px] font-black uppercase tracking-tighter', order.status === 'PENDING' ? 'text-amber-500' : 'text-zinc-400']">
                                    {{ order.status }}
                                </p>
                            </div>
                        </div>
                        <div v-if="recentOrders.length === 0" class="text-center py-10 text-zinc-400 text-xs italic">
                            Chưa có đơn hàng nào
                        </div>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<style scoped>
.serif-text { font-family: 'Playfair Display', serif; }
</style>
