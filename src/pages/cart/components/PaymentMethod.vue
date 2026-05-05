<script setup lang="ts">
defineProps<{ modelValue: string }>()
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
        desc: 'Quét mã QR để thanh toán ngay',
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

                <span :class="['material-symbols-outlined text-[22px]', modelValue === m.value ? 'text-primary' : 'text-text-muted']">
                    {{ m.icon }}
                </span>

                <div>
                    <p class="text-sm font-bold text-fashion-black font-display">{{ m.label }}</p>
                    <p class="text-[10px] text-text-muted font-display mt-0.5">{{ m.desc }}</p>
                </div>
            </label>
        </div>
    </section>
</template>
