<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const exploreCollection = (collectionId: string) => {
    console.log('Khám phá bộ sưu tập:', collectionId)
    // Phục vụ filter sản phẩm sau này: router.push({ path: '/products', query: { collection: collectionId } })
}
</script>

<template>
    <section class="px-6 py-10 md:px-10 lg:px-16 bg-white">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div
                @click="exploreCollection('urban-essentials')"
                class="relative h-[400px] md:h-[500px] overflow-hidden group rounded-lg cursor-pointer"
            >
                <div
                    class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style="
                        background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuA1l307Hg8-JFEAbfVIPIECrnTiBGxxeo5fuvh2v6WKYNPE5lUI8mrXM0bTTa4bLHvhJF_iMXWwIgTo5lFHqMJxoRisPEX5imPrQ73k5uKAha_mUUKMaLzeCuXuqQwLXDTNl3u2hOzoQId1a9TJe3Sm4jfjeZjEXR6swbtv2rWTJiJ9Ehaw6CQCXQbnyevvAGkbqkzGcTJo3udF9of-FBOT5Ha5PzWj562xGPnB3uSzEd_1O29j9whnTe-OIplXlOAlVxHbRmTJoSVW');
                    "
                ></div>
                <div
                    class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"
                ></div>
                <div class="absolute bottom-8 left-8 text-white">
                    <h3 class="text-3xl font-serif mb-2">Urban Essentials</h3>
                    <p class="mb-4 text-sm opacity-90">
                        Effortless style for the modern city life.
                    </p>
                    <span
                        class="inline-block border-b border-white pb-1 text-sm font-bold uppercase tracking-wider hover:text-[#17b0cf] hover:border-[#17b0cf] transition-colors"
                        >Explore</span
                    >
                </div>
            </div>

            <div
                @click="exploreCollection('accessories')"
                class="relative h-[400px] md:h-[500px] overflow-hidden group rounded-lg cursor-pointer"
            >
                <div
                    class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                    style="
                        background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBxFp_d_cCHS6k5k4fjaNjYO3sawG0sDnfNn07Zozcg-NnvKjC8v55sv228ERnH4wV-1-Mam8rOgGDHFCm8HGNBI0e2Aj-Ho92XMN_UWnsM5NAvsHw-m3QqTYAQENEB1x-NzJWMR0q2E_XVOaWn8wWfNw5uO0zTwowInKKnkJRey2xTja_bQxiJBKl9tyNkor2aXv5P5IgpBKBuFutdy2Ba6IUbwbPiHHq_2-_2_5-sMx1vAPD0YGqxJIO91ya8Hf60Oq9Mo-g-WFTo');
                    "
                ></div>
                <div
                    class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors"
                ></div>
                <div class="absolute bottom-8 left-8 text-white">
                    <h3 class="text-3xl font-serif mb-2">Accessories</h3>
                    <p class="mb-4 text-sm opacity-90">
                        The finishing touches that define your look.
                    </p>
                    <span
                        class="inline-block border-b border-white pb-1 text-sm font-bold uppercase tracking-wider hover:text-[#17b0cf] hover:border-[#17b0cf] transition-colors"
                        >Explore</span
                    >
                </div>
            </div>
        </div>
    </section>
</template>
