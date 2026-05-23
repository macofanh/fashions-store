<script setup lang="ts">
interface SePayQrSession {
    orderId: number
    orderCode: string
    amount: number
    description: string
    qrUrl: string
}

defineProps<{
    modelValue: string
    qrSession: SePayQrSession | null
    qrStatus: 'idle' | 'waiting' | 'paid' | 'failed'
    qrStatusMessage: string
    formatPrice: (n: number) => string
}>()
const emit = defineEmits<{ 'update:modelValue': [val: string] }>()

const methods = [
    {
        value: 'COD',
        icon: 'payments',
        label: 'Thanh toán khi nhận hàng',
        desc: 'Trả tiền mặt khi nhận hàng (COD)',
    },
    {
        value: 'QR_CODE',
        icon: 'qr_code',
        label: 'Chuyển khoản QR',
        desc: 'Quét mã QR SePay để thanh toán ngay',
    },
    {
        value: 'MOMO',
        icon: 'account_balance_wallet',
        label: 'Ví MoMo',
        desc: 'Thanh toán qua ví điện tử MoMo',
        logo: 'https://upload.wikimedia.org/wikipedia/vi/f/fe/MoMo_Logo.png',
    },
    {
        value: 'VNPAY',
        icon: 'credit_card',
        label: 'VNPay',
        desc: 'Thanh toán qua cổng VNPay (ATM/Visa/QR)',
        logo: 'https://cdn.haitrieu.com/wp-content/uploads/2022/10/Logo-VNPAY-QR-1.png',
    },
]
</script>

<template>
    <section class="bg-white border border-border-light rounded-xl p-6 md:p-8 space-y-5">
        <h2 class="text-sm font-bold uppercase tracking-widest text-fashion-black font-display flex items-center gap-2">
            <span class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">2</span>
            Phương thức thanh toán
        </h2>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label
                v-for="m in methods"
                :key="m.value"
                :class="[
                    'flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all',
                    modelValue === m.value
                        ? 'border-primary bg-primary-light'
                        : 'border-border-light hover:border-primary/50 bg-white'
                ]"
            >
                <input type="radio" :value="m.value" :checked="modelValue === m.value"
                    @change="emit('update:modelValue', m.value)" class="hidden" />

                <!-- Radio visual -->
                <div :class="[
                    'w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all',
                    modelValue === m.value ? 'border-primary' : 'border-border-light'
                ]">
                    <div v-if="modelValue === m.value" class="w-2.5 h-2.5 rounded-full bg-primary"></div>
                </div>

                <!-- Logo hoặc icon -->
                <img v-if="(m as any).logo" :src="(m as any).logo" :alt="m.label"
                    class="w-8 h-8 object-contain rounded shrink-0" />
                <span v-else :class="['material-symbols-outlined text-[22px]', modelValue === m.value ? 'text-primary' : 'text-text-muted']">
                    {{ m.icon }}
                </span>

                <div>
                    <p class="text-sm font-bold text-fashion-black font-display">{{ m.label }}</p>
                    <p class="text-[10px] text-text-muted font-display mt-0.5">{{ m.desc }}</p>
                </div>
            </label>
        </div>
    </section>

    <section v-if="qrSession && modelValue === 'QR_CODE'" class="bg-white border border-primary/20 rounded-xl p-6 md:p-8 space-y-5 mt-5">
        <div class="flex items-start gap-3">
            <div :class="['w-10 h-10 rounded-full flex items-center justify-center shrink-0', qrStatus === 'paid' ? 'bg-green-100 text-green-600' : 'bg-primary/10 text-primary']">
                <span class="material-symbols-outlined text-[20px]">qr_code_2</span>
            </div>
            <div class="min-w-0 flex-1">
                <h3 class="text-sm font-bold text-fashion-black font-display">Vui lòng thanh toán </h3>
                <p class="text-xs text-text-muted mt-0.5 leading-relaxed">
                    {{ qrStatusMessage || 'Quét mã QR bên dưới để thanh toán.' }}
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
</template>
