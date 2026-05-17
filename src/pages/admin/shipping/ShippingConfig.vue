<script setup lang="ts">
import { useShippingConfig } from './useShippingConfig'

const {
    store,
    uiStore,
    form,
    isSaving,
    handleSave,
    handleReset,
    formatCurrency
} = useShippingConfig()
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex items-center justify-between">
            <div>
                <h2 class="text-lg font-bold text-slate-800">Thông tin giao hàng</h2>
                <p class="text-sm text-slate-400 mt-0.5">Cấu hình địa chỉ cửa hàng và phí vận chuyển</p>
            </div>
            <div class="flex gap-3">
                <button
                    @click="handleReset"
                    class="px-4 py-2 text-xs font-semibold text-slate-500 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    Khôi phục mặc định
                </button>
                <button
                    @click="handleSave"
                    :disabled="isSaving"
                    class="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                >
                    <span v-if="isSaving" class="animate-spin material-symbols-outlined text-[14px]">progress_activity</span>
                    <span class="material-symbols-outlined text-[14px]" v-else>save</span>
                    Lưu thay đổi
                </button>
            </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <!-- Địa chỉ & liên hệ -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <div class="flex items-center gap-2 mb-1">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">store</span>
                    <h3 class="text-xs font-bold text-slate-700 uppercase tracking-widest">Cửa hàng</h3>
                </div>

                <!-- Địa chỉ -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1.5">Địa chỉ cửa hàng</label>
                    <input
                        v-model="form.store_address"
                        type="text"
                        placeholder="VD: Km10, Đường Nguyễn Trãi, Hà Đông, Hà Nội"
                        class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                    <p class="text-[10px] text-slate-400 mt-1">Địa chỉ này hiển thị ở footer và dùng để tính khoảng cách giao hàng.</p>
                </div>

                <!-- Hotline -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1.5">Hotline hỗ trợ giao hàng</label>
                    <input
                        v-model="form.phone_support"
                        type="text"
                        placeholder="VD: 1900 1234"
                        class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                </div>

                <!-- Thời gian giao -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1.5">Thời gian giao hàng dự kiến</label>
                    <input
                        v-model="form.estimated_days"
                        type="text"
                        placeholder="VD: 1-3 ngày"
                        class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                    />
                </div>

                <!-- Ghi chú -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1.5">Ghi chú thêm</label>
                    <textarea
                        v-model="form.note"
                        rows="3"
                        placeholder="VD: Không giao vào Chủ nhật..."
                        class="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition resize-none"
                    />
                </div>
            </div>

            <!-- Phí vận chuyển -->
            <div class="bg-white rounded-2xl border border-slate-200 p-6 space-y-5">
                <div class="flex items-center gap-2 mb-1">
                    <span class="material-symbols-outlined text-slate-400 text-[20px]">local_shipping</span>
                    <h3 class="text-xs font-bold text-slate-700 uppercase tracking-widest">Phí vận chuyển</h3>
                </div>

                <!-- Phí cơ bản -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1.5">Phí cơ bản (km đầu tiên)</label>
                    <div class="relative">
                        <input
                            v-model.number="form.base_fee"
                            type="number"
                            min="0"
                            step="1000"
                            class="w-full px-3 py-2.5 pr-14 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                        />
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">VNĐ</span>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1">Hiện tại: {{ formatCurrency(form.base_fee) }}</p>
                </div>

                <!-- Giá / km -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1.5">Giá mỗi km tiếp theo</label>
                    <div class="relative">
                        <input
                            v-model.number="form.price_per_km"
                            type="number"
                            min="0"
                            step="500"
                            class="w-full px-3 py-2.5 pr-14 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                        />
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">VNĐ</span>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1">Hiện tại: {{ formatCurrency(form.price_per_km) }} / km</p>
                </div>

                <!-- Miễn phí ship -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1.5">Miễn phí ship từ</label>
                    <div class="relative">
                        <input
                            v-model.number="form.free_shipping_threshold"
                            type="number"
                            min="0"
                            step="50000"
                            class="w-full px-3 py-2.5 pr-14 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                        />
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">VNĐ</span>
                    </div>
                    <p class="text-[10px] text-slate-400 mt-1">Đơn hàng từ {{ formatCurrency(form.free_shipping_threshold) }} được miễn phí ship.</p>
                </div>

                <!-- Khoảng cách tối đa -->
                <div>
                    <label class="block text-xs font-semibold text-slate-600 mb-1.5">Khoảng cách giao tối đa</label>
                    <div class="relative">
                        <input
                            v-model.number="form.max_distance_km"
                            type="number"
                            min="1"
                            step="1"
                            class="w-full px-3 py-2.5 pr-10 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-400 transition"
                        />
                        <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium">km</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
