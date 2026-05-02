<script setup lang="ts">
import { APP_NAME, APP_TAGLINE, APP_COPYRIGHT } from '@/lib/appConfig'
</script>

<template>
    <footer class="bg-fashion-black text-white pt-16 pb-8 mt-auto">
        <div class="max-w-[1600px] mx-auto px-6 md:px-12">
            <!-- Top grid -->
            <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-16">
                <!-- Brand -->
                <div class="col-span-2 lg:col-span-2 pr-8">
                    <router-link to="/" class="flex flex-col mb-6">
                        <span class="text-2xl font-serif tracking-tight leading-none">{{ APP_NAME }}</span>
                        <span class="text-[7px] uppercase tracking-[0.5em] text-text-muted mt-0.5 font-bold">{{ APP_TAGLINE }}</span>
                    </router-link>
                    <p class="text-zinc-400 text-sm leading-relaxed mb-6 max-w-sm font-light">
                        Redefining modern luxury with sustainable practices and timeless design. Join us in shaping the future of fashion.
                    </p>
                    <!-- Social -->
                    <div class="flex gap-3">
                        <a href="#" class="social-btn" aria-label="Twitter">
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/></svg>
                        </a>
                        <a href="#" class="social-btn" aria-label="Instagram">
                            <svg class="w-4 h-4 fill-current" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                        </a>
                    </div>
                </div>

                <!-- Shop -->
                <div>
                    <h4 class="footer-heading">Shop</h4>
                    <ul class="footer-links">
                        <li><router-link to="/products">Bộ sưu tập</router-link></li>
                        <li><router-link to="/products?gender=female">Nữ</router-link></li>
                        <li><router-link to="/products?gender=male">Nam</router-link></li>
                        <li><router-link to="/products?gender=kids">Trẻ em</router-link></li>
                    </ul>
                </div>

                <!-- Info -->
                <div>
                    <h4 class="footer-heading">Thông tin</h4>
                    <ul class="footer-links">
                        <li><a href="#">Về chúng tôi</a></li>
                        <li><a href="#">Phát triển bền vững</a></li>
                        <li><a href="#">Tuyển dụng</a></li>
                        <li><a href="#">Báo chí</a></li>
                    </ul>
                </div>

                <!-- Help -->
                <div>
                    <h4 class="footer-heading">Hỗ trợ</h4>
                    <ul class="footer-links">
                        <li><a href="#">Chăm sóc khách hàng</a></li>
                        <li><router-link to="/profile">Tài khoản của tôi</router-link></li>
                        <li><a href="#">Chính sách đổi trả</a></li>
                        <li><a href="#">Điều khoản & Bảo mật</a></li>
                    </ul>
                </div>
            </div>

            <!-- Bottom bar -->
            <div class="border-t border-white/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                <p class="text-xs text-zinc-500">{{ APP_COPYRIGHT }}</p>
                <div class="flex items-center gap-2">
                    <span class="material-symbols-outlined text-primary text-[16px]">lock</span>
                    <span class="text-[10px] text-zinc-500 uppercase tracking-widest">Thanh toán bảo mật 100%</span>
                </div>
            </div>
        </div>
    </footer>
</template>

<style scoped>
@reference "../../assets/main.css";

.social-btn {
    @apply w-9 h-9 flex items-center justify-center rounded-full bg-white/5 text-zinc-400 hover:bg-primary hover:text-white transition-all;
}

.footer-heading {
    @apply text-[9px] uppercase tracking-[0.3em] font-bold text-zinc-400 mb-5;
}

.footer-links {
    @apply flex flex-col gap-3;
}

.footer-links li a,
.footer-links li :deep(a) {
    @apply text-sm text-zinc-500 hover:text-white transition-colors font-light;
}
</style>
