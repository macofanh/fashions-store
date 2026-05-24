import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from './authServices'
import type { LoginRequest, RegisterRequest } from './authTypes'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'

export function authHandler() {
    const router = useRouter()
    const authStore = useAuthStore()
    const uiStore = useUIStore()
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    // Hàm dùng chung để lưu auth sau khi đăng nhập thành công
    const _handleAuthSuccess = (data: { access_token: string; refresh_token: string; user: any }) => {
        localStorage.setItem('refresh_token', data.refresh_token)
        authStore.setAuth(data.user, data.access_token)
        router.push({ name: 'home' })
    }

    const _setError = (msg: string) => {
        error.value = msg
        uiStore.error(msg)
    }

    const login = async (credentials: LoginRequest) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authService.login(credentials)
            _handleAuthSuccess(response.data)
            return response.data
        } catch (err: any) {
            _setError(err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng thử lại.')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const startGoogleLogin = () => {
        window.location.replace(authService.getGoogleLoginUrl())
    }

    const loginWithGoogle = async (idToken: string) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authService.loginWithGoogle(idToken)
            _handleAuthSuccess(response.data)
            return response.data
        } catch (err: any) {
            _setError(err.response?.data?.detail || 'Đăng nhập Google thất bại. Vui lòng thử lại.')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const completeGoogleLogin = async (code: string) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authService.completeGoogleLogin(code)
            _handleAuthSuccess(response.data)
            return response.data
        } catch (err: any) {
            _setError(err.response?.data?.detail || 'Xác thực Google thất bại. Vui lòng thử lại.')
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
            uiStore.success('Đăng ký tài khoản thành công! Vui lòng đăng nhập.')
            return response.data
        } catch (err: any) {
            _setError(err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const logout = () => {
        window.google?.accounts.id.disableAutoSelect()
        authStore.logout()
        router.push({ name: 'login' })
    }

    const forgotPassword = async (email: string) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authService.forgotPassword(email)
            uiStore.success(response.data?.message || 'Đã gửi mật khẩu mới vào email của bạn.')
            return response.data
        } catch (err: any) {
            _setError(err.response?.data?.detail || 'Yêu cầu khôi phục mật khẩu thất bại. Vui lòng thử lại.')
            throw err
        } finally {
            isLoading.value = false
        }
    }

    return {
        login,
        loginWithGoogle,
        startGoogleLogin,
        completeGoogleLogin,
        register,
        logout,
        forgotPassword,
        isLoading,
        error,
    }
}
