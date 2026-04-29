import { defineStore } from 'pinia'

export interface UserInfo {
    user_id: number
    email: string
    full_name: string
    role: string
    is_active: boolean
}

export const useAuthStore = defineStore('auth', {
    state: () => ({
        user: JSON.parse(localStorage.getItem('user_info') || 'null') as UserInfo | null,
        token: localStorage.getItem('access_token') || null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        isAdmin: (state) => state.user?.role?.toLowerCase() === 'admin',
        userName: (state) => state.user?.full_name || 'User',
    },

    actions: {
        setAuth(user: UserInfo, token: string) {
            this.user = user
            this.token = token
            localStorage.setItem('user_info', JSON.stringify(user))
            localStorage.setItem('access_token', token)
        },

        logout() {
            this.user = null
            this.token = null
            localStorage.removeItem('user_info')
            localStorage.removeItem('access_token')
            localStorage.removeItem('refresh_token')
        }
    }
})
