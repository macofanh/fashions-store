<script setup lang="ts">
import { useVoucherManagement } from './useVoucherManagement'

const {
    uiStore,
    vouchers,
    isLoading,
    isModalOpen,
    isEditing,
    currentVoucher,
    fetchVouchers,
    openCreateModal,
    openEditModal,
    handleSubmit,
    deleteVoucher,
    formatPrice
} = useVoucherManagement()
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Quản lý Voucher</h1>
                <p class="text-sm text-slate-400 mt-1">Tạo và quản lý các chương trình ưu đãi</p>
            </div>
            <button
                @click="openCreateModal"
                class="bg-indigo-600 text-white px-5 py-2.5 text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors flex items-center gap-2 shrink-0"
            >
                <span class="material-symbols-outlined text-[18px]">add</span>
                Thêm Voucher mới
            </button>
        </div>

        <!-- Table -->
        <div class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400">Code / Tên</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 hidden md:table-cell">Loại giảm</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 text-right hidden sm:table-cell">Giá trị</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 text-center hidden lg:table-cell">Đã dùng</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 hidden lg:table-cell">Thời hạn</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 hidden lg:table-cell">Hạng yêu cầu</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 text-center">Trạng thái</th>
                        <th class="px-5 py-4 text-xs font-semibold text-slate-400 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <tr v-if="isLoading">
                        <td colspan="8" class="px-5 py-20 text-center">
                            <div class="animate-spin h-7 w-7 border-4 border-indigo-500 border-t-transparent rounded-full mx-auto"></div>
                        </td>
                    </tr>
                    <tr v-else-if="vouchers.length === 0">
                        <td colspan="8" class="px-5 py-20 text-center">
                            <span class="material-symbols-outlined text-5xl text-slate-200 block mb-3">confirmation_number</span>
                            <p class="text-slate-400 text-sm">Chưa có voucher nào</p>
                        </td>
                    </tr>
                    <tr v-for="v in vouchers" :key="v.voucher_id" class="hover:bg-slate-50/60 transition-colors group">
                        <td class="px-5 py-4">
                            <div class="flex items-center gap-3">
                                <div :class="['w-9 h-9 rounded-xl flex items-center justify-center shrink-0', v.discount_type === 'PERCENT' ? 'bg-indigo-50' : v.discount_type === 'FREE_SHIP' ? 'bg-emerald-50' : 'bg-amber-50']">
                                    <span :class="['material-symbols-outlined text-[18px]', v.discount_type === 'PERCENT' ? 'text-indigo-600' : v.discount_type === 'FREE_SHIP' ? 'text-emerald-600' : 'text-amber-600']">
                                        {{ v.discount_type === 'FREE_SHIP' ? 'local_shipping' : 'confirmation_number' }}
                                    </span>
                                </div>
                                <div>
                                    <p class="text-sm font-bold text-slate-900 font-mono tracking-wider">{{ v.code }}</p>
                                    <p class="text-xs text-slate-400 mt-0.5">{{ v.name }}</p>
                                </div>
                            </div>
                        </td>
                        <td class="px-5 py-4 hidden md:table-cell">
                            <span :class="['text-[10px] font-semibold px-2.5 py-1 rounded-full', v.discount_type === 'PERCENT' ? 'bg-indigo-50 text-indigo-700' : v.discount_type === 'FREE_SHIP' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700']">
                                {{ v.discount_type === 'PERCENT' ? 'Phần trăm' : v.discount_type === 'FREE_SHIP' ? 'Miễn ship' : 'Số tiền' }}
                            </span>
                        </td>
                        <td class="px-5 py-4 text-right hidden sm:table-cell">
                            <span class="text-sm font-bold text-slate-900">
                                {{ v.discount_type === 'PERCENT' ? v.discount_value + '%' : v.discount_type === 'FREE_SHIP' ? '—' : formatPrice(v.discount_value) }}
                            </span>
                        </td>
                        <td class="px-5 py-4 text-center hidden lg:table-cell">
                            <div class="flex flex-col items-center gap-1">
                                <span class="text-sm font-semibold text-slate-700">{{ v.used_count }} / {{ v.usage_limit || '∞' }}</span>
                                <div v-if="v.usage_limit" class="w-16 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div
                                        :style="{ width: Math.min((v.used_count / v.usage_limit) * 100, 100) + '%' }"
                                        :class="['h-full rounded-full transition-all', (v.used_count / v.usage_limit) > 0.8 ? 'bg-red-400' : 'bg-indigo-400']"
                                    ></div>
                                </div>
                            </div>
                        </td>
                        <td class="px-5 py-4 hidden lg:table-cell">
                            <p class="text-xs text-slate-500">{{ new Date(v.start_date).toLocaleDateString('vi-VN') }}</p>
                            <p class="text-xs text-slate-400">→ {{ new Date(v.end_date).toLocaleDateString('vi-VN') }}</p>
                        </td>
                        <!-- Hạng yêu cầu -->
                        <td class="px-5 py-4 hidden lg:table-cell">
                            <span v-if="v.required_tier" :class="[
                                'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                                v.required_tier === 'diamond'  ? 'bg-cyan-50 text-cyan-600'   :
                                v.required_tier === 'platinum' ? 'bg-slate-100 text-slate-600' :
                                v.required_tier === 'gold'     ? 'bg-amber-50 text-amber-600'  :
                                v.required_tier === 'silver'   ? 'bg-zinc-100 text-zinc-500'   :
                                                                  'bg-orange-50 text-orange-700'
                            ]">
                                {{ v.required_tier === 'diamond' ? '💠 Kim Cương' :
                                   v.required_tier === 'platinum' ? '💎 Bạch Kim' :
                                   v.required_tier === 'gold'     ? '⭐ Vàng' :
                                   v.required_tier === 'silver'   ? '🏅 Bạc' : '🛡️ Đồng' }}
                            </span>
                            <span v-else class="text-[10px] text-slate-300">Tất cả</span>
                        </td>
                        <td class="px-5 py-4 text-center">
                            <span :class="['inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full', v.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500']">                                <span :class="['w-1.5 h-1.5 rounded-full', v.is_active ? 'bg-emerald-500' : 'bg-red-400']"></span>
                                {{ v.is_active ? 'Hoạt động' : 'Tắt' }}
                            </span>
                        </td>
                        <td class="px-5 py-4 text-right">
                            <div class="flex justify-end gap-1">
                                <button @click="openEditModal(v)" class="p-2 hover:bg-indigo-50 rounded-xl transition-colors text-slate-400 hover:text-indigo-600" title="Sửa">
                                    <span class="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button @click="deleteVoucher(v.voucher_id)" class="p-2 hover:bg-red-50 rounded-xl transition-colors text-slate-400 hover:text-red-500" title="Xóa">
                                    <span class="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="!isLoading && vouchers.length > 0" class="px-5 py-3 border-t border-slate-50 text-xs text-slate-400">
                {{ vouchers.length }} voucher
            </div>
        </div>

        <!-- Modal tạo/sửa -->
        <Teleport to="body">
            <Transition name="modal">
                <div v-if="isModalOpen" class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
                    <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
                        <div class="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
                            <div>
                                <h2 class="text-base font-bold text-slate-900">{{ isEditing ? 'Cập nhật Voucher' : 'Tạo Voucher mới' }}</h2>
                                <p class="text-xs text-slate-400 mt-0.5">{{ isEditing ? 'Chỉnh sửa thông tin voucher' : 'Điền thông tin để tạo voucher mới' }}</p>
                            </div>
                            <button @click="isModalOpen = false" class="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full transition-colors">
                                <span class="material-symbols-outlined text-[20px] text-slate-500">close</span>
                            </button>
                        </div>

                        <form @submit.prevent="handleSubmit" class="overflow-y-auto p-6 space-y-5">
                            <div class="grid grid-cols-2 gap-4">
                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Mã Voucher <span class="text-red-400">*</span></label>
                                    <input v-model="currentVoucher.code" type="text" required
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm font-mono uppercase outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="VD: SUMMER2024" />
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Tên chương trình <span class="text-red-400">*</span></label>
                                    <input v-model="currentVoucher.name" type="text" required
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="VD: Ưu đãi mùa hè" />
                                </div>
                                <div class="col-span-2">
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Tiêu đề phụ</label>
                                    <input v-model="currentVoucher.subtitle" type="text"
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="VD: Ưu đãi đặc biệt dành cho thành viên" />
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Loại giảm giá</label>
                                    <select v-model="currentVoucher.discount_type"
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white">
                                        <option value="PERCENT">Phần trăm (%)</option>
                                        <option value="FIXED_AMOUNT">Số tiền cố định (VND)</option>
                                        <option value="FREE_SHIP">Miễn phí vận chuyển</option>
                                    </select>
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Giá trị giảm</label>
                                    <input v-model="currentVoucher.discount_value" type="number" required
                                        :disabled="currentVoucher.discount_type === 'FREE_SHIP'"
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed" />
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Đơn tối thiểu (₫)</label>
                                    <input v-model="currentVoucher.min_order_value" type="number"
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Giảm tối đa (₫, nếu là %)</label>
                                    <input v-model="currentVoucher.max_discount" type="number"
                                        :disabled="currentVoucher.discount_type !== 'PERCENT'"
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-40 disabled:cursor-not-allowed" />
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Ngày bắt đầu <span class="text-red-400">*</span></label>
                                    <input v-model="currentVoucher.start_date" type="date" required
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                                </div>
                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Ngày kết thúc <span class="text-red-400">*</span></label>
                                    <input v-model="currentVoucher.end_date" type="date" required
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all" />
                                </div>
                                <div class="col-span-2">
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Yêu cầu hạng thành viên</label>
                                    <select v-model="currentVoucher.required_tier"
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white">
                                        <option :value="null">Tất cả hạng (không giới hạn)</option>
                                        <option value="bronze">🛡️ Đồng trở lên (≥ 0 điểm)</option>
                                        <option value="silver">🏅 Bạc trở lên (≥ 500 điểm)</option>
                                        <option value="gold">⭐ Vàng trở lên (≥ 2.000 điểm)</option>
                                        <option value="platinum">💎 Bạch Kim trở lên (≥ 5.000 điểm)</option>
                                        <option value="diamond">💠 Kim Cương (≥ 10.000 điểm)</option>
                                    </select>
                                    <p class="text-[10px] text-slate-400 mt-1">Chỉ thành viên đạt hạng này mới có thể lưu và sử dụng voucher.</p>
                                </div>
                            </div>

                            <!-- Banner -->
                            <div class="pt-4 border-t border-slate-100">
                                <p class="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4">Tùy chỉnh Banner</p>
                                <div class="grid grid-cols-2 gap-4">
                                    <div>
                                        <label class="text-xs font-semibold text-slate-500 block mb-1.5">Màu nền</label>
                                        <div class="flex gap-2 items-center">
                                            <input v-model="currentVoucher.bg_color" type="color"
                                                class="w-10 h-10 border border-slate-200 rounded-xl cursor-pointer p-1" />
                                            <input v-model="currentVoucher.bg_color" type="text"
                                                class="flex-grow border border-slate-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-indigo-400 transition-all"
                                                placeholder="#17b0cf" />
                                        </div>
                                    </div>
                                    <div>
                                        <label class="text-xs font-semibold text-slate-500 block mb-1.5">Thứ tự ưu tiên</label>
                                        <input v-model="currentVoucher.sort_order" type="number" min="0"
                                            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                            placeholder="0" />
                                    </div>
                                    <div class="col-span-2">
                                        <label class="text-xs font-semibold text-slate-500 block mb-1.5">URL ảnh banner</label>
                                        <input v-model="currentVoucher.banner_image" type="text"
                                            class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                            placeholder="https://..." />
                                        <div v-if="currentVoucher.banner_image" class="mt-2 h-20 rounded-xl overflow-hidden border border-slate-100">
                                            <img :src="currentVoucher.banner_image" class="w-full h-full object-cover" alt="Banner preview" />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <!-- Toggle active -->
                            <button type="button" @click="currentVoucher.is_active = !currentVoucher.is_active"
                                :class="['flex items-center justify-between w-full p-4 rounded-xl border-2 transition-all', currentVoucher.is_active ? 'border-emerald-200 bg-emerald-50' : 'border-slate-200 bg-slate-50']">
                                <div class="flex items-center gap-3">
                                    <div :class="['w-9 h-9 rounded-full flex items-center justify-center', currentVoucher.is_active ? 'bg-emerald-100' : 'bg-slate-100']">
                                        <span :class="['material-symbols-outlined text-[20px]', currentVoucher.is_active ? 'text-emerald-600' : 'text-slate-400']">
                                            {{ currentVoucher.is_active ? 'check_circle' : 'cancel' }}
                                        </span>
                                    </div>
                                    <div class="text-left">
                                        <p :class="['text-sm font-semibold', currentVoucher.is_active ? 'text-emerald-700' : 'text-slate-500']">
                                            {{ currentVoucher.is_active ? 'Voucher đang hoạt động' : 'Voucher đã tắt' }}
                                        </p>
                                        <p class="text-[10px] text-slate-400">Nhấn để {{ currentVoucher.is_active ? 'tắt' : 'bật' }}</p>
                                    </div>
                                </div>
                                <div :class="['w-11 h-6 rounded-full transition-colors relative shrink-0', currentVoucher.is_active ? 'bg-emerald-500' : 'bg-slate-300']">
                                    <div :class="['absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', currentVoucher.is_active ? 'translate-x-5' : 'translate-x-0.5']"></div>
                                </div>
                            </button>

                            <div class="flex gap-3 pt-2">
                                <button type="button" @click="isModalOpen = false"
                                    class="flex-1 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">
                                    Hủy
                                </button>
                                <button type="submit"
                                    class="flex-1 bg-indigo-600 text-white py-2.5 text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors">
                                    {{ isEditing ? 'Cập nhật' : 'Tạo Voucher' }}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.modal-enter-active, .modal-leave-active { transition: opacity 0.2s ease; }
.modal-enter-from, .modal-leave-to { opacity: 0; }
</style>
