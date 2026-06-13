export interface User {
    user_id: number
    email: string
    full_name: string
    phone?: string
    avatar_url?: string
    height_cm?: number | null
    weight_kg?: number | null
    role: string
    account_type: string
    total_points: number
    created_at: string
}

export interface AuthResponse {
    access_token: string
    refresh_token: string
    token_type: string
    user: User
}

export class LoginRequest {
    email = ''
    password = ''
}

export class RegisterRequest {
    full_name = ''
    email = ''
    password = ''
    phone? = ''
    confirmPassword = ''
}

export interface RegisterPendingResponse {
    message: string
    email: string
    expires_in: number
    resend_after: number
}

export interface VerifyEmailRequest {
    email: string
    code: string
}

export interface VerifyEmailResponse {
    message: string
}

export interface ResendVerificationResponse {
    message: string
    email?: string
    expires_in?: number
    resend_after?: number
}
