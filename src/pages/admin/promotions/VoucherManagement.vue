<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { promotionService, type Voucher } from '@/api/promotionService'

const vouchers = ref<Voucher[]>([])
const isLoading = ref(true)
const isModalOpen = ref(false)
const isEditing = ref(false)

const currentVoucher = ref<Partial<Voucher>>({
    code: '',
    name: '',
    discount_type: 'PERCENT',
    discount_value: 0,
    min_order_value: 0,
    max_discount: 0,
    usage_limit: 100,
    start_date: new Date().toISOString().split('T')[0],
    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    is_active: true
})

const fetchVouchers = async () => {
    isLoading.value = true
    try {
        const response = await promotionService.getVouchers({ include_inactive: true })
        vouchers.value = response.data
    } catch (error) {
        console.error('Lỗi lấy danh sách voucher:', error)
    } finally {
        isLoading.value = false
    }
}

onMounted(fetchVouchers)

const openCreateModal = () => {
    isEditing.value = false
    currentVoucher.value = {
        code: '',
        name: '',
        discount_type: 'PERCENT',
        discount_value: 0,
        min_order_value: 0,
        max_discount: 0,
        usage_limit: 100,
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true
    }
    isModalOpen.value = true
}

const openEditModal = (v: Voucher) => {
    isEditing.value = true
    currentVoucher.value = { ...v, 
        start_date: v.start_date.split('T')[0], 
        end_date: v.end_date.split('T')[0] 
    }
    isModalOpen.value = true
}

const handleSubmit = async () => {
    try {
        if (isEditing.value && currentVoucher.value.voucher_id) {
            await promotionService.updateVoucher(currentVoucher.value.voucher_id, currentVoucher.value)
            alert('Cập nhật voucher thành công!')
        } else {
            await promotionService.createVoucher(currentVoucher.value)
            alert('Tạo voucher thành công!')
        }
        isModalOpen.value = false
        fetchVouchers()
    } catch (error: any) {
        alert(error.response?.data?.detail || 'Có lỗi xảy ra.')
    }
}

const deleteVoucher = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa voucher này?')) return
    try {
        await promotionService.deleteVoucher(id)
        alert('Xóa thành công!')
        fetchVouchers()
    } catch (error) {
        console.error('Lỗi xóa voucher:', error)
    }
}

const formatPrice = (price: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
}
</script>

<template>
    <div class="space-y-10">
        <header class="flex justify-between items-end">
            <div>
                <h1 class="text-3xl serif-text italic text-zinc-900">Quản lý Voucher</h1>
                <p class="text-xs text-zinc-400 uppercase tracking-widest mt-2 font-bold">Tạo và quản lý các chương trình ưu đãi</p>
            </div>
            <button 
                @click="openCreateModal"
                class="bg-zinc-900 text-white px-6 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors"
            >
                Thêm Voucher mới
            </button>
        </header>

        <div class="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Code / Tên</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Loại giảm giá</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-right">Giá trị</th>
                        <th class="px-8 py-5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-center">Đã dùng</th>
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
                    <tr v-else-if="vouchers.length === 0">
                        <td colspan="6" class="px-8 py-20 text-center text-zinc-400 text-xs uppercase tracking-widest">
                            Chưa có voucher nào
                        </td>
                    </tr>
                    <tr v-for="v in vouchers" :key="v.voucher_id" class="hover:bg-zinc-50/50 transition-colors text-xs">
                        <td class="px-8 py-6">
                            <p class="font-bold text-zinc-900">{{ v.code }}</p>
                            <p class="text-[10px] text-zinc-400 mt-1">{{ v.name }}</p>
                        </td>
                        <td class="px-8 py-6">
                            <span class="text-[9px] uppercase tracking-widest font-bold text-zinc-500">{{ v.discount_type }}</span>
                        </td>
                        <td class="px-8 py-6 text-right font-bold">
                            {{ v.discount_type === 'PERCENT' ? v.discount_value + '%' : formatPrice(v.discount_value) }}
                        </td>
                        <td class="px-8 py-6 text-center text-zinc-500">
                            {{ v.used_count }} / {{ v.usage_limit || '∞' }}
                        </td>
                        <td class="px-8 py-6 text-center">
                            <span :class="['px-3 py-1 text-[9px] uppercase tracking-widest font-bold rounded-full', v.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600']">
                                {{ v.is_active ? 'Active' : 'Inactive' }}
                            </span>
                        </td>
                        <td class="px-8 py-6 text-right space-x-4">
                            <button @click="openEditModal(v)" class="text-zinc-400 hover:text-zinc-900 transition-colors">Sửa</button>
                            <button @click="deleteVoucher(v.voucher_id)" class="text-red-300 hover:text-red-600 transition-colors">Xóa</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- Modal -->
        <div v-if="isModalOpen" class="fixed inset-0 z-50 flex items-center justify-center p-6 bg-zinc-900/40 backdrop-blur-sm">
            <div class="bg-white w-full max-w-2xl shadow-2xl">
                <div class="p-8 border-b border-zinc-100 flex justify-between items-center">
                    <h2 class="text-xl serif-text italic">{{ isEditing ? 'Cập nhật Voucher' : 'Tạo Voucher mới' }}</h2>
                    <button @click="isModalOpen = false" class="text-zinc-400 hover:text-zinc-900">
                        <span class="material-symbols-outlined">close</span>
                    </button>
                </div>
                
                <form @submit.prevent="handleSubmit" class="p-8 space-y-6">
                    <div class="grid grid-cols-2 gap-6">
                        <div class="space-y-2">
                            <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Mã Voucher</label>
                            <input v-model="currentVoucher.code" type="text" required class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none text-sm" placeholder="Ví dụ: SUMMER2024" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Tên chương trình</label>
                            <input v-model="currentVoucher.name" type="text" required class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none text-sm" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Loại giảm giá</label>
                            <select v-model="currentVoucher.discount_type" class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none text-sm bg-transparent">
                                <option value="PERCENT">Phần trăm (%)</option>
                                <option value="FIXED_AMOUNT">Số tiền cố định (VND)</option>
                                <option value="FREE_SHIP">Miễn phí vận chuyển</option>
                            </select>
                        </div>
                        <div class="space-y-2">
                            <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Giá trị giảm</label>
                            <input v-model="currentVoucher.discount_value" type="number" required class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none text-sm" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Đơn tối thiểu</label>
                            <input v-model="currentVoucher.min_order_value" type="number" class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none text-sm" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Giảm tối đa (nếu là %)</label>
                            <input v-model="currentVoucher.max_discount" type="number" class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none text-sm" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Ngày bắt đầu</label>
                            <input v-model="currentVoucher.start_date" type="date" required class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none text-sm" />
                        </div>
                        <div class="space-y-2">
                            <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Ngày kết thúc</label>
                            <input v-model="currentVoucher.end_date" type="date" required class="w-full border-b border-zinc-200 py-2 focus:border-zinc-900 outline-none text-sm" />
                        </div>
                    </div>

                    <div class="flex items-center gap-4 pt-4">
                        <label class="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" v-model="currentVoucher.is_active" class="sr-only peer">
                            <div class="w-11 h-6 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-zinc-900"></div>
                            <span class="ml-3 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Kích hoạt Voucher</span>
                        </label>
                    </div>

                    <div class="flex justify-end gap-4 mt-10">
                        <button type="button" @click="isModalOpen = false" class="px-8 py-3 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Hủy</button>
                        <button type="submit" class="bg-zinc-900 text-white px-10 py-3 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-800 transition-colors">Lưu thông tin</button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<style scoped>
.serif-text { font-family: 'Playfair Display', serif; }
</style>
