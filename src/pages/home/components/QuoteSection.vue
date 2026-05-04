<script setup lang="ts">
import { APP_NAME } from '@/lib/appConfig'
</script>

<template>
    <section class="bg-fashion-gray py-28 text-center px-6">
        <div class="max-w-2xl mx-auto">
            <p class="text-2xl md:text-3xl font-serif italic text-fashion-black leading-relaxed mb-6">
                "Thời trang không chỉ là thứ bạn mặc. Đó là cách bạn thể hiện bản thân với thế giới."
            </p>
            <p class="text-[10px] uppercase tracking-[0.4em] font-bold text-text-muted font-display">
                — {{ APP_NAME }} Editorial
            </p>
        </div>
    </section>
</template>
