<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { authHandler } from '../authHandler'
import { RegisterRequest } from '../authTypes'
import { APP_NAME, APP_COPYRIGHT } from '@/lib/appConfig'
import { useUIStore } from '@/stores/useUIStore'

const router = useRouter()
const uiStore = useUIStore()
const { register, isLoading, error: authError } = authHandler()
const formData = reactive(new RegisterRequest())

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const handleRegister = async () => {
    if (formData.password !== formData.confirmPassword) {
        uiStore.error('Mật khẩu xác nhận không khớp.')
        return
    }
    try {
        const result = await register(formData)
        router.push({
            name: 'verify-email',
            query: { email: result.email },
        })
    } catch (err) {
        // lỗi đã được authHandler hiển thị qua uiStore
    }
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

        <main class="flex-grow flex items-center justify-center py-16 px-4">
            <div class="w-full max-w-2xl">

                <!-- Header -->
                <div class="text-center mb-10">
                    <router-link to="/" class="inline-flex items-center gap-3 mb-6">
                        <img src="@/assets/images/luxu-logo.svg" alt="Logo" class="h-8 w-auto" />
                        <span class="text-2xl font-serif text-fashion-black tracking-tight leading-none">{{ APP_NAME }}</span>
                    </router-link>
                    <h1 class="text-4xl font-serif italic text-fashion-black mb-2">Tạo tài khoản</h1>
                    <p class="text-text-muted text-sm font-light">Tham gia cộng đồng thời trang của chúng tôi.</p>
                </div>

                <!-- Card -->
                <div class="bg-white border border-border-light rounded-xl shadow-sm p-8 md:p-10">

                    <form @submit.prevent="handleRegister" class="space-y-5">
                        <!-- Row 1: Họ tên + SĐT -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="space-y-1.5">
                                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted block">Họ và tên <span class="text-red-400">*</span></label>
                                <input
                                    v-model="formData.full_name"
                                    type="text"
                                    placeholder="Nguyễn Văn A"
                                    required
                                    class="form-input"
                                />
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted block">Số điện thoại</label>
                                <input
                                    v-model="formData.phone"
                                    type="tel"
                                    placeholder="0123 456 789"
                                    class="form-input"
                                />
                            </div>
                        </div>

                        <!-- Email -->
                        <div class="space-y-1.5">
                            <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted block">Địa chỉ Email <span class="text-red-400">*</span></label>
                            <input
                                v-model="formData.email"
                                type="email"
                                placeholder="name@example.com"
                                required
                                class="form-input"
                            />
                        </div>

                        <!-- Row 2: Password + Confirm -->
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div class="space-y-1.5">
                                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted block">Mật khẩu <span class="text-red-400">*</span></label>
                                <div class="relative">
                                    <input
                                        v-model="formData.password"
                                        :type="showPassword ? 'text' : 'password'"
                                        placeholder="••••••••"
                                        required
                                        class="form-input pr-11"
                                    />
                                    <button @click="showPassword = !showPassword" type="button" class="pwd-toggle">
                                        <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                                    </button>
                                </div>
                            </div>
                            <div class="space-y-1.5">
                                <label class="text-[10px] uppercase tracking-widest font-bold text-text-muted block">Xác nhận mật khẩu <span class="text-red-400">*</span></label>
                                <div class="relative">
                                    <input
                                        v-model="formData.confirmPassword"
                                        :type="showConfirmPassword ? 'text' : 'password'"
                                        placeholder="••••••••"
                                        required
                                        class="form-input pr-11"
                                    />
                                    <button @click="showConfirmPassword = !showConfirmPassword" type="button" class="pwd-toggle">
                                        <span class="material-symbols-outlined text-[20px]">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Terms -->
                        <div class="flex items-start gap-3 pt-1">
                            <input
                                id="terms"
                                type="checkbox"
                                required
                                class="mt-0.5 w-4 h-4 rounded border-border-light text-primary focus:ring-primary/20 cursor-pointer accent-primary"
                            />
                            <label for="terms" class="text-xs text-text-muted cursor-pointer leading-relaxed">
                                Tôi đồng ý với
                                <a href="#" class="text-primary hover:text-primary-dark underline underline-offset-2">Điều khoản dịch vụ</a>
                                và
                                <a href="#" class="text-primary hover:text-primary-dark underline underline-offset-2">Chính sách bảo mật</a>
                                của {{ APP_NAME }}.
                            </label>
                        </div>

                        <!-- Submit -->
                        <button
                            type="submit"
                            :disabled="isLoading"
                            class="w-full bg-primary text-white py-3.5 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                        >
                            <span v-if="isLoading" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            {{ isLoading ? 'Đang xử lý...' : 'Tạo tài khoản' }}
                        </button>
                    </form>

                    <!-- Login link -->
                    <p class="text-center text-sm text-text-muted mt-6">
                        Đã có tài khoản?
                        <router-link to="/auth/login" class="text-primary font-semibold hover:text-primary-dark transition-colors ml-1">
                            Đăng nhập
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
@reference "../../../assets/main.css";

.form-input {
    @apply w-full border border-border-light rounded-lg px-4 py-3 text-sm text-fashion-black placeholder:text-text-muted/50 outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white;
}

.pwd-toggle {
    @apply absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-primary transition-colors;
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease, transform 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; transform: translateY(-8px); }
</style>
