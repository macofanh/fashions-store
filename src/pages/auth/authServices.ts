import axiosClient from '@/lib/axiosClient'
import { apiEndpoints } from '@/lib/endPoints'
import type { AuthResponse } from './authTypes'
import type { LoginRequest, RegisterRequest } from './authTypes'

class AuthService {
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
}

export const authService = new AuthService()
