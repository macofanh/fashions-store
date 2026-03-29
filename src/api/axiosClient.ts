// src/api/axiosClient.ts
import axios from 'axios'
import router from '@/router'

const axiosClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000',
    headers: { 'Content-Type': 'application/json' },
})

// Interceptor GỬI ĐI: Tự động gắn Bearer token vào mỗi request
axiosClient.interceptors.request.use((config) => {
    // BE FastAPI yêu cầu Bearer access_token
    const token = localStorage.getItem('access_token')
    if (token) {
        config.headers.Authorization = `Bearer ${token}`
    }
    return config
})

// Interceptor NHẬN VỀ: Bắt lỗi tập trung
axiosClient.interceptors.response.use(
    (response) => response, 
    (error) => {
        // Nếu token hết hạn hoặc sai (BE trả về 401)
        if (error.response?.status === 401) {
            // Xoá cả access_token và refresh_token (nếu có lưu)
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
            localStorage.removeItem('user_info')
            
            // Đẩy về trang đăng nhập
            router.push({ name: 'login' })
        }
        return Promise.reject(error)
    },
)

export default axiosClient