<script setup lang="ts">
import { ref, onMounted } from 'vue'
import axiosClient from '@/api/axiosClient'
import { authHandler } from '../auth/authHandler'

const { logout } = authHandler()
const responseData = ref<string>('')
const errorMessage = ref<string>('')
const isLoading = ref<boolean>(false)

const isAuthenticated = ref(false)
const userInfo = ref<any>(null)

onMounted(() => {
    const token = localStorage.getItem('access_token')
    const userStr = localStorage.getItem('user_info')

    if (token && userStr) {
        isAuthenticated.value = true
        userInfo.value = JSON.parse(userStr)
    }
})

const testConnection = async () => {
    isLoading.value = true
    errorMessage.value = ''
    responseData.value = ''

    try {
        const response = await axiosClient.get('/health')
        responseData.value = JSON.stringify(response.data, null, 2)
    } catch (error: any) {
        errorMessage.value = error.message || 'Không thể kết nối đến Backend'
        console.error('Chi tiết lỗi:', error)
    } finally {
        isLoading.value = false
    }
}

const handleLogout = () => {
    logout()
    // Sau khi logout, cập nhật lại trạng thái local để giao diện thay đổi ngay lập tức
    isAuthenticated.value = false
    userInfo.value = null
}
</script>

<template>
    <div class="home-container">
        <h1>Trang Chủ - Test Connection</h1>

        <!-- AUTH TEST BUTTONS -->
        <div class="auth-test-section">
            <h3>Xác thực (Test):</h3>
            <div v-if="isAuthenticated" class="user-status success">
                <p>
                    Chào mừng, <strong>{{ userInfo?.full_name }}</strong> ({{
                        userInfo?.role
                    }})
                </p>
                <button @click="handleLogout" class="btn-logout">
                    ĐĂNG XUẤT
                </button>
            </div>
            <div v-else class="user-status error">
                <p>Bạn chưa đăng nhập.</p>
                <router-link to="/auth/login" class="btn-login"
                    >ĐĂNG NHẬP NGAY</router-link
                >
            </div>
        </div>

        <div class="test-box">
            <h3>Kết nối Backend:</h3>
            <button
                @click="testConnection"
                :disabled="isLoading"
                class="btn-test"
            >
                {{ isLoading ? 'Đang kết nối...' : 'Bấm để Test kết nối BE' }}
            </button>

            <div v-if="responseData" class="result success">
                <h3>✅ Kết nối THÀNH CÔNG! Phản hồi từ Backend:</h3>
                <pre>{{ responseData }}</pre>
            </div>

            <div v-if="errorMessage" class="result error">
                <h3>❌ Kết nối THẤT BẠI:</h3>
                <p>{{ errorMessage }}</p>
                <small
                    >Hãy F12 mở tab Console/Network để xem chi tiết lỗi
                    nhé.</small
                >
            </div>
        </div>
    </div>
</template>

<style scoped>
.home-container {
    padding: 2rem;
    font-family: sans-serif;
}
.auth-test-section {
    margin-bottom: 30px;
    padding: 15px;
    border: 1px solid #ddd;
    border-radius: 8px;
    max-width: 500px;
}
.user-status {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px;
    border-radius: 4px;
}
.btn-login {
    padding: 8px 16px;
    background-color: #2196f3;
    color: white;
    text-decoration: none;
    border-radius: 4px;
    font-weight: bold;
}
.btn-logout {
    padding: 8px 16px;
    background-color: #f44336;
    color: white;
    border: none;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}
.test-box {
    margin-top: 20px;
    padding: 20px;
    border: 1px dashed #ccc;
    border-radius: 8px;
    max-width: 500px;
}
.btn-test {
    padding: 10px 20px;
    font-size: 16px;
    cursor: pointer;
    background-color: #4caf50;
    color: white;
    border: none;
    border-radius: 4px;
}
.btn-test:disabled {
    background-color: #9e9e9e;
    cursor: not-allowed;
}
.result {
    margin-top: 20px;
    padding: 15px;
    border-radius: 4px;
}
.success {
    background-color: #e8f5e9;
    border-left: 5px solid #4caf50;
    color: #2e7d32;
}
.error {
    background-color: #ffebee;
    border-left: 5px solid #f44336;
    color: #c62828;
}
pre {
    background-color: #fff;
    padding: 10px;
    border-radius: 4px;
    overflow-x: auto;
}
</style>
