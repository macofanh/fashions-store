<script setup lang="ts">
import { ref } from 'vue'
import { getImageUrl } from '@/lib/urlHelper'

interface SePayQrSession {
    orderCode: string
    amount: number
    description: string
    qrUrl: string
}

const props = defineProps<{
    isOpen: boolean
    isLoading: boolean
    order: any
    qrSession: SePayQrSession | null
    qrStatusMessage: string
    formatPrice: (n: number) => string
    formatDate: (s: string) => string
    getStatus: (s: string) => { label: string; classes: string; dot: string }
}>()

const emit = defineEmits<{ close: [] }>()

const previewImageUrl = ref<string | null>(null)

const paymentStatusConfig: Record<string, { label: string; cls: string }> = {
    PENDING:  { label: 'Chờ thanh toán', cls: 'bg-amber-50 text-amber-700 border border-amber-100' },
    PAID:     { label: 'Đã thanh toán',  cls: 'bg-emerald-50 text-emerald-700 border border-emerald-100' },
    FAILED:   { label: 'Thất bại',        cls: 'bg-red-50 text-red-600 border border-red-100' },
    REFUNDED: { label: 'Đã hoàn tiền',    cls: 'bg-slate-100 text-slate-600 border border-slate-200' },
}

const getPaymentStatus = (order: any) => {
    const value = order?.payment_status || order?.payment_state || order?.payment?.status || 'PENDING'
    return paymentStatusConfig[value] || { label: value, cls: 'bg-slate-100 text-slate-600 border border-slate-200' }
}

const openImagePreview = (imageUrl?: string) => {
    if (!imageUrl) return
    previewImageUrl.value = imageUrl
}

const closeImagePreview = () => {
    previewImageUrl.value = null
}
</script>

