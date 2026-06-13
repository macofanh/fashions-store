<script setup lang="ts">
import { ref, watch } from 'vue'

const props = defineProps<{
    isOpen: boolean
    initialHeight?: number | null
    initialWeight?: number | null
    isSaving: boolean
}>()

const emit = defineEmits<{
    save: [measurements: { height_cm: number; weight_kg: number }]
    defer: []
}>()

const height = ref<number | null>(null)
const weight = ref<number | null>(null)
const errorMessage = ref('')

watch(
    () => props.isOpen,
    (isOpen) => {
        if (!isOpen) return
        height.value = props.initialHeight ?? null
        weight.value = props.initialWeight ?? null
        errorMessage.value = ''
    },
    { immediate: true }
)

const handleSubmit = () => {
    if (height.value === null || weight.value === null) {
        errorMessage.value = 'Vui lòng nhập đầy đủ chiều cao và cân nặng.'
        return
    }

    if (height.value < 100 || height.value > 250) {
        errorMessage.value = 'Chiều cao cần nằm trong khoảng 100 - 250 cm.'
        return
    }

    if (weight.value < 25 || weight.value > 300) {
        errorMessage.value = 'Cân nặng cần nằm trong khoảng 25 - 300 kg.'
        return
    }

    errorMessage.value = ''
    emit('save', {
        height_cm: height.value,
        weight_kg: weight.value,
    })
}
</script>

<template>
    <Teleport to="body">
        <Transition name="measurements-modal">
            <div
                v-if="isOpen"
                class="fixed inset-0 z-[250] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
                role="dialog"
                aria-modal="true"
                aria-labelledby="measurements-modal-title"
            >
                <div class="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl">
                    <div class="border-b border-border-light px-6 py-5">
                        <div class="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                            <span class="material-symbols-outlined">straighten</span>
                        </div>
                        <h2 id="measurements-modal-title" class="text-xl font-bold text-fashion-black">
                            Thêm số đo của bạn
                        </h2>
                        <p class="mt-1 text-sm leading-relaxed text-text-muted">
                            Thông tin này sẽ giúp chúng tôi gợi ý trang phục phù hợp với bạn nhanh hơn.
                        </p>
                    </div>

                    <form class="space-y-5 px-6 py-5" @submit.prevent="handleSubmit">
                        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                            <div class="space-y-2">
                                <label for="measurement-height" class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                    Chiều cao
                                </label>
                                <div class="relative">
                                    <input
                                        id="measurement-height"
                                        v-model.number="height"
                                        type="number"
                                        min="100"
                                        max="250"
                                        step="1"
                                        class="w-full rounded-xl border border-border-light px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        placeholder="170"
                                    />
                                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">cm</span>
                                </div>
                            </div>

                            <div class="space-y-2">
                                <label for="measurement-weight" class="text-xs font-semibold uppercase tracking-wider text-text-muted">
                                    Cân nặng
                                </label>
                                <div class="relative">
                                    <input
                                        id="measurement-weight"
                                        v-model.number="weight"
                                        type="number"
                                        min="25"
                                        max="300"
                                        step="0.1"
                                        class="w-full rounded-xl border border-border-light px-4 py-3 pr-12 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/10"
                                        placeholder="60"
                                    />
                                    <span class="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-text-muted">kg</span>
                                </div>
                            </div>
                        </div>

                        <p v-if="errorMessage" class="text-sm text-red-500">{{ errorMessage }}</p>

                        <div class="flex flex-col-reverse gap-3 pt-1 sm:flex-row sm:justify-end">
                            <button
                                type="button"
                                class="rounded-xl px-5 py-3 text-sm font-semibold text-text-muted transition-colors hover:bg-border-light hover:text-fashion-black"
                                :disabled="isSaving"
                                @click="emit('defer')"
                            >
                                Để sau
                            </button>
                            <button
                                type="submit"
                                class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                                :disabled="isSaving"
                            >
                                <span v-if="isSaving" class="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></span>
                                {{ isSaving ? 'Đang lưu...' : 'Xác nhận' }}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </Transition>
    </Teleport>
</template>

<style scoped>
.measurements-modal-enter-active,
.measurements-modal-leave-active {
    transition: opacity 0.2s ease;
}

.measurements-modal-enter-from,
.measurements-modal-leave-to {
    opacity: 0;
}
</style>
