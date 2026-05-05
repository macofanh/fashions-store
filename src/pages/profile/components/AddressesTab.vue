<script setup lang="ts">
import type { Address } from '../addressService'

defineProps<{
    addresses: Address[]
    isLoading: boolean
}>()

const emit = defineEmits<{ openModal: [] }>()
</script>

<template>
    <div>
        <div class="flex justify-between items-end mb-8">
            <div>
                <h2 class="text-2xl md:text-3xl font-serif italic text-fashion-black mb-2">Sổ địa chỉ</h2>
                <p class="text-text-muted text-sm font-display">Quản lý địa chỉ giao hàng của bạn.</p>
            </div>
            <button @click="emit('openModal')"
                class="flex items-center gap-2 bg-primary text-white px-5 py-2.5 text-sm font-bold rounded-lg hover:bg-primary-dark transition-colors font-display">
                <span class="material-symbols-outlined text-[18px]">add</span>
                Thêm địa chỉ
            </button>
        </div>

        <div v-if="isLoading" class="flex justify-center py-20">
            <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
        </div>

        <div v-else-if="addresses.length === 0"
            class="text-center py-20 bg-white border border-dashed border-border-light rounded-xl">
            <div class="w-16 h-16 bg-primary-light rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="material-symbols-outlined text-primary text-3xl">location_on</span>
            </div>
            <p class="text-text-muted text-sm font-display mb-4">Bạn chưa lưu địa chỉ nào.</p>
            <button @click="emit('openModal')" class="btn-outline px-6 py-2.5">Thêm địa chỉ đầu tiên</button>
        </div>

        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div v-for="addr in addresses" :key="addr.address_id"
                class="bg-white border-2 border-border-light rounded-xl p-6 relative hover:border-primary transition-colors">
                <div v-if="addr.is_default"
                    class="absolute top-4 right-4 bg-primary text-white text-[9px] uppercase px-2.5 py-1 font-bold tracking-widest rounded-full font-display">
                    Mặc định
                </div>
                <div class="flex items-start gap-3">
                    <span class="material-symbols-outlined text-primary text-[20px] mt-0.5 shrink-0" style="font-variation-settings:'FILL' 1">location_on</span>
                    <div>
                        <h4 class="text-sm font-bold text-fashion-black mb-1 font-display">{{ addr.recipient_name }}</h4>
                        <p class="text-xs text-text-muted mb-1 font-display">{{ addr.phone }}</p>
                        <p class="text-xs text-text-muted leading-relaxed font-display">
                            {{ addr.street_address }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
