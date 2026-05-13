<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useUIStore } from '@/stores/useUIStore'

const uiStore = useUIStore()

interface VariantStock {
    variant_id: number; product_name: string; sku: string
    color_name: string; size_name: string; stock_qty: number
    base_price: number; image_url: string; low_stock_threshold: number
}
interface InventoryLog {
    log_id: number; variant_id: number; change_type: 'IN' | 'OUT' | 'RETURN' | 'ADJUST'
    quantity: number; stock_before: number; stock_after: number; note?: string; created_at: string
}

const activeTab = ref<'stock' | 'logs'>('stock')
const stockList = ref<VariantStock[]>([])
const logs = ref<InventoryLog[]>([])
const isLoading = ref(true)
const isDrawerOpen = ref(false)
const isSubmitting = ref(false)
const searchQuery = ref('')
const filterStock = ref<'all' | 'low' | 'out'>('all')

const form = ref({ variant_id: '', change_type: 'IN', quantity: 1, note: '' })

const filteredStock = computed(() => {
    let list = stockList.value
    if (filterStock.value === 'low') list = list.filter(v => v.stock_qty > 0 && v.stock_qty <= (v.low_stock_threshold || 5))
    if (filterStock.value === 'out') list = list.filter(v => v.stock_qty <= 0)
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.toLowerCase()
        list = list.filter(v => v.product_name.toLowerCase().includes(q) || v.sku.toLowerCase().includes(q))
    }
    return list
})

const stockStats = computed(() => ({
    total: stockList.value.length,
    low:   stockList.value.filter(v => v.stock_qty > 0 && v.stock_qty <= (v.low_stock_threshold || 5)).length,
    out:   stockList.value.filter(v => v.stock_qty <= 0).length,
}))

const fetchStock = async () => {
    isLoading.value = true
    try {
        const res = await axiosClient.get('/api/v1/products/variants')
        stockList.value = res.data.map((v: any) => ({
            variant_id: v.variant_id,
            product_name: v.product?.name || 'N/A',
            sku: v.sku,
            color_name: v.color?.name || 'N/A',
            size_name: v.size?.name || 'N/A',
            stock_qty: v.stock_qty,
            base_price: v.price,
            low_stock_threshold: v.low_stock_threshold || 5,
            image_url: v.image_url || v.product?.images?.[0]?.image_url,
        }))
    } catch (e) { console.error(e) }
    finally { isLoading.value = false }
}

const fetchLogs = async () => {
    isLoading.value = true
    try {
        const res = await axiosClient.get('/api/v1/inventory/inventory-logs', { params: { page_size: 50 } })
        logs.value = res.data.items
    } catch (e) { console.error(e) }
    finally { isLoading.value = false }
}

const handleTabChange = (tab: 'stock' | 'logs') => {
    activeTab.value = tab
    tab === 'stock' ? fetchStock() : fetchLogs()
}

const openAdjustDrawer = (variant?: VariantStock) => {
    form.value = { variant_id: variant ? variant.variant_id.toString() : '', change_type: 'IN', quantity: 1, note: '' }
    isDrawerOpen.value = true
}

const handleAdjustStock = async () => {
    if (!form.value.variant_id) return uiStore.warning('Vui lòng chọn biến thể')
    isSubmitting.value = true
    try {
        await axiosClient.post('/api/v1/inventory/inventory-logs', {
            variant_id: Number(form.value.variant_id),
            change_type: form.value.change_type,
            quantity: form.value.change_type === 'OUT' ? -Math.abs(form.value.quantity) : Math.abs(form.value.quantity),
            note: form.value.note
        })
        isDrawerOpen.value = false
        uiStore.success('Cập nhật kho thành công!')
        activeTab.value === 'stock' ? fetchStock() : fetchLogs()
    } catch (e: any) {
        uiStore.error(e.response?.data?.detail || 'Lỗi khi cập nhật kho')
    } finally { isSubmitting.value = false }
}

const formatDateTime = (d: string) => new Date(d).toLocaleString('vi-VN')

const changeTypeConfig: Record<string, { label: string; bg: string; text: string }> = {
    IN:     { label: 'Nhập kho',  bg: 'bg-emerald-50', text: 'text-emerald-700' },
    OUT:    { label: 'Xuất kho',  bg: 'bg-red-50',     text: 'text-red-700'     },
    RETURN: { label: 'Hoàn trả',  bg: 'bg-blue-50',    text: 'text-blue-700'    },
    ADJUST: { label: 'Điều chỉnh',bg: 'bg-amber-50',   text: 'text-amber-700'   },
}

