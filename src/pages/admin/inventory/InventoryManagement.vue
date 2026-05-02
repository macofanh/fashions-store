<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axiosClient from '@/lib/axiosClient'

interface VariantStock {
    variant_id: number
    product_name: string
    sku: string
    color_name: string
    size_name: string
    stock_qty: number
    base_price: number
    image_url: string
}

interface InventoryLog {
    log_id: number
    variant_id: number
    change_type: 'IN' | 'OUT' | 'RETURN' | 'ADJUST'
    quantity: number
    stock_before: number
    stock_after: number
    note?: string
    created_at: string
}

const activeTab = ref<'stock' | 'logs'>('stock')
const stockList = ref<VariantStock[]>([])
const logs = ref<InventoryLog[]>([])
const isLoading = ref(true)
const isDrawerOpen = ref(false)
const isSubmitting = ref(false)

// Form dữ liệu nhập/xuất
const form = ref({
    variant_id: '',
    change_type: 'IN',
    quantity: 1,
    note: ''
})

const fetchStock = async () => {
    isLoading.value = true
    try {
        const res = await axiosClient.get('/api/v1/products/variants')
        const list: VariantStock[] = res.data.map((v: any) => ({
            variant_id: v.variant_id,
            product_name: v.product?.name || 'N/A',
            sku: v.sku,
            color_name: v.color?.name || 'N/A',
            size_name: v.size?.name || 'N/A',
            stock_qty: v.stock_qty,
            base_price: v.price,
            image_url: v.image_url || (v.product?.images && v.product.images[0]?.image_url)
        }))
        stockList.value = list
    } catch (error) {
        console.error('Lỗi lấy tồn kho:', error)
    } finally {
        isLoading.value = false
    }
}

const fetchLogs = async () => {
    isLoading.value = true
    try {
        const res = await axiosClient.get('/api/v1/inventory/inventory-logs', { params: { page_size: 50 } })
        logs.value = res.data.items
    } catch (error) {
        console.error('Lỗi lấy log kho:', error)
    } finally {
        isLoading.value = false
    }
}

const handleTabChange = (tab: 'stock' | 'logs') => {
    activeTab.value = tab
    if (tab === 'stock') fetchStock()
    else fetchLogs()
}

const openAdjustDrawer = (variant?: VariantStock) => {
    form.value = { 
        variant_id: variant ? variant.variant_id.toString() : '', 
        change_type: 'IN', 
        quantity: 1, 
        note: '' 
    }
    isDrawerOpen.value = true
}

const handleAdjustStock = async () => {
    if (!form.value.variant_id) return alert('Vui lòng chọn biến thể')
    
    isSubmitting.value = true
    try {
        await axiosClient.post('/api/v1/inventory/inventory-logs', {
            variant_id: Number(form.value.variant_id),
            change_type: form.value.change_type,
            quantity: form.value.change_type === 'OUT' ? -Math.abs(form.value.quantity) : Math.abs(form.value.quantity),
            note: form.value.note
        })
        alert('Cập nhật kho thành công!')
        isDrawerOpen.value = false
        if (activeTab.value === 'stock') fetchStock()
        else fetchLogs()
    } catch (error: any) {
        alert(error.response?.data?.detail || 'Lỗi khi cập nhật kho')
    } finally {
        isSubmitting.value = false
    }
}

const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('vi-VN')
}

onMounted(() => {
    fetchStock()
})
</script>

