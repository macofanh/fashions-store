<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { promotionService, type Voucher } from '@/api/promotionService'

const availableVouchers = ref<Voucher[]>([])
const isLoading = ref(true)

const fetchVouchers = async () => {
    isLoading.value = true
    try {
        const response = await promotionService.getVouchers()
        availableVouchers.value = response.data.filter(v => v.is_active)
    } catch (error) {
        console.error('Lỗi lấy danh sách voucher:', error)
    } finally {
        isLoading.value = false
    }
}

const claimVoucher = async (id: number) => {
    try {
        await promotionService.claimVoucher(id)
        alert('Lưu voucher thành công! Bạn có thể sử dụng nó khi thanh toán.')
    } catch (error: any) {
        alert(error.response?.data?.detail || 'Có lỗi xảy ra khi lưu voucher.')
    }
}

onMounted(fetchVouchers)

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>

<template>
    <div class="bg-white min-h-screen pb-24">
        <div class="max-w-[1400px] mx-auto px-6 pt-16">
            <header class="mb-16 text-center">
                <h1 class="text-4xl serif-text text-zinc-900 mb-2 italic">Voucher Center</h1>
                <p class="text-[10px] uppercase tracking-[0.4em] text-zinc-400">Khám phá các ưu đãi đặc biệt dành riêng cho bạn</p>
            </header>

            <div v-if="isLoading" class="flex justify-center py-20">
                <div class="animate-spin h-8 w-8 border-2 border-zinc-900 border-t-transparent rounded-full"></div>
            </div>

            <div v-else-if="availableVouchers.length === 0" class="text-center py-20 text-zinc-400 italic">
                Hiện tại không có chương trình khuyến mãi nào.
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                <div 
                    v-for="v in availableVouchers" 
                    :key="v.voucher_id"
                    class="border border-zinc-100 p-8 flex flex-col justify-between hover:border-zinc-300 transition-all group relative overflow-hidden"
                >
                    <!-- Background Decoration -->
                    <div class="absolute -right-4 -top-4 w-24 h-24 bg-zinc-50 rounded-full group-hover:bg-zinc-100 transition-colors -z-10"></div>
                    
                    <div>
                        <div class="flex justify-between items-start mb-6">
                            <span class="text-[10px] font-bold tracking-[0.2em] bg-zinc-900 text-white px-3 py-1 uppercase">{{ v.code }}</span>
                            <span class="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Azure Exclusive</span>
                        </div>
                        
                        <h3 class="text-xl serif-text italic text-zinc-900 mb-2">{{ v.name }}</h3>
                        <p class="text-xs text-zinc-500 font-light leading-relaxed mb-6">
                            {{ v.discount_type === 'PERCENT' ? `Giảm ${v.discount_value}% tổng giá trị đơn hàng.` : `Giảm ngay ${formatPrice(v.discount_value)} cho đơn hàng của bạn.` }}
                            {{ v.max_discount ? `Giảm tối đa ${formatPrice(v.max_discount)}.` : '' }}
                        </p>
                        
                        <div class="space-y-2 mb-8">
                            <div class="flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest">
                                <span class="material-symbols-outlined text-sm">shopping_bag</span>
                                <span>Đơn tối thiểu: {{ formatPrice(v.min_order_value) }}</span>
                            </div>
                            <div class="flex items-center gap-2 text-[10px] text-zinc-400 uppercase tracking-widest">
                                <span class="material-symbols-outlined text-sm">event</span>
                                <span>HSD: {{ new Date(v.end_date).toLocaleDateString('vi-VN') }}</span>
                            </div>
                        </div>
                    </div>

                    <button 
                        @click="claimVoucher(v.voucher_id)"
                        class="w-full border border-zinc-900 py-3 text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-zinc-900 hover:text-white transition-all active:scale-[0.98]"
                    >
                        Lưu Voucher
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.serif-text { font-family: 'Playfair Display', serif; }
</style>
