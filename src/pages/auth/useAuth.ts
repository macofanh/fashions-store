import { ref } from 'vue'
import { useRouter } from 'vue-router'
import axiosClient from '@/api/axiosClient'
import { apiEndpoints } from '@/api/endPoints'

export function useAuth() {
    const router = useRouter()
    const isLoading = ref(false)
    const error = ref<string | null>(null)

    const login = async (credentials: { email: string; password: string }) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await axiosClient.post(apiEndpoints.auth.login, credentials)
            
            // Backend trả về: { access_token, refresh_token, token_type, user: { ... } }
            const { access_token, refresh_token, user } = response.data

            // Lưu vào localStorage
            localStorage.setItem('access_token', access_token)
            localStorage.setItem('refresh_token', refresh_token)
            localStorage.setItem('user_info', JSON.stringify(user))

            // Chuyển hướng về trang chủ hoặc trang trước đó
            router.push('/')
            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.detail || 'Đăng nhập thất bại. Vui lòng thử lại.'
            throw err
        } finally {
            isLoading.value = false
        }
    }

    const register = async (userData: any) => {
        isLoading.value = true
        error.value = null
        try {
            const response = await axiosClient.post(apiEndpoints.auth.register, userData)
            
            // Sau khi đăng ký thành công, tự động đăng nhập luôn (vì BE trả về token ngay)
            const { access_token, refresh_token, user } = response.data
            localStorage.setItem('access_token', access_token)
            localStorage.setItem('refresh_token', refresh_token)
            localStorage.setItem('user_info', JSON.stringify(user))

            router.push('/')
            return response.data
        } catch (err: any) {
            error.value = err.response?.data?.detail || 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin.'
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

    return {
        login,
        register,
        logout,
        isLoading,
        error
    }
}
