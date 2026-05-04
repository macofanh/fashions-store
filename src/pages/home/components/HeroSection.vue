<template>
    <div class="w-full flex flex-col h-[calc(100dvh-65px)] mt-[10px]">
        
        <div class="w-full shrink-0 relative z-20">
            <slot name="ticker" />
        </div>

        <section class="relative flex-1 w-full bg-fashion-black overflow-hidden">
            <div class="absolute inset-0">
                <img
                    src="https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070"
                    class="w-full h-full object-cover opacity-60 transition-transform duration-[2000ms] hover:scale-105"
                    alt="Hero banner"
                />
            </div>

            <div class="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
                <span class="text-white/70 uppercase tracking-[0.6em] text-[10px] mb-6 hero-fade font-display">
                    Mùa Xuân Hè 2026
                </span>
                <h1 class="text-white text-6xl md:text-8xl font-serif italic mb-10 hero-rise leading-tight">
                    The New Elegance.
                </h1>
                <div class="flex gap-4 hero-fade" style="animation-delay: 0.5s;">
                    <router-link
                        to="/products?gender=male"
                        class="btn-radius bg-white text-fashion-black px-10 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-fashion-black hover:text-white transition-all duration-500"
                    >
                        Mua sắm nam
                    </router-link>
                    <router-link
                        to="/products?gender=female"
                        class="btn-radius bg-transparent border border-white text-white px-10 py-4 text-[10px] font-bold tracking-[0.3em] uppercase hover:bg-white hover:text-fashion-black transition-all duration-500"
                    >
                        Mua sắm nữ
                    </router-link>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
@keyframes fadeIn   { from { opacity: 0; } to { opacity: 1; } }
@keyframes fadeInUp { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
.hero-fade { animation: fadeIn 1.5s ease-out forwards; }
.hero-rise { animation: fadeInUp 1.2s ease-out forwards; }
</style>