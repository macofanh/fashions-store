<script setup lang="ts">
import { APP_NAME } from '@/lib/appConfig'
</script>

<template>
    <div class="bg-background-light min-h-screen pb-24 font-display">
        <!-- Hero Section -->
        <section class="relative bg-zinc-900 text-white py-24 md:py-32 overflow-hidden">
            <div class="absolute inset-0 opacity-40">
                <img
                    src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=2070"
                    alt="LuxuStore Studio"
                    class="w-full h-full object-cover"
                />
            </div>
            <div class="relative z-10 max-w-[1200px] mx-auto px-6 text-center">
                <span class="text-[10px] uppercase tracking-[0.4em] text-white/60 mb-4 block">Câu chuyện của chúng tôi</span>
                <h1 class="text-4xl md:text-6xl font-serif italic mb-6 leading-tight">VỀ {{ APP_NAME.toUpperCase() }}</h1>
                <p class="max-w-2xl mx-auto text-sm md:text-base font-light text-zinc-300 leading-relaxed">
                    Định hình phong cách tối giản thời thượng, chắt lọc tinh hoa từ chất liệu và sự chỉn chu trong từng đường kim mũi chỉ.
                </p>
            </div>
        </section>

        <!-- Main Content Section -->
        <section class="max-w-[1200px] mx-auto px-6 py-20">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16">
                <!-- Our Story -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-[24px]">history_edu</span>
                        <h2 class="text-lg font-serif font-bold text-fashion-black">Hành trình bắt đầu</h2>
                    </div>
                    <hr class="border-border-light" />
                    <p class="text-sm font-light text-zinc-600 leading-relaxed">
                        Tại <strong>{{ APP_NAME }}</strong>, hành trình của chúng tôi bắt đầu từ mong muốn định nghĩa lại sự tinh tế trong thời trang hiện đại. Chúng tôi tin rằng sự xa xỉ thực sự không nằm ở sự phô trương bề ngoài, mà ẩn mình dưới chất lượng vải tuyển chọn và những đường nét cắt may tối giản, tinh xảo.
                    </p>
                </div>

                <!-- Design Philosophy -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-[24px]">architecture</span>
                        <h2 class="text-lg font-serif font-bold text-fashion-black">Triết lý thiết kế</h2>
                    </div>
                    <hr class="border-border-light" />
                    <p class="text-sm font-light text-zinc-600 leading-relaxed">
                        Chúng tôi tập trung phát triển dòng sản phẩm dành riêng cho cả <strong>Nam và Nữ</strong>. Loại bỏ hoàn toàn những yếu tố rườm rà, các thiết kế của {{ APP_NAME }} hướng tới phom dáng tôn dáng tự nhiên, mang đậm tính ứng dụng và dễ dàng phối hợp ăn ý trong mọi hoàn cảnh sống.
                    </p>
                </div>

                <!-- Our Commitment -->
                <div class="space-y-4">
                    <div class="flex items-center gap-3">
                        <span class="material-symbols-outlined text-primary text-[24px]">verified</span>
                        <h2 class="text-lg font-serif font-bold text-fashion-black">Cam kết chất lượng</h2>
                    </div>
                    <hr class="border-border-light" />
                    <p class="text-sm font-light text-zinc-600 leading-relaxed">
                        Mỗi sản phẩm đều sử dụng các chất liệu cao cấp có nguồn gốc tự nhiên như Linen thoáng mát, Cotton hữu cơ mềm mại và len sợi chọn lọc. Từng công đoạn từ phác thảo bản vẽ đến hoàn thiện khâu may cuối cùng đều được giám sát khắt khe bởi những người thợ lành nghề nhất.
                    </p>
                </div>
            </div>
        </section>

        <!-- Quote Block -->
        <section class="max-w-[800px] mx-auto px-6 py-12 text-center border-t border-b border-border-light/60 my-8">
            <span class="material-symbols-outlined text-zinc-300 text-4xl mb-4">format_quote</span>
            <p class="text-xl md:text-2xl font-serif italic text-fashion-black leading-relaxed">
                "Thực chất của thời trang không phải là mặc những gì mới nhất, mà là sở hữu những thiết kế lưu giữ vẻ đẹp trường tồn cùng thời gian."
            </p>
            <span class="text-[10px] uppercase tracking-widest text-text-muted mt-4 block font-bold">— {{ APP_NAME }} Team</span>
        </section>
    </div>
</template>

<style scoped>
@reference "../../assets/main.css";
</style>
