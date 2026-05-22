<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import axiosClient from '@/lib/axiosClient'
import { apiEndpoints } from '@/lib/endPoints'
import { useUIStore } from '@/stores/useUIStore'

const route  = useRoute()
const router = useRouter()
const uiStore = useUIStore()

type Status = 'loading' | 'success' | 'failed' | 'error'

const status  = ref<Status>('loading')
const message = ref('')
const orderId = ref<number | null>(null)

onMounted(async () => {
    const gateway = route.params.gateway as string  // 'momo' | 'vnpay'
    const queryParams = route.query

    try {
        let res: any

        if (gateway === 'momo') {
            // Gọi backend để xác minh kết quả MoMo
            res = await axiosClient.get(apiEndpoints.payments.momoReturn, { params: queryParams })
            const data = res.data
            orderId.value = data.order_id ?? null

            if (data.is_success || data.result_code === 0) {
                status.value  = 'success'
                message.value = 'Thanh toán MoMo thành công!'
                uiStore.success('Thanh toán thành công!')
            } else {
                status.value  = 'failed'
                message.value = data.message || 'Thanh toán MoMo thất bại.'
            }

        } else if (gateway === 'vnpay') {
            // Gọi backend để xác minh kết quả VNPay
            res = await axiosClient.get(apiEndpoints.payments.vnpayReturn, { params: queryParams })
            const data = res.data
            orderId.value = data.order_id ?? null

            if (data.is_success) {
                status.value  = 'success'
                message.value = 'Thanh toán VNPay thành công!'
                uiStore.success('Thanh toán thành công!')
            } else {
                status.value  = 'failed'
                message.value = data.message || `Thanh toán thất bại (mã: ${data.response_code})`
            }

        } else {
            status.value  = 'error'
            message.value = 'Cổng thanh toán không hợp lệ.'
        }
    } catch (e: any) {
        status.value  = 'error'
        message.value = e.response?.data?.detail || 'Có lỗi xảy ra khi xác minh thanh toán.'
    }

    // Tự redirect sau 3 giây
    setTimeout(() => {
        router.push({ name: 'profile' })
    }, 3000)
})

const gatewayLabel = route.params.gateway === 'momo' ? 'MoMo' : 'VNPay'
</script>

<template>
    <div class="min-h-screen bg-background-light flex items-center justify-center px-6">
        <div class="bg-white rounded-2xl shadow-xl p-10 max-w-md w-full text-center space-y-6">

            <!-- Loading -->
            <div v-if="status === 'loading'" class="space-y-4">
                <div class="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p class="text-sm text-text-muted font-display">Đang xác minh thanh toán {{ gatewayLabel }}...</p>
            </div>

            <!-- Success -->
            <div v-else-if="status === 'success'" class="space-y-4">
                <div class="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                    <span class="material-symbols-outlined text-emerald-600 text-4xl" style="font-variation-settings:'FILL' 1">check_circle</span>
                </div>
                <h2 class="text-xl font-serif italic text-fashion-black">Thanh toán thành công!</h2>
                <p class="text-sm text-text-muted font-display">{{ message }}</p>
                <p class="text-xs text-text-muted font-display">Đang chuyển về trang đơn hàng...</p>
            </div>

            <!-- Failed -->
            <div v-else-if="status === 'failed'" class="space-y-4">
                <div class="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                    <span class="material-symbols-outlined text-red-500 text-4xl" style="font-variation-settings:'FILL' 1">cancel</span>
                </div>
                <h2 class="text-xl font-serif italic text-fashion-black">Thanh toán thất bại</h2>
                <p class="text-sm text-text-muted font-display">{{ message }}</p>
                <div class="flex gap-3 justify-center pt-2">
                    <router-link to="/cart"
                        class="px-5 py-2.5 border border-fashion-black text-fashion-black text-xs font-bold uppercase tracking-widest hover:bg-fashion-black hover:text-white transition-all">
                        Quay lại giỏ hàng
                    </router-link>
                    <router-link to="/profile"
                        class="px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-dark transition-all">
                        Xem đơn hàng
                    </router-link>
                </div>
            </div>

            <!-- Error -->
            <div v-else class="space-y-4">
                <div class="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
                    <span class="material-symbols-outlined text-amber-600 text-4xl" style="font-variation-settings:'FILL' 1">warning</span>
                </div>
                <h2 class="text-xl font-serif italic text-fashion-black">Có lỗi xảy ra</h2>
                <p class="text-sm text-text-muted font-display">{{ message }}</p>
                <router-link to="/profile"
                    class="inline-block px-5 py-2.5 bg-primary text-white text-xs font-bold uppercase tracking-widest hover:bg-primary-dark transition-all">
                    Xem đơn hàng
                </router-link>
            </div>
        </div>
    </div>
</template>
