import { ref, reactive, computed, onMounted } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useAuthStore } from '@/stores/useAuthStore'

export function useUserManagement() {
    const authStore = useAuthStore()

    const users = ref<any[]>([])
    const isLoading = ref(true)
    const searchQuery = ref('')
    const currentPage = ref(1)
    const pageSize = ref(10)
    const totalUsers = ref(0)
    const totalPages = ref(0)

    const isDrawerOpen = ref(false)
    const activeTab = ref<'info' | 'points'>('info')
    const isSaving = ref(false)
    const saveError = ref('')

    const editForm = reactive({
        user_id: 0,
        full_name: '',
        phone: '',
        email: '',
        role: '',
        is_active: true,
        total_points: 0,
        created_at: '',
        account_type: '',
    })

    const pointsForm = reactive({ points_delta: 0, reason: '' })
    const isAdjustingPoints = ref(false)
    const pointsError = ref('')
    const pointsSuccess = ref('')

    const filteredUsers = computed(() => {
        const q = searchQuery.value.toLowerCase().trim()
        if (!q) return users.value
        return users.value.filter(u =>
            u.full_name?.toLowerCase().includes(q) ||
            u.email?.toLowerCase().includes(q) ||
            u.phone?.includes(q)
        )
    })

    const paginationItems = computed<(number | string)[]>(() => {
        if (totalPages.value <= 7) {
            return Array.from({ length: totalPages.value }, (_, index) => index + 1)
        }

        if (currentPage.value <= 4) {
            return [1, 2, 3, 4, 5, '...', totalPages.value]
        }

        if (currentPage.value >= totalPages.value - 3) {
            return [
                1,
                '...',
                totalPages.value - 4,
                totalPages.value - 3,
                totalPages.value - 2,
                totalPages.value - 1,
                totalPages.value,
            ]
        }

        return [1, '...', currentPage.value - 1, currentPage.value, currentPage.value + 1, '...', totalPages.value]
    })

    const isCurrentUser = computed(() => editForm.user_id === authStore.user?.user_id)

    const fetchUsers = async (page = currentPage.value) => {
        isLoading.value = true
        try {
            const res = await axiosClient.get('/api/v1/users', {
                params: { page, page_size: pageSize.value },
            })
            users.value = res.data.items || []
            currentPage.value = res.data.page || page
            totalUsers.value = res.data.total || 0
            totalPages.value = res.data.total_pages || 0
        } catch (e) {
            console.error('Lỗi lấy danh sách người dùng:', e)
        } finally {
            isLoading.value = false
        }
    }

    const goToPage = (page: number) => {
        if (page < 1 || page > totalPages.value || page === currentPage.value) return
        fetchUsers(page)
    }

    const openDrawer = (user: any) => {
        Object.assign(editForm, {
            user_id:      user.user_id,
            full_name:    user.full_name,
            phone:        user.phone || '',
            email:        user.email,
            role:         user.role,
            is_active:    user.is_active,
            total_points: user.total_points,
            created_at:   user.created_at,
            account_type: user.account_type,
        })
        pointsForm.points_delta = 0
        pointsForm.reason = ''
        pointsError.value = ''
        pointsSuccess.value = ''
        saveError.value = ''
        activeTab.value = 'info'
        isDrawerOpen.value = true
    }

    const closeDrawer = () => { isDrawerOpen.value = false }

    const handleSave = async () => {
        isSaving.value = true
        saveError.value = ''
        try {
            const res = await axiosClient.put(`/api/v1/users/${editForm.user_id}`, {
                full_name: editForm.full_name,
                phone:     editForm.phone || null,
                role:      editForm.role,
                is_active: editForm.is_active,
            })
            const idx = users.value.findIndex(u => u.user_id === editForm.user_id)
            if (idx !== -1) users.value[idx] = { ...users.value[idx], ...res.data }
            closeDrawer()
        } catch (e: any) {
            saveError.value = e.response?.data?.detail || 'Có lỗi xảy ra khi lưu.'
        } finally {
            isSaving.value = false
        }
    }

    const handleAdjustPoints = async () => {
        if (!pointsForm.points_delta || !pointsForm.reason.trim()) {
            pointsError.value = 'Vui lòng nhập số điểm và lý do.'
            return
        }
        isAdjustingPoints.value = true
        pointsError.value = ''
        pointsSuccess.value = ''
        try {
            await axiosClient.post(`/api/v1/users/${editForm.user_id}/reward-adjust`, {
                points_delta: Number(pointsForm.points_delta),
                reason: pointsForm.reason.trim(),
            })
            editForm.total_points += Number(pointsForm.points_delta)
            const idx = users.value.findIndex(u => u.user_id === editForm.user_id)
            if (idx !== -1) users.value[idx].total_points = editForm.total_points
            pointsSuccess.value = `Đã ${Number(pointsForm.points_delta) > 0 ? 'cộng' : 'trừ'} ${Math.abs(Number(pointsForm.points_delta))} điểm thành công.`
            pointsForm.points_delta = 0
            pointsForm.reason = ''
        } catch (e: any) {
            pointsError.value = e.response?.data?.detail || 'Có lỗi xảy ra.'
        } finally {
            isAdjustingPoints.value = false
        }
    }

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'N/A'
        return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
    }

    const roleLabel: Record<string, string> = { admin: 'Admin', staff: 'Staff', customer: 'Khách hàng' }

    onMounted(fetchUsers)

    return {
        authStore,
        users,
        isLoading,
        searchQuery,
        currentPage,
        pageSize,
        totalUsers,
        totalPages,
        isDrawerOpen,
        activeTab,
        isSaving,
        saveError,
        editForm,
        pointsForm,
        isAdjustingPoints,
        pointsError,
        pointsSuccess,
        filteredUsers,
        paginationItems,
        isCurrentUser,
        fetchUsers,
        goToPage,
        openDrawer,
        closeDrawer,
        handleSave,
        handleAdjustPoints,
        formatDate,
        roleLabel
    }
}
