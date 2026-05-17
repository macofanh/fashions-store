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

                <div class="flex gap-4 hero-fade nav-buttons" style="animation-delay: 0.5s;">
                    <router-link
                        to="/products?gender=male"
                        class="btn-radius hero-btn btn-male px-10 py-4 text-[10px] font-bold tracking-[0.3em] uppercase"
                    >
                        Đồ nam
                    </router-link>

                    <router-link
                        to="/products?gender=female"
                        class="btn-radius hero-btn btn-female px-10 py-4 text-[10px] font-bold tracking-[0.3em] uppercase"
                    >
                        Đồ nữ
                    </router-link>

                    <router-link
                        to="/products?gender=kids"
                        class="btn-radius hero-btn btn-kids px-10 py-4 text-[10px] font-bold tracking-[0.3em] uppercase"
                    >
                        Đồ trẻ em
                    </router-link>
                </div>
            </div>
        </section>
    </div>
</template>

<style scoped>
@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(24px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

.hero-fade {
    animation: fadeIn 1.5s ease-out forwards;
}

.hero-rise {
    animation: fadeInUp 1.2s ease-out forwards;
}

.hero-btn {
    position: relative;
    overflow: hidden;
    z-index: 1;
    background: transparent;
    border: 1px solid white;
    color: white;
    transition: all 0.4s ease;
}

/* Mặc định Đồ nam được active */
.btn-male {
    background: white;
    color: black;
    border-color: white;
}

/* Khi hover vào cụm nút, Đồ nam trở về outline */
.nav-buttons:hover .btn-male {
    background: transparent;
    color: white;
    border-color: white;
}

/* Nhưng nếu hover trực tiếp Đồ nam thì nó có hiệu ứng riêng */
.nav-buttons .btn-male:hover {
    background: black;
    color: white;
    border-color: black;
    transform: scale(1.05);
}

/* Đồ nữ */
.btn-female:hover {
    background: linear-gradient(135deg, #ff9a9e, #fad0c4);
    color: black;
    border-color: transparent;
    box-shadow: 0 0 20px rgba(255, 182, 193, 0.55);
    transform: translateY(-2px);
}

/* Đồ trẻ em */
.btn-kids:hover {
    background: #ffe066;
    color: black;
    border-color: transparent;
    transform: translateY(-3px) rotate(-1deg) scale(1.05);
    box-shadow: 0 6px 18px rgba(255, 224, 102, 0.6);
}
</style>