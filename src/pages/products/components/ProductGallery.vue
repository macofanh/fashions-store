<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { getImageUrl } from '@/lib/urlHelper'

const props = defineProps<{
    images: { image_id: number; image_url: string; is_primary: boolean; color_id?: number | null }[]
    productName: string
    selectedColorId?: number | null
}>()

const activeImage = ref('')

const filteredImages = computed(() => {
    if (!props.selectedColorId) {
        return props.images
    }

    const hasColorImages = props.images.some(i => i.color_id === props.selectedColorId)
    if (!hasColorImages) {
        return props.images
    }

    return props.images.filter(i => !i.color_id || i.color_id === props.selectedColorId)
})

watch(
    filteredImages,
    (imgs) => {
        if (imgs?.length > 0) {
            const primary = imgs.find(i => i.color_id === props.selectedColorId && i.is_primary)
                || imgs.find(i => i.color_id === props.selectedColorId)
                || imgs.find(i => i.is_primary)
                || imgs[0]
            if (primary) {
                activeImage.value = getImageUrl(primary.image_url)
            }
        }
    },
    { immediate: true }
)
</script>

<template>
    <div class="w-full lg:w-[55%] flex flex-col md:flex-row gap-3">
        <!-- Thumbnails -->
        <div class="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible w-full md:w-[72px] shrink-0 order-2 md:order-1 py-1 md:py-0 scrollbar-none">
            <button
                v-for="(img, idx) in filteredImages"
                :key="img.image_id || idx"
                @click="activeImage = getImageUrl(img.image_url)"
                :class="[
                    'w-[60px] md:w-full aspect-[3/4] overflow-hidden rounded-lg border-2 transition-all shrink-0',
                    activeImage === getImageUrl(img.image_url)
                        ? 'border-black shadow-md scale-105'
                        : 'border-transparent hover:border-border-light'
                ]"
            >
                <img :src="getImageUrl(img.image_url)" class="w-full h-full object-cover" :alt="`${productName} ${idx + 1}`" />
            </button>
        </div>

        <!-- Main image -->
        <div class="flex-grow aspect-[3/4] bg-white rounded-xl overflow-hidden border border-border-light shadow-sm order-1 md:order-2">
            <img :src="activeImage" class="w-full h-full object-cover" :alt="productName" />
        </div>
    </div>
</template>
