// src/api/axiosClient.ts
import axios from 'axios'
import router from '@/router'

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
    headers: { 'Content-Type': 'application/json' },
})

// Interceptor GỬI ĐI: Tự động gắn Bearer token vào mỗi request
axiosClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Biến để tránh gọi refresh token nhiều lần cùng lúc
let isRefreshing = false
let failedQueue: any[] = []

const processQueue = (error: any, token: string | null = null) => {
    failedQueue.forEach((prom) => {
        if (error) {
            prom.reject(error)
        } else {
            prom.resolve(token)
        }
    })
    failedQueue = []
}

// Interceptor NHẬN VỀ: Xử lý refresh token và lỗi tập trung
axiosClient.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config

        // Nếu lỗi 401 và chưa từng thử retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    failedQueue.push({ resolve, reject })
                })
                    .then((token) => {
                        originalRequest.headers.Authorization = `Bearer ${token}`
                        return axiosClient(originalRequest)
                    })
                    .catch((err) => Promise.reject(err))
            }

            originalRequest._retry = true
            isRefreshing = true

            const refreshToken = localStorage.getItem('refresh_token')
            if (!refreshToken) {
                handleLogout()
                return Promise.reject(error)
            }

            try {
                const response = await axios.post(`${axiosClient.defaults.baseURL}/api/v1/auth/refresh`, {
                    refresh_token: refreshToken
                })
                
                const { access_token } = response.data
                localStorage.setItem('access_token', access_token)
                
                axiosClient.defaults.headers.common['Authorization'] = `Bearer ${access_token}`
                processQueue(null, access_token)
                
                return axiosClient(originalRequest)
            } catch (refreshError) {
                processQueue(refreshError, null)
                handleLogout()
                return Promise.reject(refreshError)
            } finally {
                isRefreshing = false
            }
        }

        return Promise.reject(error)
    },
)

function handleLogout() {
    localStorage.removeItem('access_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_info')
    router.push({ name: 'login' })
}

export default axiosClient