<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authHandler } from '../authHandler'
import { APP_COPYRIGHT, APP_NAME } from '@/lib/appConfig'

const route = useRoute()
const router = useRouter()
const {
    verifyEmail,
    resendVerification,
    isVerifying,
    isResending,
} = authHandler()

const email = computed(() => {
    const queryEmail = route.query.email
    return typeof queryEmail === 'string' ? queryEmail.trim().toLowerCase() : ''
})
const code = ref('')
const resendCountdown = ref(60)
let countdownTimer: ReturnType<typeof setInterval> | undefined

const startCountdown = (seconds = 60) => {
    resendCountdown.value = seconds
    if (countdownTimer) clearInterval(countdownTimer)
    countdownTimer = setInterval(() => {
        if (resendCountdown.value <= 1) {
            resendCountdown.value = 0
            if (countdownTimer) clearInterval(countdownTimer)
            countdownTimer = undefined
            return
        }
        resendCountdown.value -= 1
    }, 1000)
}

const normalizeCode = (event: Event) => {
    const input = event.target as HTMLInputElement
    code.value = input.value.replace(/\D/g, '').slice(0, 6)
    input.value = code.value
}

const handleVerify = async () => {
    if (!email.value || code.value.length !== 6) return
    try {
        await verifyEmail({ email: email.value, code: code.value })
        router.push({ name: 'login' })
    } catch {
        // authHandler displays the API error.
    }
}

const handleResend = async () => {
    if (!email.value || resendCountdown.value > 0) return
    try {
        const result = await resendVerification(email.value)
        code.value = ''
        startCountdown(result.resend_after ?? 60)
    } catch {
        // Keep the button available so the user can retry after an API error.
    }
}

onMounted(() => {
    if (!email.value) {
        router.replace({ name: 'register' })
        return
    }
    startCountdown()
})

onBeforeUnmount(() => {
    if (countdownTimer) clearInterval(countdownTimer)
})
</script>

<template>
    <div class="min-h-screen flex flex-col bg-background-light font-display antialiased">
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
            <div class="w-full max-w-lg">
                <div class="text-center mb-10">
                    <router-link to="/" class="inline-flex items-center gap-3 mb-6">
                        <img src="@/assets/images/luxu-logo.svg" alt="Logo" class="h-8 w-auto" />
                        <span class="text-2xl font-serif text-fashion-black tracking-tight">{{ APP_NAME }}</span>
                    </router-link>
                    <h1 class="text-4xl font-serif italic text-fashion-black mb-3">Xác thực email</h1>
                    <p class="text-text-muted text-sm font-light leading-relaxed">
                        Nhập mã gồm 6 chữ số đã được gửi tới
                        <strong class="text-fashion-black">{{ email }}</strong>
                    </p>
                </div>

                <div class="bg-white border border-border-light rounded-xl shadow-sm p-8 md:p-10">
                    <form class="space-y-6" @submit.prevent="handleVerify">
                        <div class="space-y-2">
                            <label for="verification-code" class="text-[10px] uppercase tracking-widest font-bold text-text-muted block">
                                Mã xác thực
                            </label>
                            <input
                                id="verification-code"
                                :value="code"
                                type="text"
                                inputmode="numeric"
                                autocomplete="one-time-code"
                                maxlength="6"
                                placeholder="000000"
                                autofocus
                                class="w-full border border-border-light rounded-lg px-4 py-4 text-center text-2xl tracking-[0.5em] font-semibold text-fashion-black outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all bg-white"
                                @input="normalizeCode"
                            />
                        </div>

                        <button
                            type="submit"
                            :disabled="isVerifying || code.length !== 6"
                            class="w-full bg-primary text-white py-3.5 rounded-lg text-sm font-bold tracking-widest uppercase hover:bg-primary-dark transition-all active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            <span v-if="isVerifying" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                            {{ isVerifying ? 'Đang xác thực...' : 'Xác thực email' }}
                        </button>
                    </form>

                    <div class="mt-6 text-center text-sm text-text-muted">
                        <span v-if="resendCountdown > 0">
                            Có thể gửi lại mã sau {{ resendCountdown }} giây
                        </span>
                        <button
                            v-else
                            type="button"
                            :disabled="isResending"
                            class="text-primary font-semibold hover:text-primary-dark disabled:opacity-60"
                            @click="handleResend"
                        >
                            {{ isResending ? 'Đang gửi...' : 'Gửi lại mã' }}
                        </button>
                    </div>

                    <p class="text-center text-sm text-text-muted mt-5">
                        Email chưa đúng?
                        <router-link to="/auth/register" class="text-primary font-semibold hover:text-primary-dark ml-1">
                            Đăng ký lại
                        </router-link>
                    </p>
                </div>
            </div>
        </main>

        <footer class="bg-white border-t border-border-light py-6 px-8 text-center">
            <p class="text-[10px] uppercase tracking-widest font-bold text-text-muted">{{ APP_COPYRIGHT }}</p>
        </footer>
    </div>
</template>
