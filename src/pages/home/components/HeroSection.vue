<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

const goToShop = () => {
    console.log('Sẽ chuyển hướng sang trang Danh sách sản phẩm (Shop)')
    // router.push({ name: 'products' })
}
</script>

<template>
    <section
        class="relative w-full min-h-[600px] md:min-h-[750px] overflow-hidden flex items-center justify-center"
    >
        <div
            class="absolute inset-0 w-full h-full bg-cover bg-center bg-no-repeat animate-slow-zoom"
            style="
                background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAdaLat_zvWT95m70bER61UzRjvgcKWCm2OzTVoARVmJCaprz428T9ukAOxxq1pUd70zuqpLHUzU3caxZxmpN6nUzBWe5WAAuul14hnJzaSJ3DEGnh47_Hl1BWndp2UrJ4mPJw7x7PHqg-obsmPCUpG4boHGZjd5WTvaRhi2UE_VeZxBkN8RgW6HweFamZUKVCSe7UxMRmAVps9ENTbvxRImvl5BG7GMNfwFQXN7g4WJ51aJCncJFlc21nr49srL9ZdG_NDRIDPawyM');
            "
        ></div>

        <div
            class="absolute inset-0 bg-gradient-to-b from-black/20 via-black/40 to-black/60"
        ></div>

        <div
            class="relative z-10 flex max-w-4xl flex-col items-center gap-6 px-6 text-center animate-fade-in-up"
        >
            <span
                class="text-white text-xs font-bold tracking-[0.3em] uppercase"
            >
                Season 2026
            </span>

            <h1
                class="text-white text-5xl font-medium leading-tight tracking-[0.15em] md:text-7xl lg:text-8xl"
            >
                SUMMER REVERIE
            </h1>

            <p
                class="text-white/90 text-lg font-light md:text-xl max-w-lg tracking-wide"
            >
                Embrace the warmth with our curated collection of ethereal
                fabrics and timeless silhouettes.
            </p>

            <div class="mt-8">
                <button
                    @click="goToShop"
                    class="group relative flex items-center justify-center overflow-hidden bg-white px-10 py-4 text-[#0e191b] transition-all duration-300 hover:bg-[#17b0cf] hover:text-white hover:scale-105 active:scale-95 shadow-lg"
                >
                    <span
                        class="relative z-10 text-sm font-bold uppercase tracking-widest"
                    >
                        Shop Collection
                    </span>
                </button>
            </div>
        </div>
    </section>
</template>

<style scoped>
/* Hiệu ứng Ken Burns (Zoom mượt mà liên tục) cho tấm ảnh nền */
@keyframes slowZoom {
    0% {
        transform: scale(1);
    }
    100% {
        transform: scale(1.15);
    }
}

.animate-slow-zoom {
    /* Đổi lại thời gian (20s) nếu bạn muốn zoom nhanh/chậm hơn */
    animation: slowZoom 25s ease-in-out infinite alternate;
}

/* Hiệu ứng chữ trượt từ dưới lên */
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(40px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.animate-fade-in-up {
    animation: fadeInUp 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards;
}
</style>
