<script setup lang="ts">
import type { AdjustStockForm, InventoryChangeType } from '../inventory.types'

const isOpen = defineModel<boolean>('isOpen', { required: true })
const form = defineModel<AdjustStockForm>('form', { required: true })

defineProps<{
    isSubmitting: boolean
}>()

defineEmits<{
    submit: []
}>()

const changeTypes: Array<{ value: InventoryChangeType; label: string; icon: string }> = [
    { value: 'IN', label: 'Nhập kho', icon: 'add_circle' },
    { value: 'OUT', label: 'Xuất kho', icon: 'remove_circle' },
    { value: 'ADJUST', label: 'Điều chỉnh', icon: 'tune' },
]
</script>

<template>
    <Teleport to="body">
        <Transition name="drawer">
            <div v-if="isOpen" class="fixed inset-0 z-50 flex justify-end">
                <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="isOpen = false"></div>
                <div class="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full rounded-l-2xl overflow-hidden">
                    <div class="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                        <div>
                            <h2 class="text-base font-bold text-slate-900">Điều chỉnh kho</h2>
                            <p class="text-xs text-slate-500 mt-0.5">Nhập/xuất kho thủ công</p>
                        </div>
                        <button
                            @click="isOpen = false"
                            class="w-8 h-8 flex items-center justify-center hover:bg-slate-200 rounded-full transition-colors"
                        >
                            <span class="material-symbols-outlined text-[20px] text-slate-500">close</span>
                        </button>
                    </div>
                    <div class="flex-grow p-6 space-y-6 overflow-y-auto">
                        <div class="space-y-2">
                            <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Biến thể ID</label>
                            <input
                                v-model="form.variant_id"
                                type="number"
                                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                                placeholder="Nhập ID biến thể..."
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Loại giao dịch</label>
                            <div class="grid grid-cols-3 gap-2">
                                <button
                                    v-for="type in changeTypes"
                                    :key="type.value"
                                    @click="form.change_type = type.value"
                                    :class="[
                                        'flex flex-col items-center gap-1.5 py-3 rounded-xl border-2 text-[10px] font-semibold transition-all',
                                        form.change_type === type.value
                                            ? 'border-slate-900 bg-slate-900 text-white'
                                            : 'border-slate-200 text-slate-500 hover:border-slate-400',
                                    ]"
                                >
                                    <span class="material-symbols-outlined text-[20px]">{{ type.icon }}</span>
                                    {{ type.label }}
                                </button>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Số lượng</label>
                            <input
                                v-model.number="form.quantity"
                                type="number"
                                min="1"
                                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all"
                            />
                        </div>
                        <div class="space-y-2">
                            <label class="text-xs font-semibold text-slate-600 uppercase tracking-wider">Ghi chú</label>
                            <textarea
                                v-model="form.note"
                                rows="3"
                                placeholder="Lý do điều chỉnh..."
                                class="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-100 transition-all resize-none"
                            ></textarea>
                        </div>
                    </div>
                    <div class="p-6 border-t border-slate-100 bg-slate-50">
                        <button
                            @click="$emit('submit')"
                            :disabled="isSubmitting"
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
</template>

<style scoped>
.drawer-enter-active,
.drawer-leave-active {
    transition: opacity 0.3s ease;
}

.drawer-enter-active .relative,
.drawer-leave-active .relative {
    transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
}

.drawer-enter-from,
.drawer-leave-to {
    opacity: 0;
}

.drawer-enter-from .relative,
.drawer-leave-to .relative {
    transform: translateX(100%);
}
</style>
