import { ref, computed, onMounted } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useUIStore } from '@/stores/useUIStore'

export function useOrderManagement() {
    const uiStore = useUIStore()

    const orders = ref<any[]>([])
    const isLoading = ref(true)
    const searchQuery = ref('')
    const filterStatus = ref('')

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
            const response = await axiosClient.get('/api/v1/orders/my?mine_only=false')
            orders.value = response.data
        } catch (error) {
            console.error('Lỗi lấy danh sách đơn hàng:', error)
        } finally {
            isLoading.value = false
        }
    }

    const filteredOrders = computed(() => {
        let list = orders.value
        if (filterStatus.value) list = list.filter(o => o.status === filterStatus.value)
        if (searchQuery.value.trim()) {
            const q = searchQuery.value.toLowerCase()
            list = list.filter(o =>
                o.order_code?.toLowerCase().includes(q) ||
                o.address_snapshot?.recipient_name?.toLowerCase().includes(q) ||
                o.address_snapshot?.phone?.includes(q)
            )
        }
        return list
    })

    const handleUpdateStatus = async (orderId: number, newStatus: string) => {
        try {
            await axiosClient.put(`/api/v1/orders/${orderId}/status`, {
                to_status: newStatus,
                note: 'Cập nhật bởi Admin'
            })
            // Cập nhật cả list và drawer
            const order = orders.value.find(o => o.order_id === orderId)
            if (order) order.status = newStatus
            if (selectedOrder.value?.order_id === orderId) {
                selectedOrder.value.status = newStatus
            }
            uiStore.success('Cập nhật trạng thái thành công.')
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

    // Stats
    const stats = computed(() => ({
        total:     orders.value.length,
        pending:   orders.value.filter(o => o.status === 'PENDING').length,
        shipping:  orders.value.filter(o => o.status === 'SHIPPING').length,
        delivered: orders.value.filter(o => o.status === 'DELIVERED').length,
    }))

    onMounted(fetchAllOrders)

    return {
        uiStore,
        orders,
        isLoading,
        searchQuery,
        filterStatus,
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
        statusFlow,
        formatPrice,
        formatDate,
        formatDateShort,
        stats
    }
}
