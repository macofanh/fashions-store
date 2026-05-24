import { ref } from 'vue'
import { homeServices } from './homeServices'
import { useAuthStore } from '@/stores/useAuthStore'
import type { Product } from '@/pages/products/types/product.types'
import type { Voucher } from '@/pages/promotions/promotionService'

export function homeHandler() {
    const authStore = useAuthStore()

    // ── State ──────────────────────────────────────────────────────
    const products          = ref<Product[]>([])
    const isLoadingProducts = ref(true)
    const vouchers          = ref<Voucher[]>([])
    const claimedIds        = ref<Set<number>>(new Set())
    const claimingId        = ref<number | null>(null)

    // ── Actions ────────────────────────────────────────────────────
    const loadFeaturedProducts = async () => {
        isLoadingProducts.value = true
        try {
            const res = await homeServices.getFeaturedProducts()
            products.value = res.data.items
        } catch (e) {
            console.error('Lỗi lấy sản phẩm:', e)
        } finally {
            isLoadingProducts.value = false
        }
    }

    const loadVouchers = async () => {
        try {
            const res = await homeServices.getActiveVouchers()
            const now = new Date()
            vouchers.value = res.data.filter(v =>
                v.is_active &&
                new Date(v.end_date) > now &&
                (v.usage_limit == null || v.used_count < v.usage_limit)
            )
        } catch (e) {
            console.error('Lỗi lấy voucher:', e)
        }
    }

    const loadMyVouchers = async () => {
        if (!authStore.isAuthenticated) return
        try {
            const res = await homeServices.getMyVouchers()
            res.data.forEach(uv => claimedIds.value.add(uv.voucher_id))
        } catch { /* bỏ qua nếu chưa đăng nhập */ }
    }

    const claimVoucher = async (voucher: Voucher) => {
        if (!authStore.isAuthenticated) {
            window.location.href = '/auth/login'
            return
        }
        if (claimedIds.value.has(voucher.voucher_id) || claimingId.value) return

        claimingId.value = voucher.voucher_id
        try {
            await homeServices.claimVoucher(voucher.voucher_id)
            claimedIds.value.add(voucher.voucher_id)
        } catch (e: any) {
            // 409 = đã lưu rồi → vẫn đánh dấu
            if (e.response?.status === 409) claimedIds.value.add(voucher.voucher_id)
        } finally {
            claimingId.value = null
        }
    }

    /** Gọi tất cả khi mount trang chủ */
    const initHomePage = () => {
        loadFeaturedProducts()
        loadVouchers()
        loadMyVouchers()
    }

    return {
        // state
        products,
        isLoadingProducts,
        vouchers,
        claimedIds,
        claimingId,
        // actions
        initHomePage,
        claimVoucher,
    }
}
