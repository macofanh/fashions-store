<script setup lang="ts">
import { getImageUrl } from '@/lib/urlHelper'
import type { UserVoucher } from '@/pages/promotions/promotionService'

defineProps<{
    items: any[]
    subtotal: number
    shippingFee: number
    discountAmount: number
    total: number
    selectedVoucher: UserVoucher | null
    isSubmitting: boolean
    formatPrice: (n: number) => string
    distanceKm: number | null
    shippingResult: { fee: number; isFree: boolean; outOfRange: boolean; hasCoords: boolean }
    submitLabel?: string
}>()

const emit = defineEmits<{ submit: [] }>()
</script>

<template>
    <div class="w-full lg:w-[380px] shrink-0">
        <div class="bg-white border border-border-light rounded-xl overflow-hidden sticky top-28 shadow-sm">

            <!-- Header -->
            <div class="bg-fashion-black px-6 py-4">
                <h2 class="text-sm font-bold text-white uppercase tracking-widest font-display">Đơn hàng của bạn</h2>
            </div>

            <!-- Items -->
            <div class="p-6 max-h-[280px] overflow-y-auto space-y-4 border-b border-border-light">
                <div v-for="item in items" :key="item.cart_item_id" class="flex gap-3">
                    <div class="w-14 aspect-[3/4] bg-fashion-gray rounded-lg overflow-hidden shrink-0 border border-border-light">
                        <img v-if="item.image_url" :src="getImageUrl(item.image_url)" class="w-full h-full object-cover" :alt="item.product_name" />
                        <div v-else class="w-full h-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-text-muted text-lg">image_not_supported</span>
                        </div>
                    </div>
                    <div class="flex-grow min-w-0">
                        <p class="text-xs font-semibold text-fashion-black leading-snug line-clamp-2 font-display">{{ item.product_name }}</p>
                        <p class="text-[10px] text-text-muted mt-0.5 font-display">{{ item.variant_info }}</p>
                        <div class="flex justify-between items-center mt-1.5">
                            <span class="text-[10px] text-text-muted font-display">x{{ item.quantity }}</span>
                            <span class="text-xs font-bold text-fashion-black font-display">{{ formatPrice(item.unit_price * item.quantity) }}</span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Price breakdown -->
            <div class="p-6 space-y-3">
                <div class="flex justify-between text-sm">
                    <span class="text-text-muted font-display">Tạm tính</span>
                    <span class="font-medium text-fashion-black font-display">{{ formatPrice(subtotal) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                    <span class="text-text-muted font-display flex items-center gap-1">
                        Phí vận chuyển
                        <span v-if="shippingResult.hasCoords && distanceKm !== null" class="text-[10px] text-zinc-400">
                            ({{ distanceKm.toFixed(1) }} km)
                        </span>
                    </span>
                    <span v-if="shippingResult.outOfRange" class="text-xs font-bold text-red-500 font-display">
                        Ngoài vùng giao
                    </span>
                    <span v-else-if="shippingResult.isFree || shippingFee === 0" class="text-xs font-bold text-green-600 font-display flex items-center gap-1">
                        <span class="material-symbols-outlined text-[13px]">check_circle</span>
                        Miễn phí
                    </span>
                    <span v-else :class="['font-medium font-display', discountAmount > 0 && selectedVoucher?.voucher.discount_type === 'FREE_SHIP' ? 'line-through text-text-muted' : 'text-fashion-black']">
                        {{ formatPrice(shippingFee) }}
                    </span>
                </div>
                <div v-if="discountAmount > 0" class="flex justify-between text-sm text-primary">
                    <span class="flex items-center gap-1 font-display">
                        <span class="material-symbols-outlined text-[14px]">local_offer</span>
                        {{ selectedVoucher?.voucher.code }}
                    </span>
                    <span class="font-bold font-display">- {{ formatPrice(discountAmount) }}</span>
                </div>

                <!-- Total -->
                <div class="flex justify-between items-center pt-4 border-t border-border-light">
                    <span class="text-sm font-bold uppercase tracking-widest text-fashion-black font-display">Tổng cộng</span>
                    <span class="text-2xl font-bold text-primary font-display">{{ formatPrice(total) }}</span>
                </div>
            </div>

            <!-- Submit -->
            <div class="px-6 pb-6 space-y-3">
                <button
                    @click="emit('submit')"
                    :disabled="isSubmitting"
                    class="w-full bg-primary text-white py-4 text-sm font-bold tracking-widest uppercase rounded-lg hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md shadow-primary/20 font-display"
                >
                    <span v-if="isSubmitting" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    <span v-else class="material-symbols-outlined text-[18px]">lock</span>
                    {{ isSubmitting ? 'Đang xử lý...' : (submitLabel ?? 'Xác nhận đặt hàng') }}
                </button>

                <!-- Trust -->
                <div class="flex items-center justify-center gap-1.5 text-text-muted">
                    <span class="material-symbols-outlined text-[14px]">verified_user</span>
                    <span class="text-[10px] font-display">Thanh toán bảo mật 100%</span>
                </div>
            </div>
        </div>
    </div>
</template>
