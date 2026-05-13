<script setup lang="ts">
import type { Address } from '../addressService'

defineProps<{
    addresses: Address[]
    isLoading: boolean
}>()

const emit = defineEmits<{
    'open-modal': []
    'open-edit': [addr: Address]
    'delete-address': [addr: Address]
    'set-default': [addr: Address]
}>()
</script>

<template>
    <div>
        <!-- Header -->
        <div class="flex justify-between items-end mb-8 border-b border-border-light pb-4">
            <div>
                <h2 class="text-2xl md:text-3xl font-serif italic text-fashion-black mb-1">Sổ địa chỉ</h2>
                <p class="text-text-muted text-sm font-display">Quản lý địa chỉ giao hàng của bạn.</p>
            </div>
            <button
                @click="emit('open-modal')"
                class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors font-display shrink-0"
            >
                <span class="material-symbols-outlined text-[18px]">add</span>
                Thêm địa chỉ
            </button>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-20">
            <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>

        <!-- Empty -->
        <div
            v-else-if="addresses.length === 0"
            class="text-center py-20 bg-white border border-dashed border-border-light rounded-xl"
        >
            <div class="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-symbols-outlined text-primary text-3xl">location_on</span>
            </div>
            <p class="text-text-muted text-sm font-display mb-4">Bạn chưa lưu địa chỉ nào.</p>
            <button
                @click="emit('open-modal')"
                class="border border-fashion-black px-6 py-2.5 text-sm font-bold font-display hover:bg-fashion-black hover:text-white transition-all rounded-lg"
            >
                Thêm địa chỉ đầu tiên
            </button>
        </div>

        <!-- List -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
                v-for="addr in addresses"
                :key="addr.address_id"
                :class="[
                    'bg-white rounded-xl border-2 p-5 flex flex-col gap-4 transition-all',
                    addr.is_default ? 'border-primary' : 'border-border-light hover:border-primary/40'
                ]"
            >
                <!-- Badge + nội dung -->
                <div class="flex items-start gap-3">
                    <span
                        class="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0"
                        style="font-variation-settings:'FILL' 1"
                    >location_on</span>
                    <div class="flex-grow min-w-0">
                        <div class="flex items-center gap-2 mb-1">
                            <h4 class="text-sm font-bold text-fashion-black font-display truncate">{{ addr.recipient_name }}</h4>
                            <span
                                v-if="addr.is_default"
                                class="shrink-0 text-[9px] font-bold uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full font-display"
                            >Mặc định</span>
                        </div>
                        <p class="text-xs text-text-muted mb-1 font-display">{{ addr.phone }}</p>
                        <p class="text-xs text-text-muted leading-relaxed font-display">
                            {{ addr.street_address }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}
                        </p>
                    </div>
                </div>

                <!-- Action buttons -->
                <div class="flex items-center gap-2 pt-3 border-t border-border-light">
                    <button
                        @click="emit('open-edit', addr)"
                        class="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-primary transition-colors font-display px-2 py-1 rounded-lg hover:bg-primary-light"
                    >
                        <span class="material-symbols-outlined text-[15px]">edit</span>
                        Sửa
                    </button>

                    <button
                        v-if="!addr.is_default"
                        @click="emit('set-default', addr)"
                        class="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-amber-600 transition-colors font-display px-2 py-1 rounded-lg hover:bg-amber-50"
                    >
                        <span class="material-symbols-outlined text-[15px]">star</span>
                        Đặt mặc định
                    </button>

                    <button
                        @click="emit('delete-address', addr)"
                        class="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-red-500 transition-colors font-display px-2 py-1 rounded-lg hover:bg-red-50 ml-auto"
                    >
                        <span class="material-symbols-outlined text-[15px]">delete</span>
                        Xóa
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>
