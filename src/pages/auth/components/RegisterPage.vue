<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authHandler } from '../authHandler'
import { RegisterRequest } from '../authTypes'

const router = useRouter()
const { register, isLoading, error: authError } = authHandler()
const formData = reactive(new RegisterRequest())

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const validationError = ref<string | null>(null)

const handleRegister = async () => {
    validationError.value = null
    if (formData.password !== formData.confirmPassword) {
        validationError.value = 'Mật khẩu xác nhận không khớp.'
        return
    }

    try {
        await register(formData)
        alert('Đăng ký tài khoản thành công! Vui lòng đăng nhập.')
        router.push('/auth/login')
    } catch (err) {
        console.error('Lỗi đăng ký:', err)
    }
}

const togglePassword = () => (showPassword.value = !showPassword.value)
const toggleConfirmPassword = () =>
    (showConfirmPassword.value = !showConfirmPassword.value)
</script>

<template>
    <div
        class="bg-[#f8fbfc] text-[#0e191b] antialiased overflow-x-hidden min-h-screen flex flex-col font-body relative"
    >
        <div
            class="absolute top-8 right-8 md:top-12 md:right-12 z-50 animate-fade-in-down"
        >
            <router-link
                to="/"
                class="flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 transition-all duration-300 hover:text-[#17b0cf] hover:tracking-[0.25em]"
            >
                Quay lại cửa hàng
            </router-link>
        </div>

        <main
            class="flex-grow flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8"
        >
            <section
                class="w-full max-w-4xl bg-white p-8 sm:p-12 md:p-16 shadow-sm border border-zinc-100 animate-fade-in rounded-sm relative"
            >
                <header class="mb-12 text-center">
                    <h1
                        class="serif-text text-4xl md:text-5xl text-[#0e191b] mb-4"
                    >
                        Tạo Tài Khoản
                    </h1>

                </header>

                <transition name="fade">
                    <div
                        v-if="authError || validationError"
                        class="mb-8 bg-[#ffdad6] text-[#93000a] p-4 text-sm rounded-sm flex items-center justify-center gap-3 shadow-sm max-w-2xl mx-auto"
                    >
                        <span class="material-symbols-outlined text-[20px]"
                            >error</span
                        >
                        <span class="font-medium">{{
                            authError || validationError
                        }}</span>
                    </div>
                </transition>

                <form
                    class="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8"
                    @submit.prevent="handleRegister"
                >
                    <div class="relative group">
                        <label
                            class="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#4e8b97] mb-2 transition-colors group-focus-within:text-[#17b0cf]"
                        >
                            Họ và tên
                        </label>
                        <input
                            v-model="formData.full_name"
                            class="w-full bg-transparent border-0 border-b border-[#bcc9cd] py-3 px-0 focus:ring-0 focus:border-[#17b0cf] transition-all duration-300 text-[#0e191b] placeholder-zinc-300 outline-none"
                            placeholder="Nguyễn Văn A"
                            type="text"
                            required
                        />
                    </div>

                    <div class="relative group">
                        <label
                            class="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#4e8b97] mb-2 transition-colors group-focus-within:text-[#17b0cf]"
                        >
                            Số điện thoại
                        </label>
                        <input
                            v-model="formData.phone"
                            class="w-full bg-transparent border-0 border-b border-[#bcc9cd] py-3 px-0 focus:ring-0 focus:border-[#17b0cf] transition-all duration-300 text-[#0e191b] placeholder-zinc-300 outline-none"
                            placeholder="0123-456-789"
                            type="tel"
                        />
                    </div>

                    <div class="relative group md:col-span-2">
                        <label
                            class="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#4e8b97] mb-2 transition-colors group-focus-within:text-[#17b0cf]"
                        >
                            Địa chỉ Email
                        </label>
                        <input
                            v-model="formData.email"
                            class="w-full bg-transparent border-0 border-b border-[#bcc9cd] py-3 px-0 focus:ring-0 focus:border-[#17b0cf] transition-all duration-300 text-[#0e191b] placeholder-zinc-300 outline-none"
                            placeholder="name@example.com"
                            type="email"
                            required
                        />
                    </div>

                    <div class="relative group">
                        <label
                            class="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#4e8b97] mb-2 transition-colors group-focus-within:text-[#17b0cf]"
                        >
                            Mật khẩu
                        </label>
                        <div class="relative">
                            <input
                                v-model="formData.password"
                                :type="showPassword ? 'text' : 'password'"
                                class="w-full bg-transparent border-0 border-b border-[#bcc9cd] py-3 px-0 pr-10 focus:ring-0 focus:border-[#17b0cf] transition-all duration-300 text-[#0e191b] placeholder-zinc-300 outline-none"
                                placeholder="••••••••••••"
                                required
                            />
                            <button
                                @click="togglePassword"
                                type="button"
                                class="absolute right-0 top-1/2 -translate-y-1/2 text-[#bcc9cd] hover:text-[#17b0cf] transition-colors"
                            >
                                <span
                                    class="material-symbols-outlined text-[20px]"
                                    >{{
                                        showPassword
                                            ? 'visibility_off'
                                            : 'visibility'
                                    }}</span
                                >
                            </button>
                        </div>
                    </div>

                    <div class="relative group">
                        <label
                            class="block text-[10px] uppercase tracking-[0.2em] font-bold text-[#4e8b97] mb-2 transition-colors group-focus-within:text-[#17b0cf]"
                        >
                            Xác nhận Mật khẩu
                        </label>
                        <div class="relative">
                            <input
                                v-model="formData.confirmPassword"
                                :type="
                                    showConfirmPassword ? 'text' : 'password'
                                "
                                class="w-full bg-transparent border-0 border-b border-[#bcc9cd] py-3 px-0 pr-10 focus:ring-0 focus:border-[#17b0cf] transition-all duration-300 text-[#0e191b] placeholder-zinc-300 outline-none"
                                placeholder="••••••••••••"
                                required
                            />
                            <button
                                @click="toggleConfirmPassword"
                                type="button"
                                class="absolute right-0 top-1/2 -translate-y-1/2 text-[#bcc9cd] hover:text-[#17b0cf] transition-colors"
                            >
                                <span
                                    class="material-symbols-outlined text-[20px]"
                                    >{{
                                        showConfirmPassword
                                            ? 'visibility_off'
                                            : 'visibility'
                                    }}</span
                                >
                            </button>
                        </div>
                    </div>

                    <div
                        class="flex items-start gap-3 pt-4 md:col-span-2 justify-center"
                    >
                        <input
                            class="mt-0.5 w-4 h-4 border-[#bcc9cd] rounded-none text-[#17b0cf] focus:ring-[#17b0cf]/20 cursor-pointer"
                            id="terms"
                            type="checkbox"
                            required
                        />
                        <label
                            for="terms"
                            class="text-[11px] leading-relaxed text-[#4e8b97] cursor-pointer"
                        >
                            TÔI ĐỒNG Ý VỚI
                            <a
                                class="underline underline-offset-4 hover:text-[#17b0cf] transition-colors"
                                href="#"
                                >ĐIỀU KHOẢN DỊCH VỤ</a
                            >
                            VÀ
                            <a
                                class="underline underline-offset-4 hover:text-[#17b0cf] transition-colors"
                                href="#"
                                >CHÍNH SÁCH BẢO MẬT</a
                            >.
                        </label>
                    </div>

                    <div class="md:col-span-2 mt-4">
                        <button
                            :disabled="isLoading"
                            class="relative overflow-hidden w-full max-w-md mx-auto bg-[#0e191b] text-white py-5 text-[12px] font-bold tracking-[0.3em] uppercase hover:bg-zinc-800 transition-all duration-300 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed disabled:active:scale-100 flex justify-center items-center gap-3 group block"
                            type="submit"
                        >
                            <span
                                v-if="isLoading"
                                class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"
                            ></span>
                            <span class="relative z-10">{{
                                isLoading ? 'ĐANG XỬ LÝ...' : 'TẠO TÀI KHOẢN'
                            }}</span>
                            <div
                                class="absolute inset-0 h-full w-full scale-0 rounded-full bg-white/10 transition-transform duration-300 ease-out group-hover:scale-[2]"
                            ></div>
                        </button>
                    </div>
                </form>

                <div class="mt-16 max-w-2xl mx-auto">
                    <!-- <div class="relative flex items-center justify-center mb-8">
                        <div
                            class="absolute w-full border-t border-[#bcc9cd]"
                        ></div>
                        <span
                            class="relative bg-white px-4 text-[10px] uppercase tracking-widest font-bold text-[#4e8b97]"
                            >HOẶC TIẾP TỤC VỚI</span
                        >
                    </div> -->

                    <!-- <div class="grid grid-cols-2 gap-4">
                        <button
                            class="flex items-center justify-center gap-3 py-4 border border-[#bcc9cd] hover:border-[#17b0cf] hover:bg-[#eff4f7] transition-all duration-300 group"
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
                                class="text-[10px] uppercase tracking-widest font-bold text-[#0e191b]"
                                >Google</span
                            >
                        </button>
                        <button
                            class="flex items-center justify-center gap-3 py-4 border border-[#bcc9cd] hover:border-[#17b0cf] hover:bg-[#eff4f7] transition-all duration-300 group"
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
                                class="text-[10px] uppercase tracking-widest font-bold text-[#0e191b]"
                                >Apple</span
                            >
                        </button>
                    </div> -->

                    <div class="mt-12 text-center">
                        <p
                            class="text-[11px] text-[#4e8b97] uppercase tracking-widest"
                        >
                            Đã có tài khoản?
                            <router-link
                                to="/auth/login"
                                class="text-[#0e191b] font-bold border-b border-[#0e191b] pb-0.5 ml-1 hover:text-[#17b0cf] hover:border-[#17b0cf] transition-colors"
                            >
                                Đăng Nhập
                            </router-link>
                        </p>
                    </div>
                </div>
            </section>
        </main>

        <footer
            class="w-full flex flex-col md:flex-row justify-between items-center gap-4 py-8 px-8 md:px-12 bg-white border-t border-zinc-100 mt-auto"
        >
            <div
                class="text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-400 text-center md:text-left"
            >
                © 2026 AZURE EDITORIAL. ĐÃ ĐĂNG KÝ BẢN QUYỀN.
            </div>
            <div class="flex flex-wrap justify-center gap-6 md:gap-8">
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
            </div>
        </footer>
    </div>
</template>

<style scoped>
.font-body {
    font-family: 'Inter', sans-serif;
}
.serif-text {
    font-family: 'IBM Plex Serif', serif;
}

/* Animations cho sự xuất hiện mượt mà */
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
    animation: fadeIn 0.8s ease-out forwards;
}
.animate-fade-in-up {
    animation: fadeInUp 0.8s ease-out forwards;
    opacity: 0;
}
.animate-fade-in-down {
    animation: fadeInDown 0.8s ease-out forwards;
}
.delay-300 {
    animation-delay: 300ms;
}

/* Hiệu ứng chuyển cảnh cho thẻ báo lỗi */
.fade-enter-active,
.fade-leave-active {
    transition:
        opacity 0.3s ease,
        transform 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}
</style>
