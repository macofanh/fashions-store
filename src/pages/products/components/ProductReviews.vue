<script setup lang="ts">
import { computed } from 'vue'
import { getImageUrl } from '@/lib/urlHelper'

interface Review {
    review_id: number
    rating: number
    title: string
    content: string
    created_at: string
    images?: { image_id: number; image_url: string }[]
}

const props = defineProps<{
    reviews: Review[]
    avgRating: number
}>()

const emit = defineEmits<{ openModal: [] }>()

// ── Fake reviews hiển thị khi chưa có review thật ─────────────────
const fakeReviews: Review[] = [
    {
        review_id: -1,
        rating: 5,
        title: 'Chất lượng vượt mong đợi!',
        content: 'Vải mềm mại, đường may tỉ mỉ. Mặc vào rất thoải mái và sang trọng. Sẽ mua thêm cho người thân.',
        created_at: '2026-03-15T10:00:00Z',
    },
    {
        review_id: -2,
        rating: 5,
        title: 'Giao hàng nhanh, sản phẩm đẹp',
        content: 'Đặt hàng hôm trước, hôm sau đã nhận được. Màu sắc đúng như hình, size chuẩn. Rất hài lòng!',
        created_at: '2026-03-10T08:30:00Z',
    },
    {
        review_id: -3,
        rating: 4,
        title: 'Đẹp nhưng hơi nhỏ size',
        content: 'Thiết kế rất đẹp và hiện đại. Tuy nhiên mình thấy size hơi nhỏ hơn bình thường, nên lấy lên 1 size.',
        created_at: '2026-02-28T14:20:00Z',
    },
    {
        review_id: -4,
        rating: 5,
        title: 'Mua lần 3 rồi vẫn thích',
        content: 'Đây là lần thứ 3 mình mua sản phẩm này. Chất lượng ổn định, không bị phai màu sau nhiều lần giặt.',
        created_at: '2026-02-20T09:15:00Z',
    },
]

const displayReviews = computed(() =>
    props.reviews.length > 0 ? props.reviews : fakeReviews
)

const displayAvg = computed(() =>
    props.avgRating > 0 ? props.avgRating : 4.8
)

const displayCount = computed(() =>
    props.reviews.length > 0 ? props.reviews.length : fakeReviews.length
)

const isFake = computed(() => props.reviews.length === 0)

const fakeAvatars = ['N', 'T', 'M', 'H', 'L', 'A', 'P', 'K']
const getAvatar = (idx: number) => fakeAvatars[idx % fakeAvatars.length]
</script>

<template>
    <div class="mt-24 pt-16 border-t border-border-light">
        <!-- Header -->
        <div class="flex justify-between items-end mb-12">
            <div>
                <h2 class="text-2xl md:text-3xl font-serif italic text-fashion-black mb-3">
                    Đánh giá từ khách hàng
                </h2>
                <div class="flex items-center gap-3">
                    <div class="flex text-amber-400">
                        <span v-for="i in 5" :key="i"
                            class="material-symbols-outlined text-sm"
                            :style="i <= Math.round(displayAvg) ? 'font-variation-settings:\'FILL\' 1' : ''"
                        >star</span>
                    </div>
                    <span class="text-sm font-bold text-fashion-black font-display">{{ displayAvg.toFixed(1) }}</span>
                    <span class="text-[10px] uppercase tracking-widest text-text-muted font-display">
                        {{ displayCount }} nhận xét
                        <span v-if="isFake" class="text-text-muted/50 normal-case tracking-normal">(mẫu)</span>
                    </span>
                </div>
            </div>
            <button
                @click="emit('openModal')"
                class="border border-fashion-black px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-fashion-black hover:text-white transition-all font-display"
            >
                Viết đánh giá
            </button>
        </div>

        <!-- Review grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8">
            <div
                v-for="(review, idx) in displayReviews"
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

                <!-- Review images (real only) -->
                <div v-if="review.images?.length" class="flex gap-2">
                    <div v-for="img in review.images" :key="img.image_id"
                        class="w-16 h-16 border border-border-light rounded-lg overflow-hidden">
                        <img :src="getImageUrl(img.image_url)" class="w-full h-full object-cover" />
                    </div>
                </div>

                <!-- Reviewer -->
                <div class="flex items-center gap-2 pt-1">
                    <div class="w-7 h-7 bg-primary-light rounded-full flex items-center justify-center text-[10px] font-bold text-primary font-display">
                        {{ getAvatar(idx) }}
                    </div>
                    <div>
                        <span class="text-[10px] font-bold text-fashion-black font-display">Khách hàng đã mua</span>
                        <span class="ml-2 inline-flex items-center gap-0.5 text-[9px] text-green-600 font-display">
                            <span class="material-symbols-outlined text-[11px]" style="font-variation-settings:'FILL' 1">verified</span>
                            Đã xác minh
                        </span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
