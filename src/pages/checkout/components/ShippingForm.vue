<script setup lang="ts">
import { ref, watch } from 'vue'
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

const acceptedStreetAddress = ref(props.form.street_address)
const isManualMode = ref(false)

function parseVietnameseAddress(formatted: string): { province: string; district: string; ward: string } {
    const cleaned = formatted.replace(/,?\s*Việt Nam\s*$/i, '').trim()
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean)
    const len = parts.length

    return {
        province: len >= 1 ? (parts[len - 1] ?? '') : '',
        district: len >= 2 ? (parts[len - 2] ?? '') : '',
        ward:     len >= 3 ? (parts[len - 3] ?? '') : '',
    }
}

function extractStreetAddress(formatted: string): string {
    const cleaned = formatted.replace(/,?\s*Việt Nam\s*$/i, '').trim()
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean)

    if (parts.length <= 3) {
        return parts[0] ?? cleaned
    }

    return parts.slice(0, parts.length - 3).join(', ')
}

// Khi user chọn địa chỉ từ Goong trong form nhập tay
const handleGoongSelected = (detail: GoongAddressDetail | null) => {
    if (!detail) {
        acceptedStreetAddress.value = ''
        props.form.province  = ''
        props.form.district  = ''
        props.form.ward      = ''
        props.form.latitude  = null
        props.form.longitude = null
        isManualMode.value = true
        emit('update:selectedProvinceCode', '')
        emit('update:selectedDistrictCode', '')
        return
    }

    const addr = detail.formatted_address || detail.name || props.form.street_address
    const parsed = parseVietnameseAddress(addr)
    const streetAddress = extractStreetAddress(addr)

    acceptedStreetAddress.value = streetAddress || addr
    props.form.street_address = streetAddress || addr
    props.form.province  = parsed.province
    props.form.district  = parsed.district
    props.form.ward      = parsed.ward
    props.form.latitude  = detail.latitude
    props.form.longitude = detail.longitude
    isManualMode.value = false
    emit('update:selectedProvinceCode', '')
    emit('update:selectedDistrictCode', '')
}

watch(() => props.selectedAddressId, (id) => {
    if (id !== null) {
        acceptedStreetAddress.value = props.form.street_address
        isManualMode.value = false
    }
})

watch(() => props.form.street_address, (value) => {
    if (props.selectedAddressId !== null) {
        acceptedStreetAddress.value = value
        return
    }

    if (!value) {
        acceptedStreetAddress.value = ''
    }

    if (value === acceptedStreetAddress.value) {
        return
    }

    props.form.province  = ''
    props.form.district  = ''
    props.form.ward      = ''
    props.form.latitude  = null
    props.form.longitude = null
    emit('update:selectedProvinceCode', '')
    emit('update:selectedDistrictCode', '')
})
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

            <!-- Địa chỉ cụ thể -->
            <div class="space-y-1.5 md:col-span-2">
                <GoongAddressInput
                    v-model="form.street_address"
                    label="Địa chỉ giao hàng"
                    placeholder="Nhập số nhà, tên đường hoặc tên địa điểm..."
                    helper-text="Chọn địa chỉ từ gợi ý Goong để tính khoảng cách và phí vận chuyển chính xác."
                    :latitude="form.latitude"
                    :longitude="form.longitude"
                    :province="form.province"
                    :district="form.district"
                    :ward="form.ward"
                    @selected="handleGoongSelected"
                />
            </div>

            <!-- Chọn khu vực thủ công nếu không có gợi ý phù hợp -->
            <div v-if="!form.province && !isManualMode && selectedAddressId === null" class="md:col-span-2 text-right">
                <button 
                    type="button" 
                    @click="isManualMode = true"
                    class="text-xs font-semibold text-primary hover:text-primary-dark transition-colors font-display underline"
                >
                    Chọn khu vực thủ công
                </button>
            </div>

            <!-- Đã nhận diện khu vực từ Goong -->
            <div v-if="form.province && !isManualMode" class="md:col-span-2 rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                <div class="flex items-start justify-between gap-3">
                    <div class="flex items-start gap-3">
                        <span class="material-symbols-outlined mt-0.5 text-primary text-[19px] shrink-0" style="font-variation-settings:'FILL' 1">verified</span>
                        <div class="min-w-0">
                            <p class="text-[10px] uppercase tracking-widest font-bold text-primary font-display">Khu vực giao hàng</p>
                            <p class="mt-1 text-sm text-fashion-black font-display leading-relaxed">
                                {{ [form.ward, form.district, form.province].filter(Boolean).join(', ') }}
                            </p>
                            <p v-if="form.latitude && form.longitude" class="mt-1 text-[11px] text-text-muted font-display">
                                Đã có tọa độ để tính phí vận chuyển theo khoảng cách.
                            </p>
                        </div>
                    </div>
                    <button 
                        v-if="selectedAddressId === null"
                        type="button" 
                        @click="isManualMode = true"
                        class="text-xs font-semibold text-primary hover:text-primary-dark transition-colors font-display shrink-0 underline"
                    >
                        Sửa khu vực
                    </button>
                </div>
            </div>

            <!-- Chọn khu vực thủ công (khi Goong không tìm được hoặc khi user muốn tự chỉnh sửa) -->
            <div v-if="isManualMode && selectedAddressId === null" class="md:col-span-2 space-y-4 bg-gray-50/50 p-5 rounded-xl border border-border-light animate-in fade-in slide-in-from-top-1 duration-150">
                <div class="flex items-center justify-between border-b border-border-light pb-2 mb-2">
                    <span class="text-[10px] uppercase tracking-widest font-bold text-fashion-black font-display">Chọn khu vực thủ công</span>
                    <button 
                        v-if="form.province && form.district && form.ward"
                        type="button" 
                        @click="isManualMode = false"
                        class="text-[10px] uppercase tracking-widest font-bold text-primary hover:text-primary-dark transition-colors font-display underline"
                    >
                        Quay lại nhận diện
                    </button>
                </div>
                
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <!-- Tỉnh/Thành -->
                    <div class="space-y-1.5">
                        <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Tỉnh/Thành phố *</label>
                        <select 
                            :value="selectedProvinceCode"
                            @change="e => {
                                const val = (e.target as HTMLSelectElement).value;
                                emit('update:selectedProvinceCode', val ? Number(val) : '');
                            }"
                            class="w-full border border-border-light rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary bg-white font-display"
                        >
                            <option value="">-- Chọn Tỉnh --</option>
                            <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                        </select>
                    </div>

                    <!-- Quận/Huyện -->
                    <div class="space-y-1.5">
                        <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Quận/Huyện *</label>
                        <select 
                            :value="selectedDistrictCode"
                            @change="e => {
                                const val = (e.target as HTMLSelectElement).value;
                                emit('update:selectedDistrictCode', val ? Number(val) : '');
                            }"
                            :disabled="!selectedProvinceCode"
                            class="w-full border border-border-light rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary bg-white font-display disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="">-- Chọn Huyện --</option>
                            <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
                        </select>
                    </div>

                    <!-- Phường/Xã -->
                    <div class="space-y-1.5">
                        <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Phường/Xã *</label>
                        <select 
                            v-model="form.ward"
                            :disabled="!selectedDistrictCode"
                            class="w-full border border-border-light rounded-lg px-3 py-2.5 text-sm outline-none focus:border-primary bg-white font-display disabled:bg-gray-100 disabled:text-gray-400"
                        >
                            <option value="">-- Chọn Xã --</option>
                            <option v-for="w in wards" :key="w.code" :value="w.name">{{ w.name }}</option>
                        </select>
                    </div>
                </div>
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
