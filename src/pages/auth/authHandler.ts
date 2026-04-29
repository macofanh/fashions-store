import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from './authServices'
import type { LoginRequest, RegisterRequest } from './authTypes'
import { useAuthStore } from '@/stores/useAuthStore'

export function authHandler() {
    const router = useRouter()
    const authStore = useAuthStore()
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Hàm dùng chung để lưu auth sau khi đăng nhập thành công
    const _handleAuthSuccess = (data: { access_token: string; refresh_token: string; user: any }) => {
        localStorage.setItem('refresh_token', data.refresh_token)
        authStore.setAuth(data.user, data.access_token)
        router.push({ name: 'home' })
    }

    const login = async (credentials: LoginRequest) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authService.login(credentials)
            _handleAuthSuccess(response.data)
            return response.data
        } catch (err: any) {
            error.value =
                err.response?.data?.detail ||
                'Đăng nhập thất bại. Vui lòng thử lại.'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const loginWithGoogle = async (idToken: string) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authService.loginWithGoogle(idToken)
            _handleAuthSuccess(response.data)
            return response.data
        } catch (err: any) {
            error.value =
                err.response?.data?.detail ||
                'Đăng nhập Google thất bại. Vui lòng thử lại.'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const register = async (userData: RegisterRequest) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authService.register(userData)
            return response.data
        } catch (err: any) {
            error.value =
                err.response?.data?.detail ||
                'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const logout = () => {
        // Tắt auto-select của Google khi logout
        window.google?.accounts.id.disableAutoSelect()
        authStore.logout()
        router.push({ name: 'login' })
    }

    return { login, loginWithGoogle, register, logout, isLoading, error }
}
