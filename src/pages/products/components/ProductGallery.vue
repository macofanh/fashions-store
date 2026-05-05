<script setup lang="ts">
import { ref, watch } from 'vue'
import { getImageUrl } from '@/lib/urlHelper'

const props = defineProps<{
    images: { image_id: number; image_url: string; is_primary: boolean }[]
    productName: string
}>()

const activeImage = ref('')

watch(
    () => props.images,
    (imgs) => {
        if (imgs?.length > 0) {
            const primary = imgs.find(i => i.is_primary) || imgs[0]
            activeImage.value = getImageUrl(primary.image_url)
        }
    },
    { immediate: true }
)
</script>

<template>
    <div class="w-full lg:w-[55%] flex gap-3">
        <!-- Thumbnails -->
        <div class="hidden md:flex flex-col gap-2 w-[72px] shrink-0">
            <button
                v-for="(img, idx) in images"
                :key="idx"
                @click="activeImage = getImageUrl(img.image_url)"
                :class="[
                    'aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all',
                    activeImage === getImageUrl(img.image_url)
                        ? 'border-primary shadow-md'
                        : 'border-transparent hover:border-border-light'
                ]"
            >
                <img :src="getImageUrl(img.image_url)" class="w-full h-full object-cover" :alt="`${productName} ${idx + 1}`" />
            </button>
        </div>

        <!-- Main image -->
        <div class="flex-grow aspect-[3/4] bg-white rounded-xl overflow-hidden border border-border-light shadow-sm">
            <img :src="activeImage" class="w-full h-full object-cover" :alt="productName" />
        </div>
    </div>
</template>
