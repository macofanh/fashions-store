<script setup lang="ts">
import { ref, reactive } from 'vue'
import { authHandler } from '../authHandler'
import { LoginRequest } from '../authTypes'
import { APP_NAME, APP_COPYRIGHT } from '@/lib/appConfig'

const { login, startGoogleLogin, isLoading, error: authError } = authHandler()

const formData = reactive(new LoginRequest())
const showPassword = ref(false)

const handleLogin = async () => {
    try {
        await login(formData)
    } catch (err) {
        console.error('Lỗi đăng nhập:', err)
    }
}

const handleGoogleLogin = () => {
    startGoogleLogin()
}
</script>

<template>
    <div class="min-h-screen flex flex-col bg-background-light font-display antialiased">

        <!-- Back link -->
        <div class="absolute top-6 right-6 md:top-10 md:right-10 z-50">
            <router-link
                to="/"
                class="flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-fashion-black hover:text-primary transition-colors"
            >
                <span class="material-symbols-outlined text-[16px]">arrow_back</span>
                Về cửa hàng
            </router-link>
        </div>

        <main class="flex-grow flex flex-col md:flex-row">

            <!-- LEFT: Editorial image panel -->
            <div class="hidden md:block md:w-1/2 relative bg-fashion-black overflow-hidden group">
                <img
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCi0uRuhkKGkFO6N7MTQ7nwzPmNLcvGk3i4SWRRlqmMcrLXFikH7M12q5ZzGiwKC1-KXCm7PYXYmtVjHps4R0xg9UY5SpzxMmYsRgR_ZsVdI5V9zvBMVEr-Lrz61bAI0gnEVAD6ddqiw8GiFgC8cFOMPZGgvfAHIJE2X-nTM_qxhlB6SrdMZ6b2wN5ZFeVpoXUme7C6eC6opIo93sevxDiC-yLTDjUQc5jbn06vFmKdl2ebJtpU-PdJ43KSGSTEH5OgOFVL2qpXKwA"
                    alt="Editorial Fashion"
                    class="absolute inset-0 w-full h-full object-cover opacity-75 grayscale transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                />
                <div class="absolute inset-0 bg-gradient-to-t from-fashion-black/80 via-fashion-black/20 to-transparent"></div>

                <!-- Brand overlay -->
                <div class="absolute top-10 left-10">
                    <router-link to="/" class="flex flex-col">
                        <span class="text-2xl font-serif text-white tracking-tight leading-none">{{ APP_NAME }}</span>
                        <span class="text-[8px] uppercase tracking-[0.5em] text-white/40 mt-0.5 font-bold">Editorial</span>
                    </router-link>
                </div>

                <!-- Bottom quote -->
                <div class="absolute bottom-12 left-10 right-10 animate-fade-in-up">
                    <span class="text-[10px] uppercase tracking-[0.3em] text-white/50 mb-3 block group-hover:translate-x-2 transition-transform duration-700">
                        Bộ sưu tập Mùa Đông
                    </span>
                    <h2 class="text-white text-4xl font-serif italic leading-tight group-hover:translate-x-2 transition-transform duration-700">
                        Định hình phong cách hiện đại qua sự tinh tế.
                    </h2>
                </div>
            </div>

            <!-- RIGHT: Login form -->
            <div class="w-full md:w-1/2 flex items-center justify-center bg-white px-8 py-20 md:px-16 lg:px-24">
                <div class="w-full max-w-md">

                    <!-- Header -->
                    <div class="mb-10">
                        <!-- Mobile logo -->
                        <router-link to="/" class="flex flex-col mb-8 md:hidden">
                            <span class="text-2xl font-serif text-fashion-black tracking-tight leading-none">{{ APP_NAME }}</span>
                            <span class="text-[8px] uppercase tracking-[0.5em] text-text-muted mt-0.5 font-bold">Editorial</span>
                        </router-link>
                        <h1 class="text-4xl md:text-5xl font-serif italic text-fashion-black mb-2">Chào mừng trở lại</h1>
                        <p class="text-text-muted text-sm font-light">Đăng nhập để khám phá bộ sưu tập mới nhất.</p>
                    </div>

                    <!-- Form -->
                    <form @submit.prevent="handleLogin" class="space-y-6">
                        <!-- Email -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted block">
                                Địa chỉ Email
                            </label>
                            <input
                                v-model="formData.email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                class="w-full border border-border-light rounded-lg px-4 py-3 text-sm text-fashion-black placeholder:text-text-muted/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                            />
                        </div>

                        <!-- Password -->
                        <div class="space-y-1.5">
                            <div class="flex justify-between items-center">
                                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted block">
                                    Mật khẩu
                                </label>
                                <a href="#" class="text-[10px] text-primary hover:text-primary-dark transition-colors font-medium">
                                    Quên mật khẩu?
                                </a>
                            </div>
                            <div class="relative">
                                <input
                                    v-model="formData.password"
                                    :type="showPassword ? 'text' : 'password'"
                                    placeholder="••••••••"
                                    required
                                    class="w-full border border-border-light rounded-lg px-4 py-3 pr-11 text-sm text-fashion-black placeholder:text-text-muted/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                                />
                                <button
                                    @click="showPassword = !showPassword"
                                    type="button"
                                    class="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors"
                                >
                                    <span class="material-symbols-outlined text-[20px]">
                                        {{ showPassword ? 'visibility_off' : 'visibility' }}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <!-- Submit -->
                        <button
                            type="submit"
                            :disabled="isLoading"
                            class="w-full bg-primary text-white py-3.5 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <span v-if="isLoading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            {{ isLoading ? 'Đang xử lý...' : 'Đăng nhập' }}
                        </button>
                    </form>

                    <!-- Divider -->
                    <div class="relative flex items-center my-6">
                        <div class="flex-grow border-t border-border-light"></div>
                        <span class="flex-shrink mx-4 text-[10px] uppercase tracking-widest font-bold text-text-muted">Hoặc</span>
                        <div class="flex-grow border-t border-border-light"></div>
                    </div>

                    <!-- Google -->
                    <button
                        type="button"
                        @click="handleGoogleLogin"
                        :disabled="isLoading"
                        class="w-full flex items-center justify-center gap-3 py-3 border border-border-light rounded-lg text-sm font-semibold text-fashion-black hover:border-primary hover:bg-fashion-gray transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <svg class="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                        </svg>
                        Tiếp tục với Google
                    </button>

                    <!-- Register link -->
                    <p class="text-center text-sm text-text-muted mt-8">
                        Chưa có tài khoản?
                        <router-link to="/auth/register" class="text-primary font-semibold hover:text-primary-dark transition-colors ml-1">
                            Tạo tài khoản
                        </router-link>
                    </p>
                </div>
            </div>
        </main>

        <!-- Footer -->
        <footer class="bg-white border-t border-border-light py-6 px-8 flex flex-col md:flex-row justify-between items-center gap-3">
            <p class="text-[10px] uppercase tracking-widest font-bold text-text-muted">{{ APP_COPYRIGHT }}</p>
            <nav class="flex gap-6">
                <a href="#" class="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-primary transition-colors">Bảo mật</a>
                <a href="#" class="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-primary transition-colors">Điều khoản</a>
                <a href="#" class="text-[10px] uppercase tracking-widest font-bold text-text-muted hover:text-primary transition-colors">Liên hệ</a>
            </nav>
        </footer>
    </div>
</template>

<style scoped>
@keyframes fadeInUp {
    from { opacity: 0; transform: translateY(20px); }
    to   { opacity: 1; transform: translateY(0); }
}
.animate-fade-in-up {
    animation: fadeInUp 1s ease-out forwards;
    opacity: 0;
}
.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