<template>
    <Teleport to="body">
        <Transition name="drawer">
            <div v-if="isOpen" class="fixed inset-0 z-[120] flex justify-end">
                <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="emit('close')"></div>

                <div class="relative w-full max-w-2xl bg-background-light shadow-2xl flex flex-col h-full rounded-l-2xl overflow-hidden">
                    <div class="px-6 py-5 border-b border-border-light flex items-center justify-between bg-white shrink-0">
                        <div>
                            <h2 class="text-base font-bold text-fashion-black">
                                Chi tiết đơn hàng
                                <span v-if="order" class="text-primary ml-1">{{ order.order_code }}</span>
                            </h2>
                            <p class="text-xs text-text-muted mt-0.5">
                                {{ order ? formatDate(order.created_at) : '' }}
                            </p>
                        </div>
                        <button @click="emit('close')" class="w-8 h-8 flex items-center justify-center hover:bg-fashion-gray rounded-full transition-colors">
                            <span class="material-symbols-outlined text-[20px] text-text-muted">close</span>
                        </button>
                    </div>

                    <div v-if="isLoading" class="flex-grow flex items-center justify-center">
                        <div class="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full"></div>
                    </div>

                    <div v-else-if="order" class="flex-grow overflow-y-auto p-6 space-y-6">
                        <section class="bg-white border border-border-light rounded-xl p-5 space-y-4">
                            <h3 class="text-xs font-bold text-text-muted uppercase tracking-wider font-display">Trạng thái đơn hàng</h3>

                            <div class="flex items-center gap-3 flex-wrap">
                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-text-muted">Đơn hàng:</span>
                                    <span :class="['inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold font-display', getStatus(order.status).classes]">
                                        <span :class="['w-1.5 h-1.5 rounded-full', getStatus(order.status).dot]"></span>
                                        {{ getStatus(order.status).label }}
                                    </span>
                                </div>

                                <div class="flex items-center gap-2">
                                    <span class="text-xs text-text-muted">Thanh toán:</span>
                                    <span :class="['text-[11px] font-semibold px-2.5 py-1 rounded-full', getPaymentStatus(order).cls]">
                                        {{ getPaymentStatus(order).label }}
                                    </span>
                                </div>
                            </div>
                        </section>

                        <section class="bg-white border border-border-light rounded-xl p-5 space-y-3">
                            <h3 class="text-xs font-bold text-text-muted uppercase tracking-wider font-display">Sản phẩm đặt mua</h3>
                            <div v-for="item in order.items" :key="item.item_id || item.id || item.variant_id"
                                class="flex items-center gap-3 py-3 border-b border-border-light last:border-0">
                                <button
                                    type="button"
                                    class="w-12 h-12 bg-fashion-gray rounded-lg overflow-hidden flex items-center justify-center shrink-0 border border-border-light hover:ring-2 hover:ring-primary/20 transition-all"
                                    @click="openImagePreview(item.image_url)"
                                >
                                    <img
                                        v-if="item.image_url"
                                        :src="getImageUrl(item.image_url)"
                                        :alt="item.product_name"
                                        class="w-full h-full object-cover"
                                    />
                                    <span v-else class="material-symbols-outlined text-text-muted text-[18px]">checkroom</span>
                                </button>
                                <div class="flex-grow min-w-0">
                                    <button
                                        type="button"
                                        class="text-left"
                                        @click="openImagePreview(item.image_url)"
                                    >
                                        <p class="text-sm font-semibold text-fashion-black truncate hover:text-primary transition-colors">{{ item.product_name }}</p>
                                    </button>
                                    <p class="text-xs text-text-muted">{{ item.variant_info }}<span v-if="item.sku_snapshot"> · SKU: {{ item.sku_snapshot }}</span></p>
                                </div>
                                <div class="text-right shrink-0">
                                    <p class="text-sm font-bold text-fashion-black">{{ formatPrice(item.unit_price * item.quantity) }}</p>
                                    <p class="text-xs text-text-muted">{{ formatPrice(item.unit_price) }} × {{ item.quantity }}</p>
                                </div>
                            </div>

                            <div class="pt-3 space-y-1.5 border-t border-border-light">
                                <div class="flex justify-between text-xs text-text-muted">
                                    <span>Tạm tính</span>
                                    <span>{{ formatPrice(order.subtotal || 0) }}</span>
                                </div>
                                <div v-if="order.discount_amount > 0" class="flex justify-between text-xs text-emerald-600">
                                    <span>Giảm giá</span>
                                    <span>-{{ formatPrice(order.discount_amount) }}</span>
                                </div>
                                <div class="flex justify-between text-xs text-text-muted">
                                    <span>Phí vận chuyển</span>
                                    <span>{{ formatPrice(order.shipping_fee || 0) }}</span>
                                </div>
                                <div v-if="order.points_used > 0" class="flex justify-between text-xs text-amber-600">
                                    <span>Điểm thưởng dùng</span>
                                    <span>-{{ formatPrice(order.points_used) }}</span>
                                </div>
                                <div class="flex justify-between text-sm font-bold text-fashion-black pt-1.5 border-t border-border-light">
                                    <span>Tổng cộng</span>
                                    <span>{{ formatPrice(order.total_amount || 0) }}</span>
                                </div>
                            </div>
                        </section>

                        <section class="bg-white border border-border-light rounded-xl p-5 space-y-3">
                            <h3 class="text-xs font-bold text-text-muted uppercase tracking-wider font-display">Địa chỉ giao hàng</h3>
                            <div class="flex items-start gap-3">
                                <span class="material-symbols-outlined text-text-muted text-[18px] mt-0.5 shrink-0" style="font-variation-settings:'FILL' 1">location_on</span>
                                <div>
                                    <p class="text-sm font-semibold text-fashion-black">{{ order.address_snapshot?.recipient_name }}</p>
                                    <p class="text-xs text-text-muted mt-0.5">{{ order.address_snapshot?.phone }}</p>
                                    <p class="text-xs text-text-muted mt-1 leading-relaxed">
                                        {{ order.address_snapshot?.street_address }},
                                        {{ order.address_snapshot?.ward }},
                                        {{ order.address_snapshot?.district }},
                                        {{ order.address_snapshot?.province }}
                                    </p>
                                </div>
                            </div>
                            <div v-if="order.note" class="flex items-start gap-2 bg-amber-50 rounded-lg px-3 py-2">
                                <span class="material-symbols-outlined text-amber-500 text-[16px] shrink-0 mt-0.5">sticky_note_2</span>
                                <p class="text-xs text-amber-700">{{ order.note }}</p>
                            </div>
                        </section>

                        <section v-if="order.payment" class="bg-white border border-border-light rounded-xl p-5 space-y-3">
                            <h3 class="text-xs font-bold text-text-muted uppercase tracking-wider font-display">Thông tin thanh toán</h3>
                            <div class="grid grid-cols-2 gap-3 text-xs">
                                <div class="bg-fashion-gray rounded-lg p-3">
                                    <p class="text-text-muted mb-1">Phương thức</p>
                                    <p class="font-semibold text-fashion-black">{{ order.payment_method }}</p>
                                </div>
                                <div class="bg-fashion-gray rounded-lg p-3">
                                    <p class="text-text-muted mb-1">Trạng thái</p>
                                    <span :class="['font-semibold px-2 py-0.5 rounded-full text-[10px]', getPaymentStatus(order).cls]">
                                        {{ getPaymentStatus(order).label }}
                                    </span>
                                </div>
                                <div v-if="order.payment.transaction_id" class="bg-fashion-gray rounded-lg p-3 col-span-2">
                                    <p class="text-text-muted mb-1">Mã giao dịch</p>
                                    <p class="font-semibold text-fashion-black font-mono text-[11px]">{{ order.payment.transaction_id }}</p>
                                </div>
                                <div v-if="order.payment.paid_at" class="bg-fashion-gray rounded-lg p-3 col-span-2">
                                    <p class="text-text-muted mb-1">Thời gian thanh toán</p>
                                    <p class="font-semibold text-fashion-black">{{ formatDate(order.payment.paid_at) }}</p>
                                </div>
                            </div>
                        </section>

                        <section v-if="qrSession && order.payment_method === 'QR_CODE'" class="bg-white border border-primary/20 rounded-xl p-5 space-y-4">
                            <div class="flex items-start gap-3">
                                <div class="w-10 h-10 rounded-full flex items-center justify-center shrink-0 bg-primary/10 text-primary">
                                    <span class="material-symbols-outlined text-[20px]">qr_code_2</span>
                                </div>
                                <div class="min-w-0 flex-1">
                                    <h3 class="text-sm font-bold text-fashion-black font-display">Thanh toán QR</h3>
                                    <p class="text-xs text-text-muted mt-0.5 leading-relaxed">
                                        {{ qrStatusMessage || 'Quét mã QR bên dưới để thanh toán đơn hàng này.' }}
                                    </p>
                                </div>
                            </div>

                            <div class="rounded-2xl border border-border-light bg-fashion-gray/30 p-4 flex flex-col items-center gap-4">
                                <img :src="qrSession.qrUrl" alt="Mã QR thanh toán SePay" class="w-full max-w-[280px] aspect-square object-contain rounded-xl bg-white border border-border-light p-3" />

                                <div class="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                    <div class="rounded-xl bg-white border border-border-light p-3">
                                        <p class="text-[10px] uppercase tracking-widest text-text-muted font-bold font-display">Mã đơn</p>
                                        <p class="mt-1 font-semibold text-fashion-black break-all">{{ qrSession.orderCode }}</p>
                                    </div>
                                    <div class="rounded-xl bg-white border border-border-light p-3">
                                        <p class="text-[10px] uppercase tracking-widest text-text-muted font-bold font-display">Số tiền</p>
                                        <p class="mt-1 font-semibold text-primary">{{ formatPrice(qrSession.amount) }}</p>
                                    </div>
                                </div>

                                <div class="w-full rounded-xl bg-white border border-border-light p-3 text-sm">
                                    <p class="text-[10px] uppercase tracking-widest text-text-muted font-bold font-display">Nội dung chuyển khoản</p>
                                    <p class="mt-1 text-fashion-black leading-relaxed break-words">{{ qrSession.description }}</p>
                                </div>
                            </div>
                        </section>
                    </div>

                    <Teleport to="body">
                        <Transition name="fade">
                            <div v-if="previewImageUrl" class="fixed inset-0 z-[140] flex items-center justify-center bg-black/70 p-4" @click="closeImagePreview">
                                <div class="max-w-3xl w-full bg-white rounded-2xl overflow-hidden shadow-2xl" @click.stop>
                                    <div class="flex items-center justify-between px-4 py-3 border-b border-border-light">
                                        <p class="text-sm font-semibold text-fashion-black">Ảnh sản phẩm</p>
                                        <button @click="closeImagePreview" class="w-8 h-8 rounded-full hover:bg-fashion-gray flex items-center justify-center transition-colors">
                                            <span class="material-symbols-outlined text-[20px] text-text-muted">close</span>
                                        </button>
                                    </div>
                                    <div class="bg-fashion-gray/30 flex items-center justify-center p-4">
                                        <img :src="getImageUrl(previewImageUrl)" alt="Ảnh sản phẩm" class="max-h-[70vh] w-auto max-w-full object-contain rounded-xl bg-white" />
                                    </div>
                                </div>
                            </div>
                        </Transition>
                    </Teleport>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
    opacity: 0;
}
</style>