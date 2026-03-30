<script setup lang="ts">
import { ref } from 'vue'
import { useAuth } from '../useAuth'

const { login, isLoading, error: authError } = useAuth()

const email = ref('')
const password = ref('')
const showPassword = ref(false)
const rememberMe = ref(false)

const handleLogin = async () => {
    try {
        await login({ email: email.value, password: password.value })
        console.log('Login success!')
    } catch (err) {
        // Lỗi đã được xử lý trong useAuth.ts và lưu vào authError
        console.error('Login error:', err)
    }
}

const togglePassword = () => {
    showPassword.value = !showPassword.value
}
</script>

<template>
    <main class="flex-1 w-full min-h-[calc(100vh-80px)] flex flex-col lg:flex-row">
        <!-- Left Side: Editorial Image -->
        <div class="relative hidden lg:flex w-full lg:w-1/2 bg-gray-100 items-center justify-center overflow-hidden">
            <div 
                class="absolute inset-0 z-0 w-full h-full bg-cover bg-center transition-transform duration-700 hover:scale-105" 
                style="background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuBc-CochkjCTYvlLXrp2FkSy9Xrj6YZdc6eVYZ7IFa-dIALh9PnjgrI5aOGrdk069Yczc-SfdVXGsmvBcoAJ3jq3P-TSsKICW3Hqt6qjzVdyk46NBAyM8p2gvfR6myvMNCLYuWoY93IarJYwEIVQcsOX_Sz8ARjAF4F_-DKSd2O8YnipS8X19J1y2fSNwaMaurk1LFPIOR1oEOsec-aQZtD-cK1_2kp2bBVI2WBNksl1EAqxH1Y64-RGlMgC6QtFK9xAQkiNdGqaCOa');"
            ></div>
            <div class="absolute inset-0 bg-[#dcd7cd]/30 z-10"></div>
            <div class="relative z-20 text-center p-12 text-white drop-shadow-md">
                <h2 class="text-6xl font-serif italic mb-4">Winter Collection</h2>
                <p class="text-lg font-light tracking-wider uppercase">Discover the new standard of luxury</p>
            </div>
        </div>

        <!-- Right Side: Auth Form -->
        <div class="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white px-6 py-12 lg:p-20">
            <div class="w-full max-w-[440px] flex flex-col gap-8">
                <!-- Header -->
                <div class="text-center lg:text-left">
                    <h1 class="text-4xl lg:text-5xl font-serif font-medium text-fashion-black mb-3">Welcome Back</h1>
                    <p class="text-gray-500 font-display text-sm">Please enter your details to sign in.</p>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-neutral-border w-full">
                    <button class="flex-1 pb-4 text-center text-sm font-semibold tracking-wide border-b-2 border-fashion-black text-fashion-black transition-colors">
                        SIGN IN
                    </button>
                    <router-link to="/auth/register" class="flex-1 pb-4 text-center text-sm font-medium tracking-wide border-b-2 border-transparent text-gray-400 hover:text-fashion-black transition-colors">
                        REGISTER
                    </router-link>
                </div>

                <!-- Error Message -->
                <div v-if="authError" class="bg-red-50 text-red-600 p-3 text-sm border border-red-100 flex items-center gap-2 mt-4">
                    <span class="material-symbols-outlined text-[18px]">error</span>
                    {{ authError }}
                </div>

                <!-- Form -->
                <form class="flex flex-col gap-5 mt-2" @submit.prevent="handleLogin">
                    <!-- Email Input -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-fashion-black" for="email">Email Address</label>
                        <input 
                            v-model="email"
                            class="w-full h-12 border border-gray-300 px-4 bg-white text-fashion-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-fashion-black focus:border-fashion-black transition-all" 
                            id="email" 
                            placeholder="name@example.com" 
                            type="email"
                            required
                        />
                    </div>

                    <!-- Password Input -->
                    <div class="flex flex-col gap-1.5">
                        <div class="flex justify-between items-center">
                            <label class="text-xs font-bold uppercase tracking-wider text-fashion-black" for="password">Password</label>
                            <a class="text-xs text-gray-500 hover:text-fashion-black underline decoration-1 underline-offset-2" href="#">Forgot Password?</a>
                        </div>
                        <div class="relative">
                            <input 
                                v-model="password"
                                :type="showPassword ? 'text' : 'password'"
                                class="w-full h-12 border border-gray-300 px-4 bg-white text-fashion-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-fashion-black focus:border-fashion-black transition-all" 
                                id="password" 
                                placeholder="••••••••"
                                required
                            />
                            <button 
                                @click="togglePassword"
                                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-fashion-black" 
                                type="button"
                            >
                                <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Remember Me -->
                    <div class="flex items-center gap-2">
                        <input 
                            v-model="rememberMe"
                            class="w-4 h-4 border-gray-300 text-fashion-black focus:ring-fashion-black" 
                            id="remember" 
                            type="checkbox"
                        />
                        <label class="text-sm text-gray-600 select-none cursor-pointer" for="remember">Keep me signed in</label>
                    </div>

                    <!-- Submit Button -->
                    <button 
                        :disabled="isLoading"
                        class="mt-2 w-full h-12 bg-fashion-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2" 
                        type="submit"
                    >
                        {{ isLoading ? 'Signing In...' : 'Sign In' }}
                        <span v-if="!isLoading" class="material-symbols-outlined text-[18px]">arrow_forward</span>
                        <span v-else class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    </button>
                </form>

                <!-- Divider -->
                <div class="relative flex py-2 items-center">
                    <div class="flex-grow border-t border-neutral-border"></div>
                    <span class="flex-shrink-0 mx-4 text-gray-400 text-xs uppercase tracking-wide">Or continue with</span>
                    <div class="flex-grow border-t border-neutral-border"></div>
                </div>

                <!-- Social Login -->
                <div class="grid grid-cols-2 gap-4">
                    <button class="flex items-center justify-center gap-2 h-12 border border-gray-300 hover:border-fashion-black hover:bg-gray-50 transition-all" type="button">
                        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M21.35 11.1H12v3.13h5.24c-.22 1.2-1.07 2.44-2.26 3.09v2.55h3.64c2.13-1.96 3.36-4.86 3.36-8.23 0-.58-.05-1.15-.13-1.54z" fill="#4285F4"></path>
                            <path d="M12 21c2.63 0 4.84-.87 6.45-2.36l-3.64-2.55c-.87.58-2 .92-3.32.92-2.56 0-4.73-1.73-5.51-4.05H2.47v2.66C4.1 19.33 7.78 21 12 21z" fill="#34A853"></path>
                            <path d="M6.49 12.97c-.2-.6-.31-1.24-.31-1.9s.11-1.3.31-1.9V6.51H2.47C1.57 8.3 1.06 10.3 1.06 12.42s.51 4.12 1.41 5.91l4.02-2.66z" fill="#FBBC05"></path>
                            <path d="M12 5.38c1.43 0 2.72.49 3.73 1.45l2.8-2.8C16.84 2.39 14.63 1.5 12 1.5 7.78 1.5 4.1 3.67 2.47 6.51l4.02 2.66c.78-2.32 2.95-4.05 5.51-4.05z" fill="#EA4335"></path>
                        </svg>
                        <span class="text-sm font-medium text-fashion-black">Google</span>
                    </button>
                    <button class="flex items-center justify-center gap-2 h-12 border border-gray-300 hover:border-fashion-black hover:bg-gray-50 transition-all" type="button">
                        <svg class="w-5 h-5 text-fashion-black" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.05 20.28c-.98.95-2.05.88-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.78 1.18-.19 2.31-.89 3.51-.84 1.54.06 2.68.75 3.37 1.74-2.92 1.76-2.42 6.09.56 7.28-.65 1.63-1.57 3.19-2.52 4.01zm-3.27-14.7c1.3-1.6 2.18-3.06 1.94-4.88-1.74.07-3.46 1.15-4.5 2.42-.93 1.12-1.73 2.9-.84 4.75 1.73.13 3.03-1.09 3.4-2.29z"></path>
                        </svg>
                        <span class="text-sm font-medium text-fashion-black">Apple</span>
                    </button>
                </div>
            </div>
            <div class="mt-8 text-center text-xs text-gray-400">
                <p>By signing in, you agree to our <a class="underline hover:text-fashion-black" href="#">Terms of Service</a> and <a class="underline hover:text-fashion-black" href="#">Privacy Policy</a>.</p>
            </div>
        </div>
    </main>
</template>

<style scoped>
/* Bạn có thể thêm các style local nếu cần */
</style>