onMounted(fetchStock)
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Quản lý Kho hàng</h1>
                <p class="text-sm text-slate-500 mt-1">Kiểm soát tồn kho chi tiết từng biến thể</p>
            </div>
            <button
                @click="openAdjustDrawer()"
                class="flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all shadow-sm"
            >
                <span class="material-symbols-outlined text-[18px]">add_circle</span>
                Điều chỉnh kho
            </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-4">
            <div class="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex items-center gap-4">
                <div class="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center">
                    <span class="material-symbols-outlined text-slate-600 text-[20px]">inventory_2</span>
                </div>
                <div>
                    <p class="text-2xl font-bold text-slate-900">{{ stockStats.total }}</p>
                    <p class="text-xs text-slate-500">Tổng biến thể</p>
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-amber-200 p-5 shadow-sm flex items-center gap-4 cursor-pointer hover:border-amber-400 transition-colors" @click="filterStock = 'low'; activeTab = 'stock'">
                <div class="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
                    <span class="material-symbols-outlined text-amber-600 text-[20px]">warning</span>
                </div>
                <div>
                    <p class="text-2xl font-bold text-amber-600">{{ stockStats.low }}</p>
                    <p class="text-xs text-slate-500">Sắp hết hàng</p>
                </div>
            </div>
            <div class="bg-white rounded-2xl border border-red-200 p-5 shadow-sm flex items-center gap-4 cursor-pointer hover:border-red-400 transition-colors" @click="filterStock = 'out'; activeTab = 'stock'">
                <div class="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center">
                    <span class="material-symbols-outlined text-red-500 text-[20px]">remove_shopping_cart</span>
                </div>
                <div>
                    <p class="text-2xl font-bold text-red-500">{{ stockStats.out }}</p>
                    <p class="text-xs text-slate-500">Hết hàng</p>
                </div>
            </div>
        </div>

        <!-- Tabs -->
        <div class="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
            <button
                v-for="tab in [{ v: 'stock', l: 'Tồn kho', icon: 'inventory' }, { v: 'logs', l: 'Lịch sử', icon: 'history' }]"
                :key="tab.v"
                @click="handleTabChange(tab.v as any)"
                :class="['flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all',
                    activeTab === tab.v ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700']"
            >
                <span class="material-symbols-outlined text-[16px]">{{ tab.icon }}</span>
                {{ tab.l }}
            </button>
        </div>

        <!-- Stock tab -->
        <template v-if="activeTab === 'stock'">
            <!-- Filter bar -->
            <div class="flex flex-wrap gap-3 items-center">
                <div class="relative flex-grow min-w-[200px] max-w-sm">
                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px] pointer-events-none">search</span>
                    <input v-model="searchQuery" type="text" placeholder="Tìm sản phẩm, SKU..."
                        class="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 bg-white transition-all" />
                </div>
                <div class="flex gap-2">
                    <button v-for="f in [{ v: 'all', l: 'Tất cả' }, { v: 'low', l: 'Sắp hết' }, { v: 'out', l: 'Hết hàng' }]" :key="f.v"
                        @click="filterStock = f.v as any"
                        :class="['px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all',
                            filterStock === f.v ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50']"
                    >{{ f.l }}</button>
                </div>
            </div>

            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-slate-100 bg-slate-50/60">
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Sản phẩm</th>
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 hidden sm:table-cell">Phân loại</th>
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-center">Tồn kho</th>
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-center hidden md:table-cell">Trạng thái</th>
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-right">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="isLoading">
                                <td colspan="5" class="py-20 text-center">
                                    <div class="animate-spin h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto"></div>
                                </td>
                            </tr>
                            <tr v-for="item in filteredStock" :key="item.variant_id" class="hover:bg-slate-50/60 transition-colors">
                                <td class="px-6 py-4">
                                    <div class="flex items-center gap-3">
                                        <div class="w-10 h-12 bg-slate-100 rounded-lg overflow-hidden shrink-0">
                                            <img v-if="item.image_url" :src="item.image_url" class="w-full h-full object-cover" />
                                            <div v-else class="w-full h-full flex items-center justify-center">
                                                <span class="material-symbols-outlined text-slate-300 text-lg">image</span>
                                            </div>
                                        </div>
                                        <div>
                                            <p class="text-sm font-semibold text-slate-800 line-clamp-1">{{ item.product_name }}</p>
                                            <p class="text-xs text-slate-400 mt-0.5">SKU: {{ item.sku }}</p>
                                        </div>
                                    </div>
                                </td>
                                <td class="px-6 py-4 hidden sm:table-cell">
                                    <div class="flex gap-1.5 flex-wrap">
                                        <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">{{ item.color_name }}</span>
                                        <span class="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-semibold rounded-full">{{ item.size_name }}</span>
                                    </div>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span :class="['text-lg font-bold', item.stock_qty <= 0 ? 'text-red-500' : item.stock_qty <= item.low_stock_threshold ? 'text-amber-500' : 'text-slate-800']">
                                        {{ item.stock_qty }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-center hidden md:table-cell">
                                    <span v-if="item.stock_qty <= 0" class="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 text-red-600 text-[10px] font-semibold rounded-full">
                                        <span class="w-1.5 h-1.5 bg-red-500 rounded-full"></span> Hết hàng
                                    </span>
                                    <span v-else-if="item.stock_qty <= item.low_stock_threshold" class="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-600 text-[10px] font-semibold rounded-full">
                                        <span class="w-1.5 h-1.5 bg-amber-500 rounded-full"></span> Sắp hết
                                    </span>
                                    <span v-else class="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-semibold rounded-full">
                                        <span class="w-1.5 h-1.5 bg-emerald-500 rounded-full"></span> Ổn định
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right">
                                    <button @click="openAdjustDrawer(item)" class="text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100 flex items-center gap-1 ml-auto">
                                        <span class="material-symbols-outlined text-[14px]">edit</span>
                                        Điều chỉnh
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>

        <!-- Logs tab -->
        <template v-if="activeTab === 'logs'">
            <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div class="overflow-x-auto">
                    <table class="w-full text-left">
                        <thead>
                            <tr class="border-b border-slate-100 bg-slate-50/60">
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Thời gian</th>
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500">Loại</th>
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-center">Biến số</th>
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 text-right">Tồn cuối</th>
                                <th class="px-6 py-4 text-[11px] uppercase tracking-wider font-semibold text-slate-500 hidden md:table-cell">Ghi chú</th>
                            </tr>
                        </thead>
                        <tbody class="divide-y divide-slate-100">
                            <tr v-if="isLoading">
                                <td colspan="5" class="py-20 text-center">
                                    <div class="animate-spin h-8 w-8 border-2 border-slate-900 border-t-transparent rounded-full mx-auto"></div>
                                </td>
                            </tr>
                            <tr v-for="log in logs" :key="log.log_id" class="hover:bg-slate-50/60 transition-colors">
                                <td class="px-6 py-4 text-sm text-slate-500">{{ formatDateTime(log.created_at) }}</td>
                                <td class="px-6 py-4">
                                    <span :class="['inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-semibold', changeTypeConfig[log.change_type]?.bg, changeTypeConfig[log.change_type]?.text]">
                                        {{ changeTypeConfig[log.change_type]?.label || log.change_type }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-center">
                                    <span :class="['text-sm font-bold', log.quantity > 0 ? 'text-emerald-600' : 'text-red-500']">
                                        {{ log.quantity > 0 ? '+' : '' }}{{ log.quantity }}
                                    </span>
                                </td>
                                <td class="px-6 py-4 text-right font-bold text-slate-800">{{ log.stock_after }}</td>
                                <td class="px-6 py-4 text-sm text-slate-400 hidden md:table-cell">{{ log.note || '—' }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </template>

        <!-- Adjust Drawer -->
        <Teleport to="body">
            <Transition name="drawer">
                <div v-if="isDrawerOpen" class="fixed inset-0 z-50 flex justify-end">
                    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="isDrawerOpen = false"></div>
                    <div class="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full rounded-l-2xl overflow-hidden">
                        <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <div>
                                <h2 class="text-base font-bold text-slate-900">Điều chỉnh kho</h2>
                                <p class="text-xs text-slate-500 mt-0.5">Nhập/xuất kho thủ công</p>
                            </div>
                            <button @click="isDrawerOpen = false" class="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full transition-colors">
                                <span class="material-symbols-outlined text-[20px] text-slate-500">close</span>
                            </button>
                        </div>
                        <div class="flex-grow p-6 space-y-6 overflow-y-auto">
                            <div class="space-y-2">
                                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Biến thể ID</label>
                                <input v-model="form.variant_id" type="number" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" placeholder="Nhập ID biến thể..." />
                            </div>
                            <div class="space-y-2">
                                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Loại giao dịch</label>
                                <div class="grid grid-cols-3 gap-2">
                                    <button v-for="t in [{ v: 'IN', l: 'Nhập kho', icon: 'add_circle' }, { v: 'OUT', l: 'Xuất kho', icon: 'remove_circle' }, { v: 'ADJUST', l: 'Điều chỉnh', icon: 'tune' }]" :key="t.v"
                                        @click="form.change_type = t.v"
                                        :class="['flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-[10px] font-semibold transition-all',
                                            form.change_type === t.v ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 text-slate-500 hover:border-slate-400']"
                                    >
                                        <span class="material-symbols-outlined text-[20px]">{{ t.icon }}</span>
                                        {{ t.l }}
                                    </button>
                                </div>
                            </div>
                            <div class="space-y-2">
                                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Số lượng</label>
                                <input v-model.number="form.quantity" type="number" min="1" class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all" />
                            </div>
                            <div class="space-y-2">
                                <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ghi chú</label>
                                <textarea v-model="form.note" rows="3" placeholder="Lý do điều chỉnh..." class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all resize-none"></textarea>
                            </div>
                        </div>
                        <div class="p-6 border-t border-slate-100 bg-slate-50">
                            <button @click="handleAdjustStock" :disabled="isSubmitting"
                                class="w-full bg-slate-900 text-white py-3 rounded-xl text-sm font-semibold hover:bg-slate-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                            >
                                <span v-if="isSubmitting" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                {{ isSubmitting ? 'Đang xử lý...' : 'Xác nhận cập nhật' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.3s ease; }
.drawer-enter-active .relative, .drawer-leave-active .relative { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from { opacity: 0; }
.drawer-leave-to   { opacity: 0; }
.drawer-enter-from .relative { transform: translateX(100%); }
.drawer-leave-to   .relative { transform: translateX(100%); }
</style>
