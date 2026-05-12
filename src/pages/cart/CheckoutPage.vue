<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { cartService } from '@/pages/cart/cartService'
import { checkoutHandler } from './checkoutHandler'
import { orderService, type OrderCreateData } from '@/pages/cart/orderService'
import { promotionService, type UserVoucher } from '@/pages/promotions/promotionService'
import { getImageUrl } from '@/lib/urlHelper'
import axios from 'axios'
import GoongAddressInput from '@/components/GoongAddressInput.vue'

import ShippingForm    from './components/ShippingForm.vue'
import PaymentMethod   from './components/PaymentMethod.vue'
import VoucherSelector from './components/VoucherSelector.vue'
import OrderSummary    from './components/OrderSummary.vue'

const {
    cart, myVouchers, selectedVoucher,
    isLoading, isSubmitting,
    form, provinces, districts, wards,
    selectedProvinceCode, selectedDistrictCode,
    subtotal, discountAmount, total, SHIPPING_FEE,
    init, toggleVoucher, submitOrder, formatPrice,
} = checkoutHandler()

onMounted(init)
</script>

<template>
    <div class="bg-background-light min-h-screen pb-24">
        <div class="max-w-[1300px] mx-auto px-6 md:px-12 pt-10">

            <!-- Header -->
            <div class="mb-10">
                <nav class="flex items-center gap-2 text-[10px] uppercase tracking-widest text-text-muted mb-4 font-display">
                    <router-link to="/" class="hover:text-primary transition-colors">Trang chủ</router-link>
                    <span>/</span>
                    <router-link to="/cart" class="hover:text-primary transition-colors">Giỏ hàng</router-link>
                    <span>/</span>
                    <span class="text-fashion-black font-medium">Thanh toán</span>
                </nav>
                <h1 class="text-3xl md:text-4xl font-serif italic text-fashion-black">Thanh toán</h1>
                <p class="text-text-muted text-sm mt-1 font-display">Hoàn tất đơn hàng của bạn</p>
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="flex justify-center py-32">
                <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>

            <div>
                <div class="space-y-2">
                    <GoongAddressInput v-model="form.street_address" @selected="() => undefined" />
                </div>
            </div>
                    
            <!-- LEFT: Form sections -->
            <div class="flex-grow space-y-5 min-w-0">
                <ShippingForm
                    :form="form"
                    :provinces="provinces"
                    :districts="districts"
                    :wards="wards"
                    :selected-province-code="selectedProvinceCode"
                    :selected-district-code="selectedDistrictCode"
                    @update:selected-province-code="selectedProvinceCode = $event"
                    @update:selected-district-code="selectedDistrictCode = $event"
                />

                <PaymentMethod
                    :model-value="form.payment_method"
                    @update:model-value="form.payment_method = $event"
                />

                <VoucherSelector
                    :vouchers="myVouchers"
                    :selected="selectedVoucher"
                    :subtotal="subtotal"
                    :format-price="formatPrice"
                    @toggle="toggleVoucher"
                />
            </div>
            
        </div> <!-- Đóng thẻ max-w-[1300px] -->
    </div> <!-- Đóng thẻ bg-background-light -->
</template>