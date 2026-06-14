<script setup lang="ts">
import { computed } from 'vue'
import { getImageUrl } from '@/lib/urlHelper'

interface Review {
    review_id: number
    rating: number
    title: string
    content: string
    created_at: string
    user_name?: string
    user_email?: string
    images?: { image_id: number; image_url: string }[]
}

const props = defineProps<{
    reviews: Review[]
    avgRating: number
    isLoading?: boolean
}>()

const emit = defineEmits<{ openModal: [] }>()

const displayAvg = computed(() => props.avgRating > 0 ? props.avgRating : 0)

// Rating breakdown (5→1 sao)
const ratingBreakdown = computed(() =>
    [5, 4, 3, 2, 1].map(star => {
        const count = props.reviews.filter(r => r.rating === star).length
        const pct = props.reviews.length > 0 ? (count / props.reviews.length) * 100 : 0
        return { star, count, pct }
    })
)

const getInitial = (review: Review, idx: number) => {
    if (review.user_name) return review.user_name.charAt(0).toUpperCase()
    if (review.user_email) return review.user_email.charAt(0).toUpperCase()
    return String.fromCharCode(65 + (idx % 26))
}

const getDisplayName = (review: Review) => {
    if (review.user_name) return review.user_name
    if (review.user_email) {
        const [local = '', domain = ''] = review.user_email.split('@')
        return local.slice(0, 3) + '***@' + domain
    }
    return 'Khách hàng đã mua'
}
</script>

<template>
    <div class="mt-24 pt-16 border-t border-border-light">
        <div v-if="props.isLoading" class="flex items-center justify-center py-16 text-sm text-text-muted font-display">
            Đang tải đánh giá...
        </div>

        <template v-else>
        <!-- Header -->
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-8 mb-12">
            <div class="flex flex-col sm:flex-row gap-8 items-start sm:items-center">
                <!-- Big avg -->
                <div class="text-center">
                    <div class="text-5xl font-serif font-bold text-fashion-black leading-none">
                        {{ reviews.length > 0 ? displayAvg.toFixed(1) : '—' }}
                    </div>
                    <div class="flex justify-center text-amber-400 mt-2">
                        <span v-for="i in 5" :key="i"
                            class="material-symbols-outlined text-base"
                            :style="i <= Math.round(displayAvg) ? 'font-variation-settings:\'FILL\' 1' : ''"
                        >star</span>
                    </div>
                    <div class="text-[10px] uppercase tracking-widest text-text-muted font-display mt-1">
                        {{ reviews.length }} nhận xét
                    </div>
                </div>

                <!-- Breakdown bars -->
                <div v-if="reviews.length > 0" class="space-y-1.5 min-w-[180px]">
                    <div v-for="item in ratingBreakdown" :key="item.star" class="flex items-center gap-2">
                        <span class="text-[10px] font-display text-text-muted w-3">{{ item.star }}</span>
                        <span class="material-symbols-outlined text-amber-400 text-[13px]"
                            style="font-variation-settings:'FILL' 1">star</span>
                        <div class="flex-1 h-1.5 bg-border-light rounded-full overflow-hidden">
                            <div class="h-full bg-amber-400 rounded-full transition-all duration-500"
                                :style="{ width: item.pct + '%' }"></div>
                        </div>
                        <span class="text-[10px] font-display text-text-muted w-4 text-right">{{ item.count }}</span>
                    </div>
                </div>
            </div>

            <button
                @click="emit('openModal')"
                class="border border-fashion-black px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-fashion-black hover:text-white transition-all font-display whitespace-nowrap"
            >
                Viết đánh giá
            </button>
        </div>

        <!-- Empty state -->
        <div v-if="reviews.length === 0"
            class="flex flex-col items-center justify-center py-16 text-center border border-dashed border-border-light rounded-xl">
            <span class="material-symbols-outlined text-4xl text-text-muted/40 mb-3">rate_review</span>
            <p class="text-sm text-text-muted font-display">Chưa có đánh giá nào.</p>
            <p class="text-[11px] text-text-muted/60 font-display mt-1">Hãy là người đầu tiên chia sẻ cảm nhận!</p>
        </div>

        <!-- Review grid -->
        <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div
                v-for="(review, idx) in reviews"
                :key="review.review_id"
                class="bg-white border border-border-light rounded-xl p-6 space-y-3"
            >
                <!-- Stars + date -->
                <div class="flex justify-between items-center">
                    <div class="flex text-amber-400">
                        <span v-for="i in 5" :key="i"
                            class="material-symbols-outlined text-[15px]"
                            :style="i <= review.rating ? 'font-variation-settings:\'FILL\' 1' : ''"
                        >star</span>
                    </div>
                    <span class="text-[10px] text-text-muted font-display">
                        {{ new Date(review.created_at).toLocaleDateString('vi-VN') }}
                    </span>
                </div>

                <!-- Title -->
                <h4 class="text-sm font-bold text-fashion-black font-display">{{ review.title }}</h4>

                <!-- Content -->
                <p class="text-sm text-text-muted leading-relaxed font-display">{{ review.content }}</p>

                <!-- Review images -->
                <div v-if="review.images?.length" class="flex flex-wrap gap-2">
                    <div v-for="img in review.images" :key="img.image_id"
                        class="w-16 h-16 border border-border-light rounded-lg overflow-hidden cursor-pointer hover:opacity-90 transition-opacity">
                        <img :src="getImageUrl(img.image_url)" :alt="review.title" class="w-full h-full object-cover" />
                    </div>
                </div>

                <!-- Reviewer -->
                <div class="flex items-center gap-2 pt-1">
                    <div class="w-7 h-7 bg-fashion-gray rounded-full flex items-center justify-center text-[10px] font-bold text-fashion-black font-display shrink-0">
                        {{ getInitial(review, idx) }}
                    </div>
                    <div class="flex items-center gap-2 flex-wrap">
                        <span class="text-[10px] font-bold text-fashion-black font-display">
                            {{ getDisplayName(review) }}
                        </span>
                        <span class="inline-flex items-center gap-0.5 text-[9px] text-green-600 font-display">
                            <span class="material-symbols-outlined text-[11px]" style="font-variation-settings:'FILL' 1">verified</span>
                            Đã xác minh
                        </span>
                    </div>
                </div>
            </div>
        </div>
        </template>
    </div>
</template>
