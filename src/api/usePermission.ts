// src/api/usePermission.ts (hoặc đường dẫn tương ứng của bạn)
import { computed } from 'vue'
import type { User } from '@/pages/auth/authTypes' // Import Interface User chuẩn

export type UserRole = 'customer' | 'staff' | 'admin'

export function usePermission() {
    // Hàm nội bộ để lấy và parse thông tin user từ localStorage một cách an toàn
    const getCurrentUser = (): User | null => {
        const userInfoStr = localStorage.getItem('user_info')
        if (!userInfoStr) return null

        try {
            return JSON.parse(userInfoStr) as User
        } catch (error) {
            console.error('Lỗi đọc dữ liệu user từ localStorage', error)
            return null
        }
    }

    // Lấy user hiện tại
    const currentUser = getCurrentUser()

    // Sử dụng computed để kiểm tra quyền (giúp linh hoạt nếu sau này bạn dùng thêm State Management như Pinia)
    const isAdmin = computed(() => currentUser?.role === 'admin')
    const isStaff = computed(() => currentUser?.role === 'staff')
    const isCustomer = computed(() => currentUser?.role === 'customer')
    const isLoggedIn = computed(() => !!currentUser)

    /** * Trả về true nếu user có ít nhất một trong các role được chỉ định
     * Cách dùng: hasRole('admin', 'staff')
     */
    const hasRole = (...roles: UserRole[]): boolean => {
        if (!currentUser || !currentUser.role) return false
        return roles.includes(currentUser.role as UserRole)
    }

    // Export thêm currentUser ra ngoài để giao diện có thể hiển thị tên, avatar (vd: Xin chào, {currentUser.full_name})
    return {
        currentUser,
        isAdmin,
        isStaff,
        isCustomer,
        isLoggedIn,
        hasRole,
    }
}
