<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { goongService, type GoongAddressDetail, type GoongAddressSuggestion } from '@/lib/goongService'

const props = withDefaults(defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    required?: boolean
    helperText?: string
    latitude?: number | null
    longitude?: number | null
    province?: string
    district?: string
    ward?: string
}>(), {
    label: 'Địa chỉ cụ thể',
    placeholder: 'Nhập số nhà, tên đường hoặc địa điểm...',
    required: true,
    helperText: 'Chọn một gợi ý để xem bản đồ vị trí.',
    latitude: null,
    longitude: null,
    province: '',
    district: '',
    ward: '',
})

const emit = defineEmits<{
    (event: 'update:modelValue', value: string): void
    (event: 'selected', value: GoongAddressDetail | null): void
}>()

const inputValue = ref(props.modelValue)
const suggestions = ref<GoongAddressSuggestion[]>([])
const isLoading = ref(false)
const isOpen = ref(false)
const selectedDetail = ref<GoongAddressDetail | null>(null)
const mapLoadFailed = ref(false)
const suppressSearchOnce = ref(false)
let debounceTimer: number | undefined

const mapPreviewUrl = computed(() => selectedDetail.value?.static_map_url || '')
const mapLink = computed(() => {
    if (selectedDetail.value?.map_url) {
        return selectedDetail.value.map_url
    }
    const fullAddress = [props.modelValue, props.ward, props.district, props.province]
        .filter(Boolean)
        .join(', ')
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(fullAddress)}`
})
const mapEmbedUrl = computed(() => {
    if (selectedDetail.value) {
        return `https://www.google.com/maps?q=${selectedDetail.value.latitude},${selectedDetail.value.longitude}&z=16&output=embed`
    }
    if (props.latitude && props.longitude) {
        return `https://www.google.com/maps?q=${props.latitude},${props.longitude}&z=16&output=embed`
    }
    const fullAddress = [props.modelValue, props.ward, props.district, props.province]
        .filter(Boolean)
        .join(', ')
    if (props.province) {
        return `https://www.google.com/maps?q=${encodeURIComponent(fullAddress)}&z=16&output=embed`
    }
    return ''
})
const showMapPreview = computed(() => {
    return !!selectedDetail.value || (!!props.latitude && !!props.longitude) || !!props.province
})
const resolvedAddressText = computed(() => {
    if (selectedDetail.value) {
        return selectedDetail.value.formatted_address || selectedDetail.value.name || inputValue.value
    }
    return [props.modelValue, props.ward, props.district, props.province].filter(Boolean).join(', ') || inputValue.value
})

watch(
    () => props.modelValue,
    (value) => {
        if (value !== inputValue.value) {
            inputValue.value = value
        }
    }
)

watch(inputValue, (value) => {
    emit('update:modelValue', value)

    if (suppressSearchOnce.value) {
        suppressSearchOnce.value = false
        suggestions.value = []
        isOpen.value = false
        return
    }

    if (selectedDetail.value && value !== selectedDetail.value.formatted_address && value !== selectedDetail.value.name) {
        selectedDetail.value = null
        emit('selected', null)
    }

    window.clearTimeout(debounceTimer)

    if (!value || value.trim().length < 2) {
        suggestions.value = []
        return
    }

    debounceTimer = window.setTimeout(async () => {
        isLoading.value = true
        try {
            const response = await goongService.searchSuggestions(value.trim())
            suggestions.value = response.data
            isOpen.value = true
        } catch (error) {
            console.error('Lỗi lấy gợi ý địa chỉ Goong:', error)
            suggestions.value = []
        } finally {
            isLoading.value = false
        }
    }, 300)
})

const selectSuggestion = async (suggestion: GoongAddressSuggestion) => {
    mapLoadFailed.value = false

    try {
        const response = await goongService.getDetail(suggestion.place_id)
        selectedDetail.value = response.data

        if (response.data.formatted_address) {
            suppressSearchOnce.value = true
            inputValue.value = response.data.formatted_address
            emit('update:modelValue', response.data.formatted_address)
        } else {
            suppressSearchOnce.value = true
            inputValue.value = suggestion.description
            emit('update:modelValue', suggestion.description)
        }

        emit('selected', response.data)
        suggestions.value = []
        isOpen.value = false
    } catch (error) {
        console.error('Lỗi lấy chi tiết địa chỉ Goong:', error)
        selectedDetail.value = null
        emit('selected', null)
    }
}

const handleBlur = () => {
    window.setTimeout(() => {
        isOpen.value = false
    }, 150)
}

const clearAddress = () => {
    selectedDetail.value = null
    suggestions.value = []
    inputValue.value = ''
    emit('update:modelValue', '')
    emit('selected', null)
}

