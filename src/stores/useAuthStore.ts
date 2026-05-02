import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface UserInfo {
    user_id: number
    email: string
    full_name: string
    role: string
    is_active: boolean
}

export const useAuthStore = defineStore('auth', () => {
    const user = ref<UserInfo | null>(
        JSON.parse(localStorage.getItem('user_info') || 'null')
    )
    const token = ref<string | null>(localStorage.getItem('access_token'))

    const isAuthenticated = computed(() => !!token.value)
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

    function logout() {
        user.value = null
        token.value = null
        localStorage.removeItem('user_info')
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
    }

    return { user, token, isAuthenticated, isAdmin, isStaff, userName, setAuth, logout }
})
