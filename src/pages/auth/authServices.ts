import axiosClient from '@/lib/axiosClient'
import { apiEndpoints } from '@/lib/endPoints'
import axios from 'axios'
import type { AuthResponse, User } from './authTypes'
import type { LoginRequest, RegisterRequest } from './authTypes'

class AuthService {
    public getGoogleLoginUrl() {
        const backendBaseUrl =
            axiosClient.defaults.baseURL?.replace(/\/$/, '') ||
            'http://127.0.0.1:8000'

        return `${backendBaseUrl}${apiEndpoints.auth.googleLogin}`
    }

    public login(data: LoginRequest) {
        return axiosClient.post<AuthResponse>(apiEndpoints.auth.login, {
            email: data.email,
            password: data.password,
        })
    }

    public register(data: RegisterRequest) {
        return axiosClient.post<AuthResponse>(apiEndpoints.auth.register, {
            full_name: data.full_name,
            email: data.email,
            password: data.password,
            phone: data.phone?.trim() === '' ? undefined : data.phone,
        })
    }

    public loginWithGoogle(idToken: string) {
        return axiosClient.post<AuthResponse>(apiEndpoints.auth.google, {
            id_token: idToken,
        })
    }

    public completeGoogleLogin(code: string) {
        return axiosClient.get<AuthResponse>(apiEndpoints.auth.googleCallback, {
            params: { code },
        })
    }

    public getCurrentUser(accessToken?: string) {
        const backendBaseUrl =
            axiosClient.defaults.baseURL?.replace(/\/$/, '') ||
            'http://127.0.0.1:8000'

        return axios.get<User>(`${backendBaseUrl}${apiEndpoints.auth.me}`, {
            withCredentials: true,
            headers: accessToken
                ? {
                      Authorization: `Bearer ${accessToken}`,
                  }
                : undefined,
        })
    }

    public forgotPassword(email: string) {
        return axiosClient.post<{ message: string }>(apiEndpoints.auth.forgotPassword, {
            email,
        })
    }
}

export const authService = new AuthService()