<template>
    <div class="space-y-10">
        <header class="flex justify-between items-end">
            <div>
                <h1 class="text-3xl serif-text italic text-zinc-900">Quản lý Kho hàng</h1>
                <p class="text-xs text-zinc-400 uppercase tracking-widest mt-2 font-bold">Kiểm soát tồn kho chi tiết từng biến thể</p>
            </div>
            <button @click="openAdjustDrawer()" class="bg-zinc-900 text-white px-8 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-all flex items-center gap-2 shadow-lg shadow-black/10">
                <span class="material-symbols-outlined text-sm">inventory</span>
                Điều chỉnh kho nhanh
            </button>
        </header>

        <!-- Tabs Navigation -->
        <div class="flex gap-10 border-b border-zinc-100">
            <button 
                @click="handleTabChange('stock')"
                :class="activeTab === 'stock' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400'"
                class="pb-4 border-b-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all"
            >
                Tồn kho hiện tại
            </button>
            <button 
                @click="handleTabChange('logs')"
                :class="activeTab === 'logs' ? 'border-zinc-900 text-zinc-900' : 'border-transparent text-zinc-400'"
                class="pb-4 border-b-2 text-[10px] uppercase tracking-[0.2em] font-black transition-all"
            >
                Lịch sử biến động
            </button>
        </div>

        <!-- CONTENT: CURRENT STOCK -->
        <div v-if="activeTab === 'stock'" class="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Biến thể / SKU</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Phân loại</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-center">Tồn kho</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-center">Trạng thái</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-50">
                    <tr v-if="isLoading">
                        <td colspan="5" class="px-8 py-20 text-center">
                             <div class="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full mx-auto"></div>
                        </td>
                    </tr>
                    <tr v-for="item in stockList" :key="item.variant_id" class="hover:bg-zinc-50/50 transition-colors group">
                        <td class="px-8 py-6">
                            <div class="flex items-center gap-4">
                                <div class="w-10 h-12 bg-zinc-100 flex-shrink-0 overflow-hidden border border-zinc-200">
                                    <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover" />
                                </div>
                                <div>
                                    <p class="text-xs font-bold text-zinc-900">{{ item.product_name }}</p>
                                    <p class="text-[9px] text-zinc-400 mt-1 uppercase tracking-tighter">SKU: {{ item.sku }} | ID: #{{ item.variant_id }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-8 py-6">
                            <div class="flex gap-2">
                                <span class="px-2 py-1 bg-zinc-100 text-zinc-600 text-[8px] font-black uppercase tracking-widest">{{ item.color_name }}</span>
                                <span class="px-2 py-1 bg-zinc-100 text-zinc-600 text-[8px] font-black uppercase tracking-widest">Size {{ item.size_name }}</span>
                            </div>
                        </td>
                        <td class="px-8 py-6 text-center font-bold text-sm" :class="item.stock_qty <= 5 ? 'text-red-600' : 'text-zinc-900'">
                            {{ item.stock_qty }}
                        </td>
                        <td class="px-8 py-6 text-center">
                            <span v-if="item.stock_qty <= 0" class="text-[8px] font-black uppercase tracking-widest text-red-500 bg-red-50 px-2 py-1">Hết hàng</span>
                            <span v-else-if="item.stock_qty <= 5" class="text-[8px] font-black uppercase tracking-widest text-amber-500 bg-amber-50 px-2 py-1">Sắp hết</span>
                            <span v-else class="text-[8px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-50 px-2 py-1">Ổn định</span>
                        </td>
                        <td class="px-8 py-6 text-right">
                            <button @click="openAdjustDrawer(item)" class="text-[10px] font-black uppercase tracking-widest text-zinc-400 hover:text-zinc-900 transition-colors flex items-center gap-1 justify-end ml-auto">
                                <span class="material-symbols-outlined text-sm">edit_square</span>
                                Điều chỉnh
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- CONTENT: LOGS -->
        <div v-if="activeTab === 'logs'" class="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse text-xs">
                <thead class="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Thời gian</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Loại</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-center">Biến số</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-right">Tồn cuối</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Ghi chú</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-50">
                    <tr v-for="log in logs" :key="log.log_id" class="hover:bg-zinc-50/50">
                        <td class="px-8 py-6 text-zinc-400 italic">{{ formatDateTime(log.created_at) }}</td>
                        <td class="px-8 py-6">
                            <span :class="[
                                'px-2 py-1 text-[8px] font-black uppercase tracking-widest',
                                log.change_type === 'IN' ? 'bg-emerald-50 text-emerald-600' : 
                                log.change_type === 'OUT' ? 'bg-red-50 text-red-600' : 'bg-zinc-100 text-zinc-600'
                            ]">
                                {{ log.change_type }}
                            </span>
                        </td>
                        <td class="px-8 py-6 text-center font-bold" :class="log.quantity > 0 ? 'text-emerald-600' : 'text-red-600'">
                            {{ log.quantity > 0 ? '+' : '' }}{{ log.quantity }}
                        </td>
                        <td class="px-8 py-6 text-right font-black">{{ log.stock_after }}</td>
                        <td class="px-8 py-6 text-zinc-500">{{ log.note || '-' }}</td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- ADJUST DRAWER -->
        <div v-if="isDrawerOpen" class="fixed inset-0 z-[60] overflow-hidden">
            <div class="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity" @click="isDrawerOpen = false"></div>
            <div class="absolute inset-y-0 right-0 w-full max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-500">
                <div class="px-8 py-6 border-b border-zinc-100 flex justify-between items-center bg-zinc-50">
                    <div>
                        <h2 class="text-lg serif-text italic text-zinc-900">Điều chỉnh kho</h2>
                        <p class="text-[9px] uppercase tracking-widest text-zinc-400 font-bold">Thực hiện nhập/xuất kho thủ công</p>
                    </div>
                    <button @click="isDrawerOpen = false" class="w-10 h-10 flex items-center justify-center hover:bg-zinc-200 rounded-full transition-colors">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div class="flex-grow p-8 space-y-8 overflow-y-auto">
                    <div class="space-y-3">
                        <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Biến thể ID</label>
                        <input v-model="form.variant_id" type="number" class="w-full border-b border-zinc-200 py-3 focus:border-zinc-900 outline-none transition-colors text-sm" placeholder="Nhập ID biến thể..." />
                        <p class="text-[9px] text-zinc-400 italic">Mẹo: Bạn nên chọn 'Điều chỉnh' trực tiếp từ danh sách tồn kho.</p>
                    </div>

                    <div class="space-y-3">
                        <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Loại giao dịch</label>
                        <div class="grid grid-cols-3 gap-2">
                            <button 
                                v-for="t in ['IN', 'OUT', 'ADJUST']" :key="t"
                                @click="form.change_type = t as any"
                                :class="form.change_type === t ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-400 border-zinc-100'"
                                class="py-2 border text-[9px] font-bold uppercase tracking-widest transition-all"
                            >
                                {{ t === 'IN' ? 'Nhập' : t === 'OUT' ? 'Xuất' : 'Khác' }}
                            </button>
                        </div>
                    </div>

                    <div class="space-y-3">
                        <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Số lượng</label>
                        <input v-model.number="form.quantity" type="number" min="1" class="w-full border-b border-zinc-200 py-3 focus:border-zinc-900 outline-none transition-colors text-sm" />
                    </div>

                    <div class="space-y-3">
                        <label class="text-[10px] uppercase font-bold text-zinc-400 tracking-widest">Ghi chú</label>
                        <textarea v-model="form.note" rows="3" placeholder="Lý do điều chỉnh..." class="w-full border border-zinc-100 p-3 focus:border-zinc-900 outline-none transition-colors text-sm resize-none"></textarea>
                    </div>
                </div>

                <div class="p-8 border-t border-zinc-100 bg-zinc-50">
                    <button 
                        @click="handleAdjustStock"
                        :disabled="isSubmitting"
                        class="w-full bg-zinc-900 text-white py-4 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
                    >
                        {{ isSubmitting ? 'Đang xử lý...' : 'Xác nhận cập nhật' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
.serif-text { font-family: 'Playfair Display', serif; }
.fixed > div:last-child {
    animation: slideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
}
@keyframes slideIn {
    from { transform: translateX(100%); }
    to { transform: translateX(0); }
}
</style>