onBeforeUnmount(() => {
    window.clearTimeout(debounceTimer)
})
</script>

<template>
    <div class="relative space-y-2.5">
        <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
            {{ label }} <span v-if="required" class="text-red-400">*</span>
        </label>

        <div
            :class="[
                'relative rounded-xl border bg-white shadow-sm transition-all',
                selectedDetail
                    ? 'border-primary/45 ring-4 ring-primary/10'
                    : 'border-border-light focus-within:border-primary focus-within:ring-4 focus-within:ring-primary/10'
            ]"
        >
            <span
                class="material-symbols-outlined absolute left-3.5 top-1/2 -translate-y-1/2 text-[20px] pointer-events-none"
                :class="selectedDetail ? 'text-primary' : 'text-text-muted'"
                style="font-variation-settings:'FILL' 1"
            >location_on</span>

            <input
                v-model="inputValue"
                :required="required"
                type="text"
                :placeholder="placeholder"
                @focus="isOpen = true"
                @blur="handleBlur"
                class="w-full rounded-xl bg-transparent py-3.5 pl-11 pr-20 text-sm text-fashion-black outline-none placeholder:text-text-muted/70 font-display"
            />

            <div class="absolute right-3 top-1/2 flex -translate-y-1/2 items-center gap-2">
                <button
                    v-if="inputValue && !isLoading"
                    type="button"
                    @mousedown.prevent="clearAddress"
                    class="flex h-6 w-6 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-gray-100 hover:text-fashion-black"
                    aria-label="Xóa địa chỉ"
                >
                    <span class="material-symbols-outlined text-[16px]">close</span>
                </button>
                <span v-if="isLoading" class="material-symbols-outlined text-zinc-300 text-[18px] animate-spin">
                    progress_activity
                </span>
                <span v-else-if="selectedDetail" class="material-symbols-outlined text-primary text-[18px]" style="font-variation-settings:'FILL' 1">
                    check_circle
                </span>
            </div>
        </div>

        <p class="text-[11px] text-text-muted font-display leading-relaxed">{{ helperText }}</p>

        <div
            v-if="isOpen && suggestions.length > 0"
            class="absolute z-20 mt-2 w-full max-h-72 overflow-auto rounded-xl border border-border-light bg-white shadow-2xl"
        >
            <button
                v-for="item in suggestions"
                :key="item.place_id"
                type="button"
                @mousedown.prevent="selectSuggestion(item)"
                class="group flex w-full gap-3 border-b border-border-light px-4 py-3.5 text-left transition-colors last:border-b-0 hover:bg-gray-50"
            >
                <span class="material-symbols-outlined mt-0.5 text-[18px] text-text-muted transition-colors group-hover:text-primary">near_me</span>
                <span class="min-w-0">
                    <span class="block text-sm font-semibold text-fashion-black line-clamp-2 font-display">{{ item.description }}</span>
                    <span v-if="item.main_text || item.secondary_text" class="mt-1 block text-[11px] text-text-muted font-display">
                        <span v-if="item.main_text">{{ item.main_text }}</span>
                        <span v-if="item.secondary_text"> · {{ item.secondary_text }}</span>
                    </span>
                </span>
            </button>
        </div>

        <div v-if="showMapPreview" class="mt-4 space-y-3 rounded-xl border border-border-light bg-gray-50/70 p-4">
            <div class="flex items-start justify-between gap-3">
                <div class="min-w-0">
                    <p class="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-1 font-display">Vị trí đã chọn</p>
                    <p class="text-sm font-semibold text-fashion-black leading-relaxed font-display">
                        {{ resolvedAddressText }}
                    </p>
                </div>
                <a
                    v-if="mapLink"
                    :href="mapLink"
                    target="_blank"
                    rel="noreferrer"
                    class="shrink-0 rounded-full border border-border-light bg-white px-3 py-1.5 text-[10px] uppercase tracking-wider font-bold text-fashion-black transition-colors hover:border-primary hover:text-primary font-display"
                >
                    Mở Maps
                </a>
            </div>

            <div class="overflow-hidden rounded-xl border border-border-light bg-white">
                <iframe
                    v-if="mapEmbedUrl && !mapLoadFailed"
                    :src="mapEmbedUrl"
                    title="Bản đồ vị trí"
                    class="h-52 w-full border-0"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    @error="mapLoadFailed = true"
                ></iframe>
                <div v-else class="flex h-52 w-full items-center justify-center bg-gray-50 text-center px-6">
                    <div>
                        <p class="text-xs uppercase tracking-widest font-bold text-text-muted mb-2 font-display">Không tải được bản đồ</p>
                        <p class="text-sm text-text-muted font-display">Mở Google Maps để xem vị trí chính xác.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
