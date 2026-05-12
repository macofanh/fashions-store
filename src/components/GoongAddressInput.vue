<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { goongService, type GoongAddressDetail, type GoongAddressSuggestion } from '@/lib/goongService'

const props = withDefaults(defineProps<{
    modelValue: string
    label?: string
    placeholder?: string
    required?: boolean
    helperText?: string
}>(), {
    label: 'Địa chỉ cụ thể',
    placeholder: 'Nhập số nhà, tên đường hoặc địa điểm...',
    required: true,
    helperText: 'Chọn một gợi ý để xem bản đồ vị trí.',
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
const mapLink = computed(() => selectedDetail.value?.map_url || '')
const mapEmbedUrl = computed(() => {
    if (!selectedDetail.value) {
        return ''
    }

    return `https://www.google.com/maps?q=${selectedDetail.value.latitude},${selectedDetail.value.longitude}&z=16&output=embed`
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
        emit('selected', response.data)

        if (response.data.formatted_address) {
            suppressSearchOnce.value = true
            inputValue.value = response.data.formatted_address
            emit('update:modelValue', response.data.formatted_address)
        } else {
            suppressSearchOnce.value = true
            inputValue.value = suggestion.description
            emit('update:modelValue', suggestion.description)
        }

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

onBeforeUnmount(() => {
    window.clearTimeout(debounceTimer)
})
</script>

<template>
    <div class="space-y-2 relative">
        <label class="text-[9px] uppercase tracking-[0.2em] font-bold text-zinc-400">
            {{ label }}
        </label>

        <div class="relative">
            <input
                v-model="inputValue"
                :required="required"
                type="text"
                :placeholder="placeholder"
                @focus="isOpen = true"
                @blur="handleBlur"
                class="w-full border-b border-zinc-200 py-3 focus:border-zinc-900 outline-none text-sm font-light transition-colors pr-10"
            />
            <span v-if="isLoading" class="material-symbols-outlined absolute right-0 top-1/2 -translate-y-1/2 text-zinc-300 text-[18px] animate-spin">
                progress_activity
            </span>
        </div>

        <p class="text-[10px] text-zinc-400 italic">{{ helperText }}</p>

        <div
            v-if="isOpen && suggestions.length > 0"
            class="absolute z-20 mt-2 w-full max-h-72 overflow-auto rounded-xl border border-zinc-200 bg-white shadow-xl"
        >
            <button
                v-for="item in suggestions"
                :key="item.place_id"
                type="button"
                @mousedown.prevent="selectSuggestion(item)"
                class="w-full text-left px-4 py-3 border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50 transition-colors"
            >
                <p class="text-sm font-medium text-zinc-900 line-clamp-2">{{ item.description }}</p>
                <p v-if="item.main_text || item.secondary_text" class="text-[11px] text-zinc-400 mt-1">
                    <span v-if="item.main_text">{{ item.main_text }}</span>
                    <span v-if="item.secondary_text"> · {{ item.secondary_text }}</span>
                </p>
            </button>
        </div>

        <div v-if="selectedDetail" class="mt-4 space-y-3 rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div class="flex items-start justify-between gap-3">
                <div>
                    <p class="text-[10px] uppercase tracking-[0.3em] font-bold text-zinc-400 mb-1">Vị trí đã chọn</p>
                    <p class="text-sm font-medium text-zinc-900 leading-relaxed">
                        {{ selectedDetail.formatted_address || selectedDetail.name || inputValue }}
                    </p>
                </div>
                <a
                    v-if="mapLink"
                    :href="mapLink"
                    target="_blank"
                    rel="noreferrer"
                    class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 hover:text-zinc-500 transition-colors"
                >
                    Mở Google Maps
                </a>
            </div>

            <div class="overflow-hidden rounded-xl border border-zinc-200 bg-white">
                <iframe
                    v-if="mapEmbedUrl && !mapLoadFailed"
                    :src="mapEmbedUrl"
                    title="Bản đồ vị trí"
                    class="h-52 w-full border-0"
                    loading="lazy"
                    referrerpolicy="no-referrer-when-downgrade"
                    @error="mapLoadFailed = true"
                ></iframe>
                <div v-else class="flex h-52 w-full items-center justify-center bg-zinc-50 text-center px-6">
                    <div>
                        <p class="text-xs uppercase tracking-[0.3em] font-bold text-zinc-400 mb-2">Không tải được bản đồ</p>
                        <p class="text-sm text-zinc-600">Mở Google Maps để xem vị trí chính xác.</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>