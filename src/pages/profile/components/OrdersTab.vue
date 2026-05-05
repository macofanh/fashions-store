<script setup lang="ts">
defineProps<{
    orders: any[]
    isLoading: boolean
    formatPrice: (n: number) => string
    formatDate: (s: string) => string
    getStatus: (s: string) => { label: string; classes: string; dot: string }
}>()
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
        <div v-else-if="orders.length > 0" class="bg-white border border-border-light rounded-xl overflow-hidden shadow-sm">
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
                                <button class="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-primary hover:text-primary-dark transition-colors font-display">
                                    Chi tiết
                                    <span class="material-symbols-outlined text-[14px]">arrow_forward</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
            <div class="px-6 py-3 border-t border-border-light bg-white">
                <span class="text-[10px] text-text-muted font-display">{{ orders.length }} đơn hàng</span>
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
