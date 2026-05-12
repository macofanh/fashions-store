<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
    close: []
    submit: [data: { rating: number; title: string; content: string; files: File[] }]
}>()

const form = ref({ rating: 5, title: '', content: '', files: [] as File[] })
const previews = ref<string[]>([])
const errors = ref({ title: '', content: '' })
const isSubmitting = ref(false)

const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (!target.files) return
    form.value.files = Array.from(target.files)
    // Generate previews
    previews.value = []
    form.value.files.forEach(file => {
        const reader = new FileReader()
        reader.onload = (ev) => {
            if (ev.target?.result) previews.value.push(ev.target.result as string)
        }
        reader.readAsDataURL(file)
    })
}

const removeFile = (idx: number) => {
    form.value.files = form.value.files.filter((_, i) => i !== idx)
    previews.value = previews.value.filter((_, i) => i !== idx)
}

const validate = () => {
    errors.value = { title: '', content: '' }
    return true  // title và content là optional theo backend schema
}

const handleSubmit = async () => {
    if (!validate()) return
    isSubmitting.value = true
    try {
        emit('submit', { ...form.value })
    } finally {
        isSubmitting.value = false
    }
}
</script>

<template>
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-fashion-black/60 backdrop-blur-sm">
        <div class="bg-white w-full max-w-xl rounded-xl shadow-2xl p-8 space-y-6 max-h-[90vh] overflow-y-auto">
            <header class="flex justify-between items-center">
                <h2 class="text-2xl font-serif italic text-fashion-black">Chia sẻ cảm nhận</h2>
                <button @click="emit('close')"
                    class="w-8 h-8 flex items-center justify-center rounded-full hover:bg-border-light transition-colors">
                    <span class="material-symbols-outlined text-text-muted">close</span>
                </button>
            </header>

            <div class="space-y-5">
                <!-- Stars -->
                <div class="space-y-2">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                        Đánh giá sao <span class="text-red-500">*</span>
                    </label>
                    <div class="flex gap-1">
                        <button v-for="i in 5" :key="i" @click="form.rating = i" type="button">
                            <span class="material-symbols-outlined text-amber-400 text-2xl"
                                :style="i <= form.rating ? 'font-variation-settings:\'FILL\' 1' : ''">star</span>
                        </button>
                    </div>
                </div>

                <!-- Title -->
                <div class="space-y-1.5">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                        Tiêu đề
                        <span class="normal-case tracking-normal text-text-muted/60 font-normal ml-1">(không bắt buộc)</span>
                    </label>
                    <input v-model="form.title" type="text"
                        class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-display"
                        placeholder="Rất hài lòng / Chất vải đẹp..." />
                </div>

                <!-- Content -->
                <div class="space-y-1.5">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                        Nội dung
                        <span class="normal-case tracking-normal text-text-muted/60 font-normal ml-1">(không bắt buộc)</span>
                    </label>
                    <textarea v-model="form.content" rows="4"
                        class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none font-display"
                        placeholder="Hãy chia sẻ trải nghiệm của bạn..."></textarea>
                </div>

                <!-- Images (optional) -->
                <div class="space-y-2">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">
                        Hình ảnh thực tế
                        <span class="normal-case tracking-normal text-text-muted/60 font-normal ml-1">(không bắt buộc)</span>
                    </label>

                    <!-- Upload area -->
                    <label class="flex flex-col items-center justify-center w-full h-24 border-2 border-dashed border-border-light rounded-lg cursor-pointer hover:border-primary hover:bg-primary/5 transition-all">
                        <span class="material-symbols-outlined text-text-muted text-2xl">add_photo_alternate</span>
                        <span class="text-[10px] text-text-muted font-display mt-1">Chọn ảnh (tối đa 5 ảnh)</span>
                        <input type="file" multiple accept="image/*" class="hidden" @change="handleFileChange" />
                    </label>

                    <!-- Previews -->
                    <div v-if="previews.length" class="flex flex-wrap gap-2 mt-2">
                        <div v-for="(src, idx) in previews" :key="idx"
                            class="relative w-16 h-16 rounded-lg overflow-hidden border border-border-light group">
                            <img :src="src" class="w-full h-full object-cover" />
                            <button
                                type="button"
                                @click="removeFile(idx)"
                                class="absolute inset-0 bg-fashion-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <span class="material-symbols-outlined text-white text-sm">close</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <button
                @click="handleSubmit"
                :disabled="isSubmitting"
                class="w-full bg-primary text-white py-3.5 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary-dark transition-all font-display disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                <span v-if="isSubmitting" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                {{ isSubmitting ? 'Đang gửi...' : 'Gửi đánh giá' }}
            </button>
        </div>
    </div>
</template>
