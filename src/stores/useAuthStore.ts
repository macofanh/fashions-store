import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authService } from '@/pages/auth/authServices'

export interface UserInfo {
    user_id: number
    email: string
    full_name: string
    phone?: string | null
    avatar_url?: string | null
    height_cm?: number | null
    weight_kg?: number | null
    role: string
    account_type?: string
    total_points?: number
    created_at?: string
    is_active?: boolean
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserInfo | null>(
        JSON.parse(localStorage.getItem('user_info') || 'null')
    )
    const token = ref<string | null>(localStorage.getItem('access_token'))

    const isAuthenticated = computed(() => !!token.value || !!user.value)
    const isAdmin = computed(() => user.value?.role?.toLowerCase() === 'admin')
    const isStaff = computed(() =>
        ['admin', 'staff'].includes(user.value?.role?.toLowerCase() ?? '')
    )
    const userName = computed(() => user.value?.full_name || 'User')

    function setAuth(userInfo: UserInfo, accessToken: string) {
        user.value = userInfo
        token.value = accessToken
        localStorage.setItem('user_info', JSON.stringify(userInfo))
        localStorage.setItem('access_token', accessToken)
    }

    function hydrateUser(userInfo: UserInfo) {
        user.value = userInfo
        localStorage.setItem('user_info', JSON.stringify(userInfo))
    }

    function hydrateTokens(accessToken: string, refreshToken?: string) {
        token.value = accessToken
        localStorage.setItem('access_token', accessToken)

        if (refreshToken) {
            localStorage.setItem('refresh_token', refreshToken)
        }
    }

    async function bootstrapAuth() {
        if (user.value && token.value) {
            return
        }

        if (!token.value && !user.value) {
            try {
                const response = await authService.getCurrentUser()
                hydrateUser(response.data)
            } catch {
                return
            }
            return
        }

        if (token.value && !user.value) {
            try {
                const response = await authService.getCurrentUser(token.value)
                hydrateUser(response.data)
            } catch {
                return
            }
        }
    }

    function logout() {
        user.value = null
        token.value = null
        localStorage.removeItem('user_info')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    }

    return {
        user,
        token,
        isAuthenticated,
        isAdmin,
        isStaff,
        userName,
        setAuth,
        hydrateUser,
        hydrateTokens,
        bootstrapAuth,
        logout,
    }
})
