import { computed } from 'vue'
import type { User } from './authTypes'

export type UserRole = 'customer' | 'staff' | 'admin'

export function usePermission() {
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

    const currentUser = getCurrentUser()

    const isAdmin    = computed(() => currentUser?.role === 'admin')
    const isStaff    = computed(() => currentUser?.role === 'staff')
    const isCustomer = computed(() => currentUser?.role === 'customer')
    const isLoggedIn = computed(() => !!currentUser)

    const hasRole = (...roles: UserRole[]): boolean => {
        if (!currentUser?.role) return false
        return roles.includes(currentUser.role as UserRole)
    }

    return { currentUser, isAdmin, isStaff, isCustomer, isLoggedIn, hasRole }
}
