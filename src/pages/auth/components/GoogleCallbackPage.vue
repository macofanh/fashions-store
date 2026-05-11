<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { authHandler } from '../authHandler'
import { useAuthStore } from '@/stores/useAuthStore'
import { APP_NAME } from '@/lib/appConfig'

const route = useRoute()
const authStore = useAuthStore()
const { completeGoogleLogin, isLoading, error: authError } = authHandler()
const localError = ref<string | null>(null)

const errorMessage = computed(() => authError.value || localError.value)

const extractCode = () => {
    const code = route.query.code
    if (typeof code === 'string' && code.trim()) {
        return code.trim()
    }

    if (Array.isArray(code) && code[0]?.trim()) {
        return code[0].trim()
    }

    return ''
}

const extractToken = (value: unknown) => {
    if (typeof value === 'string' && value.trim()) {
        return value.trim()
    }

    if (Array.isArray(value) && value[0]?.trim()) {
        return value[0].trim()
    }

    return ''
}

const finishGoogleLogin = async () => {
    const accessToken = extractToken(route.query.access_token)
    const refreshToken = extractToken(route.query.refresh_token)

    if (accessToken) {
        authStore.hydrateTokens(accessToken, refreshToken || undefined)

        try {
            await authStore.bootstrapAuth()
            window.location.replace('/')
        } catch (err) {
            console.error('Lỗi tải thông tin người dùng sau Google login:', err)
        }
        return
    }

    const code = extractCode()

    if (!code) {
        localError.value = 'Không nhận được mã xác thực từ Google.'
        return
    }

    try {
        await completeGoogleLogin(code)
    } catch (err) {
        console.error('Lỗi hoàn tất đăng nhập Google:', err)
    }
}

onMounted(() => {
    void finishGoogleLogin()
})
</script>

<template>
    <div class="min-h-screen flex items-center justify-center bg-background-light px-4 py-16 font-display antialiased">
        <div class="w-full max-w-lg bg-white border border-border-light rounded-2xl shadow-sm p-8 md:p-10 text-center">
            <div class="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-fashion-gray text-primary">
                <span v-if="!errorMessage" class="material-symbols-outlined text-[28px] animate-spin">progress_activity</span>
                <span v-else class="material-symbols-outlined text-[28px]">error</span>
            </div>

            <p class="text-[10px] uppercase tracking-[0.4em] text-text-muted font-bold mb-3">{{ APP_NAME }}</p>
            <h1 class="text-3xl md:text-4xl font-serif italic text-fashion-black mb-3">
                {{ errorMessage ? 'Xác thực thất bại' : 'Đang hoàn tất đăng nhập' }}
            </h1>
            <p class="text-sm text-text-muted leading-relaxed">
                <span v-if="!errorMessage">
                    Hệ thống đang đổi mã xác thực Google thành phiên đăng nhập của bạn.
                </span>
                <span v-else>
                    {{ errorMessage }}
                </span>
            </p>

            <div v-if="isLoading && !errorMessage" class="mt-8 text-xs uppercase tracking-[0.3em] text-text-muted font-semibold">
                Vui lòng chờ...
            </div>

            <div class="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
                <router-link
                    to="/auth/login"
                    class="inline-flex items-center justify-center rounded-lg border border-border-light px-5 py-3 text-sm font-semibold text-fashion-black hover:border-primary hover:bg-fashion-gray transition-colors"
                >
                    Quay lại đăng nhập
                </router-link>
                <router-link
                    to="/"
                    class="inline-flex items-center justify-center rounded-lg bg-primary px-5 py-3 text-sm font-semibold text-white hover:bg-primary-dark transition-colors"
                >
                    Về cửa hàng
                </router-link>
            </div>
        </div>
    </div>
</template>