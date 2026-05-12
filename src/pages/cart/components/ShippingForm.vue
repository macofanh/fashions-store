<script setup lang="ts">
defineProps<{
    form: {
        recipient_name: string
        phone: string
        province: string
        district: string
        ward: string
        street_address: string
        note: string
    }
    provinces: any[]
    districts: any[]
    wards: any[]
    selectedProvinceCode: number | ''
    selectedDistrictCode: number | ''
}>()

const emit = defineEmits<{
    'update:selectedProvinceCode': [val: number | '']
    'update:selectedDistrictCode': [val: number | '']
}>()
</script>

<template>
    <section class="bg-white border border-border-light rounded-xl p-6 md:p-8 space-y-6">
        <h2 class="text-sm font-bold uppercase tracking-widest text-fashion-black font-display flex items-center gap-2">
            <span class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
            Thông tin giao hàng
        </h2>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Họ tên — pre-fill từ auth, vẫn sửa được -->
            <div class="space-y-1.5">
                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                    Họ và tên <span class="text-red-400">*</span>
                </label>
                <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-3 text-text-muted text-[16px] pointer-events-none">person</span>
                    <input
                        v-model="form.recipient_name"
                        type="text"
                        required
                        placeholder="Họ và tên người nhận"
                        class="w-full border border-border-light rounded-lg pl-9 pr-4 py-3 text-sm outline-none focus:border-primary transition-colors font-display"
                    />
                </div>
            </div>

            <!-- SĐT — pre-fill từ auth, vẫn sửa được -->
            <div class="space-y-1.5">
                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                    Số điện thoại <span class="text-red-400">*</span>
                </label>
                <div class="relative flex items-center">
                    <span class="material-symbols-outlined absolute left-3 text-text-muted text-[16px] pointer-events-none">phone</span>
                    <input
                        v-model="form.phone"
                        type="tel"
                        required
                        placeholder="Số điện thoại nhận hàng"
                        class="w-full border border-border-light rounded-lg pl-9 pr-4 py-3 text-sm outline-none focus:border-primary transition-colors font-display"
                    />
                </div>
            </div>

            <!-- Tỉnh / Thành phố -->
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

            <!-- Quận / Huyện -->
            <div class="space-y-1.5">
                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Quận / Huyện <span class="text-red-400">*</span></label>
                <select
                    :value="selectedDistrictCode"
                    @change="emit('update:selectedDistrictCode', Number(($event.target as HTMLSelectElement).value) || '')"
                    :disabled="selectedProvinceCode === ''"
                    required
                    class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white font-display disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="" disabled>Chọn Quận / Huyện</option>
                    <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
                </select>
            </div>

            <!-- Phường / Xã -->
            <div class="space-y-1.5">
                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Phường / Xã <span class="text-red-400">*</span></label>
                <select
                    v-model="form.ward"
                    :disabled="selectedDistrictCode === ''"
                    required
                    class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white font-display disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="" disabled>Chọn Phường / Xã</option>
                    <option v-for="w in wards" :key="w.code" :value="w.name">{{ w.name }}</option>
                </select>
            </div>

            <!-- Địa chỉ cụ thể -->
            <div class="space-y-1.5 md:col-span-2">
                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Địa chỉ cụ thể <span class="text-red-400">*</span></label>
                <input
                    v-model="form.street_address"
                    type="text"
                    required
                    placeholder="Số nhà, tên đường..."
                    class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-display"
                />
            </div>

            <!-- Ghi chú -->
            <div class="space-y-1.5 md:col-span-2">
                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Ghi chú đơn hàng</label>
                <textarea
                    v-model="form.note"
                    rows="2"
                    placeholder="Yêu cầu đặc biệt, thời gian giao hàng..."
                    class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none font-display"
                ></textarea>
            </div>
        </div>
    </section>
</template>
