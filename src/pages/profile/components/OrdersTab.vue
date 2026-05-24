<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
    orders: any[]
    currentPage: number
    totalPages: number
    totalOrders: number
    itemsPerPage: number
    isLoading: boolean
    formatPrice: (n: number) => string
    formatDate: (s: string) => string
    getStatus: (s: string) => { label: string; classes: string; dot: string }
}>()

const emit = defineEmits<{
    'open-detail': [order: any]
    'page-change': [page: number]
}>()

const changePage = (page: number) => {
    if (page >= 1 && page <= props.totalPages) {
        emit('page-change', page)
    }
}

// Logic showing visible pages
const visiblePages = computed(() => {
    const total = props.totalPages
    const current = props.currentPage
    const pages: (number | string)[] = []
    
    if (total <= 5) {
        for (let i = 1; i <= total; i++) pages.push(i)
    } else {
        pages.push(1)
        if (current > 3) pages.push('...')
        
        const start = Math.max(2, current - 1)
        const end = Math.min(total - 1, current + 1)
        for (let i = start; i <= end; i++) {
            pages.push(i)
        }
        
        if (current < total - 2) pages.push('...')
        pages.push(total)
    }
    return pages
})
</script>

<template>
    <div>
        <div class="mb-8">
            <h2 class="text-2xl md:text-3xl font-serif italic text-fashion-black mb-2">Lịch sử đơn hàng</h2>
            <p class="text-text-muted text-sm font-display">Theo dõi các đơn hàng gần đây và xem chi tiết.</p>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-20">
            <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>

        <!-- Table -->
        <div v-else-if="orders && orders.length > 0" class="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
            <div class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="border-b border-border-light bg-fashion-gray">
                            <th class="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-display">Mã đơn</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-display">Ngày đặt</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-display">Trạng thái</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest font-display">Tổng tiền</th>
                            <th class="px-6 py-4 text-[10px] font-bold text-text-muted uppercase tracking-widest text-right font-display">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-border-light">
                        <tr v-for="order in orders" :key="order.order_id"
                            class="hover:bg-fashion-gray/50 transition-colors">
                            <td class="px-6 py-4">
                                <span class="text-sm font-bold text-fashion-black font-display">{{ order.order_code }}</span>
                            </td>
                            <td class="px-6 py-4 text-sm text-text-muted font-display">{{ formatDate(order.created_at) }}</td>
                            <td class="px-6 py-4">
                                <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-display', getStatus(order.status).classes]">
                                    <span :class="['w-1.5 h-1.5 rounded-full', getStatus(order.status).dot]"></span>
                                    {{ getStatus(order.status).label }}
                                </span>
                            </td>
                            <td class="px-6 py-4 text-sm font-bold text-fashion-black font-display">{{ formatPrice(order.total_amount) }}</td>
                            <td class="px-6 py-4 text-right">
                                <button
                                    @click="emit('open-detail', order)"
                                    class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-dark transition-colors font-display"
                                >
                                    Chi tiết
                                    <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <!-- Footer with pagination info & controls -->
            <div class="px-6 py-4 border-t border-border-light bg-white flex flex-col sm:flex-row justify-between items-center gap-4">
                <span class="text-xs text-text-muted font-display">
                    Hiển thị {{ (currentPage - 1) * itemsPerPage + 1 }} - {{ Math.min(currentPage * itemsPerPage, totalOrders) }} trong số {{ totalOrders }} đơn hàng
                </span>

                <!-- Pagination controls -->
                <div v-if="totalPages > 1" class="flex items-center gap-1.5">
                    <!-- Prev Button -->
                    <button
                        @click="changePage(currentPage - 1)"
                        :disabled="currentPage === 1"
                        class="w-8 h-8 rounded-lg flex items-center justify-center border border-border-light text-text-muted hover:text-fashion-black hover:bg-background-light disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-text-muted transition-all"
                    >
                        <span class="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>

                    <!-- Page Numbers -->
                    <button
                        v-for="page in visiblePages"
                        :key="page"
                        :disabled="page === '...'"
                        @click="typeof page === 'number' ? changePage(page) : undefined"
                        :class="[
                            'w-8 h-8 rounded-lg text-xs font-bold font-display transition-all',
                            currentPage === page
                                ? 'bg-primary text-white'
                                : page === '...' 
                                    ? 'text-text-muted cursor-default'
                                    : 'border border-border-light text-text-muted hover:bg-background-light hover:text-fashion-black'
                        ]"
                    >
                        {{ page }}
                    </button>

                    <!-- Next Button -->
                    <button
                        @click="changePage(currentPage + 1)"
                        :disabled="currentPage === totalPages"
                        class="w-8 h-8 rounded-lg flex items-center justify-center border border-border-light text-text-muted hover:text-fashion-black hover:bg-background-light disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-text-muted transition-all"
                    >
                        <span class="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                </div>
            </div>
        </div>

        <!-- Empty -->
        <div v-else class="text-center py-24 bg-white border border-dashed border-border-light rounded-xl">
            <div class="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-symbols-outlined text-primary text-3xl">package_2</span>
            </div>
            <p class="text-text-muted text-sm uppercase tracking-widest mb-6 font-display">Bạn chưa có đơn hàng nào.</p>
            <router-link to="/products" class="btn-outline px-8 py-3">Khám phá sản phẩm</router-link>
        </div>
    </div>
</template>
