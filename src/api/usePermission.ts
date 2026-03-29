// import { computed } from 'vue'
// import { useAuth } from '@/pages/auth/useAuth'

// export type UserRole = 'customer' | 'staff' | 'admin'

// export function usePermission() {
//     const authStore = useAuth()

//     // Kiểm tra role dựa vào object user trả về từ BE
//     const isAdmin = computed(() => authStore.user?.role === 'admin')
//     const isStaff = computed(() => authStore.user?.role === 'staff')
//     const isCustomer = computed(() => authStore.user?.role === 'customer')
//     const isLoggedIn = computed(() => !!authStore.user)

//     // Trả về true nếu user có ít nhất một trong các role được chỉ định 
//     const hasRole = (...roles: UserRole[]): boolean => {
//         if (!authStore.user) return false
//         return roles.includes(authStore.user.role as UserRole)
//     }

//     return { isAdmin, isStaff, isCustomer, isLoggedIn, hasRole }
// }
