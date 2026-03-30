<script setup lang="ts">
import { ref, reactive } from 'vue'
import { authHandler } from '../authHandler'
import { LoginRequest } from '../authTypes'

const { login, isLoading, error: authError } = authHandler()

const formData = reactive(new LoginRequest())
const showPassword = ref(false)

const handleLogin = async () => {
    try {
        await login(formData)
    } catch (err) {
        console.error('Lỗi đăng nhập:', err)
    }
}

const togglePassword = () => {
    showPassword.value = !showPassword.value
}
</script>

<template>
    <div
        class="bg-[#f8fbfc] text-[#0e191b] antialiased overflow-x-hidden min-h-screen flex flex-col font-body"
    >
        <main class="flex-grow flex flex-col md:flex-row">
            <section
                class="hidden md:block w-1/2 relative bg-zinc-900 overflow-hidden group"
            >
                <img
                    alt="Editorial Fashion"
                    class="absolute inset-0 w-full h-full object-cover opacity-80 grayscale transition-transform duration-[2000ms] ease-out group-hover:scale-105"
                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuCi0uRuhkKGkFO6N7MTQ7nwzPmNLcvGk3i4SWRRlqmMcrLXFikH7M12q5ZzGiwKC1-KXCm7PYXYmtVjHps4R0xg9UY5SpzxMmYsRgR_ZsVdI5V9zvBMVEr-Lrz61bAI0gnEVAD6ddqiw8GiFgC8cFOMPZGgvfAHIJE2X-nTM_qxhlB6SrdMZ6b2wN5ZFeVpoXUme7C6eC6opIo93sevxDiC-yLTDjUQc5jbn06vFmKdl2ebJtpU-PdJ43KSGSTEH5OgOFVL2qpXKwA"
                />
                <div
                    class="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90"
                ></div>

                <div
                    class="absolute bottom-16 left-12 max-w-md animate-fade-in-up delay-300"
                >
                    <span
                        class="text-[10px] uppercase tracking-[0.3em] text-white/70 mb-4 block transform transition-all duration-700 group-hover:translate-x-2"
                    >
                        Bộ sưu tập Mùa Đông
                    </span>
                    <h2
                        class="text-white text-5xl serif-text italic leading-tight transform transition-all duration-700 group-hover:translate-x-2"
                    >
                        Định hình phong cách hiện đại qua sự tinh tế.
                    </h2>
                </div>
            </section>

            <section
                class="w-full md:w-1/2 flex items-center justify-center bg-white px-8 py-24 md:px-16 lg:px-24 relative"
            >
                <div
                    class="absolute top-8 right-8 md:top-12 md:right-12 animate-fade-in-down"
                >
                    <router-link
                        to="/"
                        class="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 transition-all duration-300 hover:text-[#17b0cf] hover:tracking-[0.25em]"
                    >
                        Quay lại cửa hàng
                    </router-link>
                </div>

                <div class="w-full max-w-md animate-fade-in mt-8 md:mt-0">
                    <header class="mb-12">
                        <h1
                            class="text-4xl md:text-5xl serif-text text-[#0e191b] mb-2"
                        >
                            Chào mừng trở lại
                        </h1>
                        <p
                            class="text-[#4e8b97] text-sm font-light tracking-wide uppercase"
                        >
                            Vui lòng đăng nhập để khám phá bộ sưu tập.
                        </p>
                    </header>

                    <transition name="fade">
                        <div
                            v-if="authError"
                            class="mb-8 bg-[#ffdad6] text-[#93000a] p-4 text-sm rounded-sm flex items-center gap-3 shadow-sm"
                        >
                            <span class="material-symbols-outlined text-[20px]"
                                >error</span
                            >
                            <span class="font-medium">{{ authError }}</span>
                        </div>
                    </transition>

                    <form class="space-y-8" @submit.prevent="handleLogin">
                        <div class="relative group">
                            <label
                                class="text-[10px] uppercase tracking-[0.2em] font-bold text-[#4e8b97] mb-2 block transition-colors group-focus-within:text-[#17b0cf]"
                                for="email"
                            >
                                Địa chỉ Email
                            </label>
                            <input
                                v-model="formData.email"
                                class="w-full bg-transparent border-0 border-b border-[#bcc9cd] py-3 px-0 focus:ring-0 focus:border-[#17b0cf] transition-all duration-300 text-[#0e191b] placeholder-zinc-300 outline-none"
                                id="email"
                                type="email"
                                placeholder="name@example.com"
                                required
                            />
                        </div>

                        <div class="relative group">
                            <div class="flex justify-between items-end mb-2">
                                <label
                                    class="text-[10px] uppercase tracking-[0.2em] font-bold text-[#4e8b97] block transition-colors group-focus-within:text-[#17b0cf]"
                                    for="password"
                                >
                                    Mật khẩu
                                </label>
                                <a
                                    class="text-[10px] uppercase tracking-[0.1em] font-medium text-[#17b0cf] hover:text-[#004e5d] transition-colors"
                                    href="#"
                                >
                                    Quên mật khẩu?
                                </a>
                            </div>
                            <div class="relative">
                                <input
                                    v-model="formData.password"
                                    :type="showPassword ? 'text' : 'password'"
                                    class="w-full bg-transparent border-0 border-b border-[#bcc9cd] py-3 px-0 pr-10 focus:ring-0 focus:border-[#17b0cf] transition-all duration-300 text-[#0e191b] placeholder-zinc-300 outline-none"
                                    id="password"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    @click="togglePassword"
                                    type="button"
                                    class="absolute right-0 top-1/2 -translate-y-1/2 text-[#bcc9cd] hover:text-[#17b0cf] transition-colors"
                                >
                                    <span
                                        class="material-symbols-outlined text-[20px]"
                                    >
                                        {{
                                            showPassword
                                                ? 'visibility_off'
                                                : 'visibility'
                                        }}
                                    </span>
                                </button>
                            </div>
                        </div>

                        <button
                            :disabled="isLoading"
                            class="relative overflow-hidden w-full bg-[#0e191b] text-white py-5 text-[12px] font-bold tracking-[0.3em] uppercase hover:bg-zinc-800 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center gap-3 group"
                            type="submit"
                        >
                            <span
                                v-if="isLoading"
                                class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                            ></span>
                            <span class="relative z-10">{{
                                isLoading ? 'ĐANG XỬ LÝ...' : 'ĐĂNG NHẬP'
                            }}</span>
                            <div
                                class="absolute inset-0 h-full w-full scale-0 rounded-full bg-white/10 transition-transform duration-300 ease-out group-hover:scale-[2]"
                            ></div>
                        </button>
                    </form>

                    <div class="mt-12 text-center">
                        <div class="relative flex items-center mb-8">
                            <div
                                class="flex-grow border-t border-[#bcc9cd]"
                            ></div>
                            <span
                                class="flex-shrink mx-4 text-[10px] uppercase tracking-[0.2em] font-bold text-[#4e8b97]"
                                >HOẶC TIẾP TỤC VỚI</span
                            >
                            <div
                                class="flex-grow border-t border-[#bcc9cd]"
                            ></div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <button
                                class="flex items-center justify-center gap-3 py-4 border border-[#bcc9cd] hover:border-[#17b0cf] hover:bg-[#eff4f7] transition-all duration-300"
                            >
                                <svg class="w-4 h-4" viewBox="0 0 24 24">
                                    <path
                                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                        fill="#4285F4"
                                    ></path>
                                    <path
                                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                        fill="#34A853"
                                    ></path>
                                    <path
                                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
                                        fill="#FBBC05"
                                    ></path>
                                    <path
                                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                        fill="#EA4335"
                                    ></path>
                                </svg>
                                <span
                                    class="text-[10px] font-bold tracking-widest uppercase text-[#0e191b]"
                                    >GOOGLE</span
                                >
                            </button>
                            <button
                                class="flex items-center justify-center gap-3 py-4 border border-[#bcc9cd] hover:border-[#17b0cf] hover:bg-[#eff4f7] transition-all duration-300"
                            >
                                <svg
                                    class="w-4 h-4"
                                    fill="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        d="M17.05 20.28c-.96.95-2.06 1.83-3.23 1.83-1.15 0-1.49-.69-2.84-.69-1.33 0-1.74.67-2.81.69-1.11.02-2.13-.81-3.15-1.85-2.09-2.13-3.17-6.04-1.04-8.99 1.06-1.47 2.57-2.39 4.22-2.42 1.25-.02 2.43.83 3.2.83.77 0 2.18-1.03 3.69-.88 1.58.06 2.76.62 3.52 1.71-3.15 1.85-2.64 5.92.51 7.47-.7 1.83-1.57 3.53-2.07 4.3zm-4.32-15.51c.69-.83 1.15-2 1.03-3.16-1.02.04-2.25.67-2.98 1.52-.66.75-1.24 1.94-1.09 3.08 1.13.08 2.27-.55 3.04-1.44z"
                                    ></path>
                                </svg>
                                <span
                                    class="text-[10px] font-bold tracking-widest uppercase text-[#0e191b]"
                                    >APPLE</span
                                >
                            </button>
                        </div>
                    </div>

                    <div class="mt-12 text-center">
                        <p class="text-zinc-500 text-sm font-light">
                            Chưa có tài khoản Luxu Store
                            <router-link
                                to="/auth/register"
                                class="text-[#0e191b] font-semibold underline underline-offset-4 hover:text-[#17b0cf] transition-colors"
                            >
                                Tạo tài khoản
                            </router-link>
                        </p>
                    </div>
                </div>
            </section>
        </main>

        <footer
            class="w-full bg-white py-12 px-12 border-t border-zinc-100 flex flex-col md:flex-row justify-between items-center gap-6 z-10"
        >
            <div
                class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400"
            >
                © 2026 AZURE EDITORIAL. ĐÃ ĐĂNG KÝ BẢN QUYỀN.
            </div>
            <nav class="flex flex-wrap justify-center gap-8">
                <a
                    class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 hover:text-[#17b0cf] transition-colors"
                    href="#"
                    >Chính sách bảo mật</a
                >
                <a
                    class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 hover:text-[#17b0cf] transition-colors"
                    href="#"
                    >Điều khoản dịch vụ</a
                >
                <a
                    class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 hover:text-[#17b0cf] transition-colors"
                    href="#"
                    >Phát triển bền vững</a
                >
                <a
                    class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 hover:text-[#17b0cf] transition-colors"
                    href="#"
                    >Liên hệ</a
                >
            </nav>
        </footer>
    </div>
</template>

<style scoped>
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeInDown {
    from {
        opacity: 0;
        transform: translateY(-20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}

@keyframes fadeIn {
    from {
        opacity: 0;
    }
    to {
        opacity: 1;
    }
}

.animate-fade-in {
    animation: fadeIn 1s ease-out forwards;
}
.animate-fade-in-up {
    animation: fadeInUp 1s ease-out forwards;
    opacity: 0;
}
.animate-fade-in-down {
    animation: fadeInDown 0.8s ease-out forwards;
}
.delay-300 {
    animation-delay: 300ms;
}

.fade-enter-active,
.fade-leave-active {
    transition:
        opacity 0.5s ease,
        transform 0.5s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
