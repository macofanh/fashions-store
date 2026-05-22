import { ref, computed, onMounted, watch } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useUIStore } from '@/stores/useUIStore'
import { notificationService } from '@/pages/notifications/notificationService'

export function useOrderManagement() {
    const uiStore = useUIStore()

    const orders = ref<any[]>([])
    const isLoading = ref(true)
    const searchQuery = ref('')
    const filterStatus = ref('')
    const filterPaymentMethod = ref('')  // '' | 'COD' | 'ONLINE'

    // ── Chi tiết đơn hàng ─────────────────────────────────────────
    const selectedOrder = ref<any>(null)
    const isDrawerOpen  = ref(false)
    const isLoadingDetail = ref(false)

    const openDetail = async (order: any) => {
        isDrawerOpen.value  = true
        isLoadingDetail.value = true
        selectedOrder.value = order // hiện ngay dữ liệu cơ bản
        try {
            // Gọi lại để lấy đầy đủ items, payment, shipping, status_logs
            const res = await axiosClient.get(`/api/v1/orders/${order.order_id}?mine_only=false`)
            selectedOrder.value = res.data
        } catch (e) {
            console.error('Lỗi lấy chi tiết đơn:', e)
        } finally {
            isLoadingDetail.value = false
        }
    }

    const closeDrawer = () => {
        isDrawerOpen.value  = false
        selectedOrder.value = null
    }

    const fetchAllOrders = async () => {
        isLoading.value = true
        try {
            const params: any = { mine_only: false }
            if (filterStatus.value) params.status = filterStatus.value
            if (filterPaymentMethod.value) params.payment_method = filterPaymentMethod.value
            if (searchQuery.value.trim()) params.search = searchQuery.value.trim()

            const response = await axiosClient.get('/api/v1/orders/my', { params })
            orders.value = response.data
        } catch (error) {
            console.error('Lỗi lấy danh sách đơn hàng:', error)
        } finally {
            isLoading.value = false
        }
    }

    // Với Server-side filtering, filteredOrders chỉ đơn giản trả về orders
    // nhưng ta giữ lại để tránh break template hiện tại.
    const filteredOrders = computed(() => orders.value)

    // Tự động tải lại khi filter thay đổi (Debounce search để tránh gọi API quá nhiều)
    let searchTimeout: any = null
    watch([filterStatus, filterPaymentMethod], () => {
        fetchAllOrders()
    })
    watch(searchQuery, () => {
        if (searchTimeout) clearTimeout(searchTimeout)
        searchTimeout = setTimeout(() => {
            fetchAllOrders()
        }, 500) // Đợi 500ms sau khi ngừng gõ mới gọi API
    })

    const getOrderForNotification = async (orderId: number) => {
        const existingOrder = orders.value.find(o => o.order_id === orderId)
        if (existingOrder?.user_id) return existingOrder
        if (selectedOrder.value?.order_id === orderId && selectedOrder.value.user_id) {
            return selectedOrder.value
        }

        const response = await axiosClient.get(`/api/v1/orders/${orderId}?mine_only=false`)
        return response.data
    }

    const createOrderStatusNotification = async (orderId: number, newStatus: string) => {
        const order = await getOrderForNotification(orderId)
        if (!order?.user_id) {
            throw new Error('Không tìm thấy user của đơn hàng.')
        }

        const statusLabel = statusConfig[newStatus]?.label || newStatus
        await notificationService.createNotification({
            user_id: order.user_id,
            type: 'ORDER_STATUS_UPDATED',
            title: 'Cập nhật trạng thái đơn hàng',
            body: `Đơn hàng ${order.order_code || `#${order.order_id}`} đã chuyển sang trạng thái "${statusLabel}".`,
            ref_type: 'order',
            ref_id: order.order_id,
        })
    }

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            const res = await axiosClient.put(`/api/v1/orders/${orderId}/status`, {
                to_status: newStatus,
                note: 'Cập nhật bởi Admin'
            })
            // Dùng response trả về (đã có payment_status mới) để cập nhật local state
            const updatedOrder = res.data
            const idx = orders.value.findIndex(o => o.order_id === orderId)
            if (idx !== -1) {
                orders.value[idx] = { ...orders.value[idx], ...updatedOrder }
            }
            if (selectedOrder.value?.order_id === orderId) {
                selectedOrder.value = { ...selectedOrder.value, ...updatedOrder }
            }
            uiStore.success('Cập nhật trạng thái thành công.')

            try {
                await createOrderStatusNotification(orderId, newStatus)
            } catch (notificationError) {
                console.error('Lỗi tạo thông báo trạng thái đơn hàng:', notificationError)
                uiStore.error('Đã cập nhật trạng thái, nhưng chưa tạo được thông báo cho khách hàng.')
            }
        } catch (error: any) {
            uiStore.error(error.response?.data?.detail || 'Cập nhật thất bại.')
        }
    }

    const statusConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
        PENDING:   { label: 'Chờ xử lý',   bg: 'bg-amber-50',   text: 'text-amber-700',  dot: 'bg-amber-400'  },
        CONFIRMED: { label: 'Đã xác nhận', bg: 'bg-blue-50',    text: 'text-blue-700',   dot: 'bg-blue-400'   },
        SHIPPING:  { label: 'Đang giao',   bg: 'bg-indigo-50',  text: 'text-indigo-700', dot: 'bg-indigo-400' },
        DELIVERED: { label: 'Đã giao',     bg: 'bg-emerald-50', text: 'text-emerald-700',dot: 'bg-emerald-400'},
        CANCELLED: { label: 'Đã hủy',      bg: 'bg-red-50',     text: 'text-red-700',    dot: 'bg-red-400'    },
        REFUNDED:  { label: 'Hoàn tiền',   bg: 'bg-slate-100',  text: 'text-slate-600',  dot: 'bg-slate-400'  },
    }

    // Config hiển thị phương thức thanh toán
    const paymentMethodConfig: Record<string, { label: string; icon: string; bg: string; text: string }> = {
        COD:         { label: 'COD',     icon: 'payments',               bg: 'bg-slate-100',   text: 'text-slate-600'  },
        QR_CODE:     { label: 'QR',      icon: 'qr_code',                bg: 'bg-cyan-50',     text: 'text-cyan-700'   },
        MOMO:        { label: 'MoMo',    icon: 'account_balance_wallet', bg: 'bg-pink-50',     text: 'text-pink-600'   },
        VNPAY:       { label: 'VNPay',   icon: 'credit_card',            bg: 'bg-blue-50',     text: 'text-blue-600'   },
        SEPAY:       { label: 'SePay',   icon: 'qr_code_2',              bg: 'bg-indigo-50',   text: 'text-indigo-600' },
        CREDIT_CARD: { label: 'Thẻ',     icon: 'credit_card',            bg: 'bg-violet-50',   text: 'text-violet-600' },
    }

    const paymentStatusConfig: Record<string, { label: string; cls: string }> = {
        PENDING:  { label: 'Chờ thanh toán', cls: 'bg-amber-50 text-amber-700'   },
        PAID:     { label: 'Đã thanh toán',  cls: 'bg-emerald-50 text-emerald-700'},
        FAILED:   { label: 'Thất bại',       cls: 'bg-red-50 text-red-600'        },
        REFUNDED: { label: 'Đã hoàn tiền',   cls: 'bg-slate-100 text-slate-600'   },
    }

    const statusFlow = ['PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED', 'REFUNDED']

    const formatPrice = (price: number) =>
        new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    const formatDateShort = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })

    // Stats — thêm đếm theo nhóm thanh toán
    const stats = computed(() => ({
        total:     orders.value.length,
        pending:   orders.value.filter(o => o.status === 'PENDING').length,
        shipping:  orders.value.filter(o => o.status === 'SHIPPING').length,
        delivered: orders.value.filter(o => o.status === 'DELIVERED').length,
        cod:       orders.value.filter(o => o.payment_method === 'COD').length,
        online:    orders.value.filter(o => o.payment_method !== 'COD').length,
        unpaid:    orders.value.filter(o => o.payment_method === 'COD' && o.payment_status === 'PENDING' && o.status !== 'CANCELLED').length,
    }))

    onMounted(fetchAllOrders)

    return {
        uiStore,
        orders,
        isLoading,
        searchQuery,
        filterStatus,
        filterPaymentMethod,
        selectedOrder,
        isDrawerOpen,
        isLoadingDetail,
        openDetail,
        closeDrawer,
        fetchAllOrders,
        filteredOrders,
        handleUpdateStatus,
        statusConfig,
        paymentStatusConfig,
        paymentMethodConfig,
        statusFlow,
        formatPrice,
        formatDate,
        formatDateShort,
        stats
    }
}
