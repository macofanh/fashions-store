<script setup lang="ts">
defineProps<{
    form: {
        recipient_name: string
        phone: string
        province: string
        district: string
        ward: string
        street_address: string
    }
    provinces: any[]
    districts: any[]
    wards: any[]
    selectedProvinceCode: number | ''
    selectedDistrictCode: number | ''
}>()

const emit = defineEmits<{
    close: []
    submit: []
    'update:selectedProvinceCode': [val: number | '']
    'update:selectedDistrictCode': [val: number | '']
}>()
</script>

<template>
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-fashion-black/60 backdrop-blur-sm">
        <div class="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden">

            <!-- Header -->
            <div class="bg-fashion-black px-8 py-5 flex justify-between items-center">
                <h2 class="text-lg font-serif italic text-white">Thêm địa chỉ mới</h2>
                <button @click="emit('close')"
                    class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors">
                    <span class="material-symbols-outlined text-white text-[20px]">close</span>
                </button>
            </div>

            <!-- Form -->
            <form @submit.prevent="emit('submit')" class="p-8 space-y-5">
                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Tên người nhận <span class="text-red-400">*</span></label>
                        <input v-model="form.recipient_name" required type="text"
                            class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-display" />
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Số điện thoại <span class="text-red-400">*</span></label>
                        <input v-model="form.phone" required type="tel"
                            class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-display" />
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Tỉnh / Thành phố <span class="text-red-400">*</span></label>
                    <select
                        :value="selectedProvinceCode"
                        @change="emit('update:selectedProvinceCode', Number(($event.target as HTMLSelectElement).value) || '')"
                        required
                        class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white font-display"
                    >
                        <option value="" disabled>Chọn Tỉnh / Thành phố</option>
                        <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                    </select>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div class="space-y-1.5">
                        <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Quận / Huyện <span class="text-red-400">*</span></label>
                        <select
                            :value="selectedDistrictCode"
                            @change="emit('update:selectedDistrictCode', Number(($event.target as HTMLSelectElement).value) || '')"
                            :disabled="selectedProvinceCode === ''"
                            required
                            class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white font-display disabled:opacity-50"
                        >
                            <option value="" disabled>Chọn Quận / Huyện</option>
                            <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
                        </select>
                    </div>
                    <div class="space-y-1.5">
                        <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Phường / Xã <span class="text-red-400">*</span></label>
                        <select
                            v-model="form.ward"
                            :disabled="selectedDistrictCode === ''"
                            required
                            class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white font-display disabled:opacity-50"
                        >
                            <option value="" disabled>Chọn Phường / Xã</option>
                            <option v-for="w in wards" :key="w.code" :value="w.name">{{ w.name }}</option>
                        </select>
                    </div>
                </div>

                <div class="space-y-1.5">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Địa chỉ chi tiết <span class="text-red-400">*</span></label>
                    <input v-model="form.street_address" required type="text"
                        placeholder="Số nhà, tên đường..."
                        class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-display" />
                </div>

                <div class="flex gap-3 pt-2">
                    <button type="button" @click="emit('close')"
                        class="flex-1 border border-border-light text-text-muted py-3.5 rounded-lg text-sm font-bold hover:border-fashion-black hover:text-fashion-black transition-colors font-display">
                        Hủy
                    </button>
                    <button type="submit"
                        class="flex-1 bg-primary text-white py-3.5 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors font-display">
                        Lưu địa chỉ
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>
