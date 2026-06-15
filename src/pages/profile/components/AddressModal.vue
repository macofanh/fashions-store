<script setup lang="ts">
import { ref, watch } from 'vue'
import GoongAddressInput from '@/components/GoongAddressInput.vue'
import type { GoongAddressDetail } from '@/lib/goongService'

const props = defineProps<{
    mode: 'add' | 'edit'
    form: {
        recipient_name: string
        phone: string
        province: string
        district: string
        ward: string
        street_address: string
        is_default: boolean
        latitude: number | null
        longitude: number | null
    }
    provinces: any[]
    districts: any[]
    wards: any[]
    selectedProvinceCode: number | ''
    selectedDistrictCode: number | ''
    isSubmitting: boolean
}>()

const emit = defineEmits<{
    close: []
    submit: []
    'update:selectedProvinceCode': [val: number | '']
    'update:selectedDistrictCode': [val: number | '']
}>()

const acceptedStreetAddress = ref(props.form.street_address)
const isManualMode = ref(false)

// Parse địa chỉ Việt Nam từ formatted_address của Goong
// Format thường: "Số nhà Đường, Phường, Quận, Tỉnh, Việt Nam"
function parseVietnameseAddress(formatted: string): { province: string; district: string; ward: string } {
    // Bỏ ", Việt Nam" ở cuối nếu có
    const cleaned = formatted.replace(/,?\s*Việt Nam\s*$/i, '').trim()
    const parts = cleaned.split(',').map(s => s.trim()).filter(Boolean)

    // Lấy 3 phần cuối: ward, district, province
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

// Khi user chọn địa chỉ từ Goong
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
    if (!addr) return

    const parsed = parseVietnameseAddress(addr)
    const streetAddress = extractStreetAddress(addr)

    if (parsed.province) {
        acceptedStreetAddress.value = streetAddress || addr
        props.form.street_address = streetAddress || addr
        props.form.province  = parsed.province
        props.form.district  = parsed.district
        props.form.ward      = parsed.ward
        // Lưu tọa độ GPS
        props.form.latitude  = detail.latitude
        props.form.longitude = detail.longitude
        isManualMode.value = false
        // Reset cascading selects vì không cần dùng nữa
        emit('update:selectedProvinceCode', '')
        emit('update:selectedDistrictCode', '')
    }
}

watch(() => props.form.street_address, (value) => {
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
    <Teleport to="body">
        <div class="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div class="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[92vh] flex flex-col">

                <!-- Header -->
                <div class="px-8 py-5 border-b border-border-light flex justify-between items-center shrink-0">
                    <div>
                        <h2 class="text-base font-bold text-fashion-black font-display">
                            {{ mode === 'edit' ? 'Chỉnh sửa địa chỉ' : 'Thêm địa chỉ mới' }}
                        </h2>
                        <p class="text-xs text-text-muted font-display mt-0.5">
                            {{ mode === 'edit' ? 'Cập nhật thông tin địa chỉ giao hàng' : 'Điền thông tin địa chỉ giao hàng mới' }}
                        </p>
                    </div>
                    <button
                        type="button"
                        @click="emit('close')"
                        class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
                    >
                        <span class="material-symbols-outlined text-text-muted text-[20px]">close</span>
                    </button>
                </div>

                <!-- Form body -->
                <form @submit.prevent="emit('submit')" class="overflow-y-auto p-8 space-y-5">

                    <!-- Tên + SĐT -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
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
                    </div>

                    <!-- Địa chỉ chi tiết — Goong autocomplete -->
                    <GoongAddressInput
                        v-model="form.street_address"
                        label="Địa chỉ giao hàng"
                        placeholder="Nhập số nhà, tên đường hoặc tên địa điểm..."
                        helper-text="Chọn địa chỉ từ gợi ý Goong để hệ thống tự điền khu vực giao hàng."
                        :required="true"
                        :latitude="form.latitude"
                        :longitude="form.longitude"
                        :province="form.province"
                        :district="form.district"
                        :ward="form.ward"
                        @selected="handleGoongSelected"
                    />

                    <!-- Chọn khu vực thủ công nếu không có gợi ý phù hợp -->
                    <div v-if="!form.province && !isManualMode" class="text-right">
                        <button 
                            type="button" 
                            @click="isManualMode = true"
                            class="text-xs font-semibold text-primary hover:text-primary-dark transition-colors font-display underline"
                        >
                            Chọn khu vực thủ công
                        </button>
                    </div>

                    <!-- Đã nhận diện khu vực từ Goong -->
                    <div v-if="form.province && !isManualMode" class="rounded-xl border border-primary/15 bg-primary/5 px-4 py-3">
                        <div class="flex items-start justify-between gap-3">
                            <div class="flex items-start gap-3">
                                <span class="material-symbols-outlined mt-0.5 text-primary text-[19px] shrink-0" style="font-variation-settings:'FILL' 1">verified</span>
                                <div class="min-w-0">
                                    <p class="text-[10px] uppercase tracking-widest font-bold text-primary font-display">Đã nhận diện khu vực</p>
                                    <p class="mt-1 text-sm text-fashion-black font-display leading-relaxed">
                                        {{ [form.ward, form.district, form.province].filter(Boolean).join(', ') }}
                                    </p>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                @click="isManualMode = true"
                                class="text-xs font-semibold text-primary hover:text-primary-dark transition-colors font-display shrink-0 underline"
                            >
                                Sửa khu vực
                            </button>
                        </div>
                    </div>

                    <!-- Chọn khu vực thủ công (khi Goong không tìm được hoặc khi admin/user muốn tự chỉnh sửa) -->
                    <div v-if="isManualMode" class="space-y-4 bg-gray-50/50 p-5 rounded-xl border border-border-light animate-in fade-in slide-in-from-top-1 duration-150">
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

                    <!-- Đặt làm mặc định -->
                    <button
                        type="button"
                        @click="form.is_default = !form.is_default"
                        class="flex items-center gap-3 w-full text-left group select-none py-1"
                    >
                        <div :class="[
                            'w-5 h-5 rounded border-2 flex items-center justify-center transition-all shrink-0',
                            form.is_default
                                ? 'bg-primary border-primary'
                                : 'border-border-light group-hover:border-primary/60'
                        ]">
                            <span
                                v-if="form.is_default"
                                class="material-symbols-outlined text-white text-[13px]"
                                style="font-variation-settings:'FILL' 1"
                            >check</span>
                        </div>
                        <span class="text-sm text-fashion-black font-display">Đặt làm địa chỉ mặc định</span>
                    </button>

                    <!-- Actions -->
                    <div class="flex gap-3 pt-2">
                        <button
                            type="button"
                            @click="emit('close')"
                            class="flex-1 border border-border-light text-text-muted py-3 rounded-lg text-sm font-bold hover:border-fashion-black hover:text-fashion-black transition-colors font-display"
                        >
                            Hủy
                        </button>
                        <button
                            type="submit"
                            :disabled="isSubmitting || !form.province || !form.district || !form.ward || !form.street_address"
                            class="flex-1 bg-primary text-white py-3 rounded-lg text-sm font-bold hover:bg-primary-dark transition-colors font-display disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <span v-if="isSubmitting" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            {{ mode === 'edit' ? 'Lưu thay đổi' : 'Thêm địa chỉ' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </Teleport>
</template>
