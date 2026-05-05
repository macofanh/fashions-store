<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{
    close: []
    submit: [data: { rating: number; title: string; content: string; files: File[] }]
}>()

const form = ref({ rating: 5, title: '', content: '', files: [] as File[] })

const handleFileChange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files) form.value.files = Array.from(target.files)
}

const handleSubmit = () => {
    emit('submit', { ...form.value })
}
</script>

<template>
    <div class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-fashion-black/60 backdrop-blur-sm">
        <div class="bg-white w-full max-w-xl rounded-xl shadow-2xl p-8 space-y-6">
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
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Đánh giá sao</label>
                    <div class="flex gap-1">
                        <button v-for="i in 5" :key="i" @click="form.rating = i" type="button">
                            <span class="material-symbols-outlined text-amber-400 text-2xl"
                                :style="i <= form.rating ? 'font-variation-settings:\'FILL\' 1' : ''">star</span>
                        </button>
                    </div>
                </div>

                <!-- Title -->
                <div class="space-y-1.5">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Tiêu đề</label>
                    <input v-model="form.title" type="text"
                        class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors font-display"
                        placeholder="Rất hài lòng / Chất vải đẹp..." />
                </div>

                <!-- Content -->
                <div class="space-y-1.5">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Nội dung</label>
                    <textarea v-model="form.content" rows="4"
                        class="w-full border border-border-light rounded-lg px-4 py-3 text-sm outline-none focus:border-primary transition-colors resize-none font-display"
                        placeholder="Hãy chia sẻ trải nghiệm của bạn..."></textarea>
                </div>

                <!-- Images -->
                <div class="space-y-1.5">
                    <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted font-display">Hình ảnh thực tế</label>
                    <input type="file" multiple accept="image/*" @change="handleFileChange"
                        class="w-full text-sm text-text-muted font-display file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded-lg file:text-[10px] file:font-bold file:uppercase file:bg-fashion-black file:text-white hover:file:bg-zinc-800" />
                </div>
            </div>

            <button @click="handleSubmit"
                class="w-full bg-primary text-white py-3.5 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary-dark transition-all font-display">
                Gửi đánh giá
            </button>
        </div>
    </div>
</template>
