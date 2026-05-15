<script setup lang="ts">
import GoongAddressInput from '@/components/GoongAddressInput.vue'
import type { Address } from '@/pages/profile/addressService'
import type { GoongAddressDetail } from '@/lib/goongService'

const props = defineProps<{
    form: {
        recipient_name: string
        phone: string
        province: string
        district: string
        ward: string
        street_address: string
        note: string
        latitude: number | null
        longitude: number | null
    }
    provinces: any[]
    districts: any[]
    wards: any[]
    selectedProvinceCode: number | ''
    selectedDistrictCode: number | ''
    savedAddresses: Address[]
    selectedAddressId: number | null
}>()

const emit = defineEmits<{
    'update:selectedProvinceCode': [val: number | '']
    'update:selectedDistrictCode': [val: number | '']
    'selectAddress': [addr: Address]
}>()

// Khi user chọn địa chỉ từ Goong trong form nhập tay
const handleGoongSelected = (detail: GoongAddressDetail | null) => {
    if (!detail) {
        props.form.latitude  = null
        props.form.longitude = null
        return
    }
    props.form.latitude  = detail.latitude
    props.form.longitude = detail.longitude
}
</script>

<template>
    <section class="bg-white border border-border-light rounded-xl p-6 md:p-8 space-y-6">
        <h2 class="text-sm font-bold uppercase tracking-widest text-fashion-black font-display flex items-center gap-2">
            <span class="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-[11px] font-bold shrink-0">1</span>
            Thông tin giao hàng
        </h2>

        <!-- ── Địa chỉ đã lưu ──────────────────────────────────── -->
        <div v-if="savedAddresses.length > 0" class="space-y-3">
            <p class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                Địa chỉ đã lưu
            </p>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                    v-for="addr in savedAddresses"
                    :key="addr.address_id"
                    type="button"
                    @click="emit('selectAddress', addr)"
                    :class="[
                        'relative text-left rounded-xl border-2 px-4 py-3.5 transition-all duration-200 group',
                        selectedAddressId === addr.address_id
                            ? 'border-primary bg-primary/5 shadow-sm'
                            : 'border-border-light hover:border-primary/40 hover:bg-gray-50/60'
                    ]"
                >
                    <!-- Badge mặc định -->
                    <span
                        v-if="addr.is_default"
                        class="absolute top-2.5 right-3 text-[9px] font-bold uppercase tracking-wider bg-primary text-white px-2 py-0.5 rounded-full"
                    >Mặc định</span>

                    <!-- Tick chọn -->
                    <span
                        v-if="selectedAddressId === addr.address_id"
                        class="absolute top-2.5 right-3 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                        :class="{ 'right-[72px]': addr.is_default }"
                    >
                        <span class="material-symbols-outlined text-white text-[14px]" style="font-variation-settings:'FILL' 1">check</span>
                    </span>

                    <p class="text-sm font-semibold text-fashion-black pr-16 leading-snug">{{ addr.recipient_name }}</p>
                    <p class="text-xs text-text-muted mt-0.5">{{ addr.phone }}</p>
                    <p class="text-xs text-text-muted mt-1 leading-relaxed line-clamp-2">
                        {{ addr.street_address }}, {{ addr.ward }}, {{ addr.district }}, {{ addr.province }}
                    </p>
                </button>
            </div>

            <!-- Divider -->
            <div class="flex items-center gap-3 pt-1">
                <div class="flex-grow h-px bg-border-light"></div>
                <span class="text-[10px] uppercase tracking-widest text-text-muted font-display shrink-0">hoặc nhập địa chỉ khác</span>
                <div class="flex-grow h-px bg-border-light"></div>
            </div>
        </div>

        <!-- ── Form nhập tay ───────────────────────────────────── -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
            <!-- Họ tên -->
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

            <!-- SĐT -->
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
                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                    Tỉnh / Thành phố <span class="text-red-400">*</span>
                </label>
                <select
                    :value="selectedProvinceCode"
                    @change="emit('update:selectedProvinceCode', Number(($event.target as HTMLSelectElement).value) || '')"
                    required
                    class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white font-display"
                >
                    <option value="" disabled>{{ form.province || 'Chọn Tỉnh / Thành phố' }}</option>
                    <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                </select>
            </div>

            <!-- Quận / Huyện -->
            <div class="space-y-1.5">
                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                    Quận / Huyện <span class="text-red-400">*</span>
                </label>
                <select
                    :value="selectedDistrictCode"
                    @change="emit('update:selectedDistrictCode', Number(($event.target as HTMLSelectElement).value) || '')"
                    :disabled="selectedProvinceCode === '' && !form.district"
                    required
                    class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white font-display disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="" disabled>{{ form.district || 'Chọn Quận / Huyện' }}</option>
                    <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
                </select>
            </div>

            <!-- Phường / Xã -->
            <div class="space-y-1.5">
                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                    Phường / Xã <span class="text-red-400">*</span>
                </label>
                <select
                    v-model="form.ward"
                    :disabled="selectedDistrictCode === '' && !form.ward"
                    required
                    class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors bg-white font-display disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <option value="" disabled>{{ form.ward || 'Chọn Phường / Xã' }}</option>
                    <option v-for="w in wards" :key="w.code" :value="w.name">{{ w.name }}</option>
                </select>
            </div>

            <!-- Địa chỉ cụ thể -->
            <div class="space-y-1.5 md:col-span-2">
                <GoongAddressInput v-model="form.street_address" @selected="handleGoongSelected" />
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
