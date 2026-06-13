<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { checkoutHandler } from './checkoutHandler'

import ShippingForm    from './components/ShippingForm.vue'
import PaymentMethod   from './components/PaymentMethod.vue'
import VoucherSelector from './components/VoucherSelector.vue'
import OrderSummary    from './components/OrderSummary.vue'

const {
    cart, myVouchers, selectedVoucher,
    isLoading, isSubmitting, loadError,
    qrSession, qrStatus, qrStatusMessage,
    form, provinces, districts, wards,
    selectedProvinceCode, selectedDistrictCode,
    savedAddresses, selectedAddressId,
    subtotal, discountAmount, total, SHIPPING_FEE,
    shippingResult, distanceKm,
    submitLabel,
    init, toggleVoucher, submitOrder, formatPrice, applyAddress,
} = checkoutHandler()

const isQrWaiting = computed(() => qrStatus.value === 'waiting' && !!qrSession.value)

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
            </div>

            <!-- Loading -->
            <div v-if="isLoading" class="flex justify-center py-32">
                <div class="animate-spin h-10 w-10 border-4 border-primary border-t-transparent rounded-full"></div>
            </div>

            <div v-else-if="loadError" class="mx-auto max-w-lg rounded-2xl border border-red-100 bg-white p-8 text-center shadow-sm">
                <div class="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500">
                    <span class="material-symbols-outlined">error</span>
                </div>
                <h2 class="mt-4 text-lg font-bold text-fashion-black">Không thể tải trang thanh toán</h2>
                <p class="mt-2 text-sm text-text-muted">{{ loadError }}</p>
                <div class="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                    <router-link
                        to="/cart"
                        class="rounded-xl border border-border-light px-5 py-3 text-sm font-semibold text-fashion-black transition-colors hover:bg-border-light"
                    >
                        Quay lại giỏ hàng
                    </router-link>
                    <button
                        type="button"
                        class="rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90"
                        @click="init"
                    >
                        Thử lại
                    </button>
                </div>
            </div>

            <div v-else-if="cart" class="flex flex-col lg:flex-row gap-8 lg:gap-10 items-start">
                <!-- LEFT: Form sections -->
                <div class="flex-grow space-y-5 min-w-0">
                    <ShippingForm
                        :form="form"
                        :provinces="provinces"
                        :districts="districts"
                        :wards="wards"
                        :selected-province-code="selectedProvinceCode"
                        :selected-district-code="selectedDistrictCode"
                        :saved-addresses="savedAddresses"
                        :selected-address-id="selectedAddressId"
                        @update:selected-province-code="selectedProvinceCode = $event"
                        @update:selected-district-code="selectedDistrictCode = $event"
                        @select-address="applyAddress"
                    />

                    <PaymentMethod
                        :model-value="form.payment_method"
                        @update:model-value="form.payment_method = $event"
                        :qr-session="qrSession"
                        :qr-status="qrStatus"
                        :qr-status-message="qrStatusMessage"
                        :format-price="formatPrice"
                    />

                    <VoucherSelector
                        :vouchers="myVouchers"
                        :selected="selectedVoucher"
                        :subtotal="subtotal"
                        :format-price="formatPrice"
                        @toggle="toggleVoucher"
                    />
                </div>

                <!-- RIGHT: Summary -->
                <OrderSummary
                    :items="cart.items"
                    :subtotal="subtotal"
                    :shipping-fee="SHIPPING_FEE"
                    :discount-amount="discountAmount"
                    :total="total"
                    :selected-voucher="selectedVoucher"
                    :is-submitting="isSubmitting"
                    :is-qr-waiting="isQrWaiting"
                    :format-price="formatPrice"
                    :distance-km="distanceKm"
                    :shipping-result="shippingResult"
                    :submit-label="submitLabel"
                    @submit="submitOrder"
                />
            </div>
        </div> <!-- Đóng thẻ max-w-[1300px] -->
    </div> <!-- Đóng thẻ bg-background-light -->
</template>
