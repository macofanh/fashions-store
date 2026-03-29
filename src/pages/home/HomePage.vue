<script setup lang="ts">
import { ref } from 'vue'
import axiosClient from '@/api/axiosClient'

const responseData = ref<string>('')
const errorMessage = ref<string>('')
const isLoading = ref<boolean>(false)

const testConnection = async () => {
    isLoading.value = true
    errorMessage.value = ''
    responseData.value = ''

    try {
        const response = await axiosClient.get('http://127.0.0.1:8000/health')

        responseData.value = JSON.stringify(response.data, null, 2)
    } catch (error: any) {
        errorMessage.value = error.message || 'Không thể kết nối đến Backend'
        console.error('Chi tiết lỗi:', error)
    } finally {
        isLoading.value = false
    }
}
</script>

<template>
    <div class="home-container">
        <h1>Trang Chủ - Test Connection</h1>

        <div class="test-box">
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
}
</style>
