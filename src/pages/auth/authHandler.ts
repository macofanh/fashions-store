import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { authService } from './authServices'
import type { LoginRequest, RegisterRequest } from './authTypes'

export function authHandler() {
    const router = useRouter()
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const login = async (credentials: LoginRequest) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authService.login(credentials)
            const { access_token, refresh_token, user } = response.data

            localStorage.setItem('access_token', access_token)
            localStorage.setItem('refresh_token', refresh_token)
            localStorage.setItem('user_info', JSON.stringify(user))

            router.push('/')
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

    const register = async (userData: RegisterRequest) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await authService.register(userData)
            // const { access_token, refresh_token, user } = response.data

            // localStorage.setItem('access_token', access_token)
            // localStorage.setItem('refresh_token', refresh_token)
            // localStorage.setItem('user_info', JSON.stringify(user))

            // router.push('/auth/login')
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
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        router.push({ name: 'login' })
    }

    return { login, register, logout, isLoading, error }
}
