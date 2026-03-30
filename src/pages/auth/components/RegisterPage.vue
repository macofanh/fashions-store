<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useAuth } from '../useAuth'

const { register, isLoading, error: authError } = useAuth()

const formData = reactive({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
})

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const validationError = ref<string | null>(null)

const handleRegister = async () => {
    validationError.value = null
    
    // Validate đơn giản phía client
    if (formData.password !== formData.confirmPassword) {
        validationError.value = 'Mật khẩu xác nhận không khớp'
        return
    }

    try {
        await register({
            full_name: formData.full_name,
            email: formData.email,
            phone: formData.phone || undefined,
            password: formData.password
        })
        console.log('Registration success!')
    } catch (err) {
        console.error('Registration error:', err)
    }
}

const togglePassword = () => (showPassword.value = !showPassword.value)
const toggleConfirmPassword = () => (showConfirmPassword.value = !showConfirmPassword.value)
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
                <h2 class="text-6xl font-serif italic mb-4">Join Us</h2>
                <p class="text-lg font-light tracking-wider uppercase">Become a part of our fashion community</p>
            </div>
        </div>

        <!-- Right Side: Auth Form -->
        <div class="w-full lg:w-1/2 flex flex-col justify-center items-center bg-white px-6 py-12 lg:p-20">
            <div class="w-full max-w-[440px] flex flex-col gap-8">
                <!-- Header -->
                <div class="text-center lg:text-left">
                    <h1 class="text-4xl lg:text-5xl font-serif font-medium text-fashion-black mb-3">Create Account</h1>
                    <p class="text-gray-500 font-display text-sm">Fill in the information below to register.</p>
                </div>

                <!-- Tabs -->
                <div class="flex border-b border-neutral-border w-full">
                    <router-link to="/auth/login" class="flex-1 pb-4 text-center text-sm font-medium tracking-wide border-b-2 border-transparent text-gray-400 hover:text-fashion-black transition-colors">
                        SIGN IN
                    </router-link>
                    <button class="flex-1 pb-4 text-center text-sm font-semibold tracking-wide border-b-2 border-fashion-black text-fashion-black transition-colors">
                        REGISTER
                    </button>
                </div>

                <!-- Error Messages -->
                <div v-if="authError || validationError" class="bg-red-50 text-red-600 p-3 text-sm border border-red-100 flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">error</span>
                    {{ authError || validationError }}
                </div>

                <!-- Form -->
                <form class="flex flex-col gap-4 mt-2" @submit.prevent="handleRegister">
                    <!-- Full Name -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-fashion-black" for="fullname">Full Name</label>
                        <input 
                            v-model="formData.full_name"
                            class="w-full h-12 border border-gray-300 px-4 bg-white text-fashion-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-fashion-black focus:border-fashion-black transition-all" 
                            id="fullname" 
                            placeholder="Your name" 
                            type="text"
                            required
                        />
                    </div>

                    <!-- Email -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-fashion-black" for="email">Email Address</label>
                        <input 
                            v-model="formData.email"
                            class="w-full h-12 border border-gray-300 px-4 bg-white text-fashion-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-fashion-black focus:border-fashion-black transition-all" 
                            id="email" 
                            placeholder="name@example.com" 
                            type="email"
                            required
                        />
                    </div>

                    <!-- Phone (Optional) -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-fashion-black" for="phone">Phone Number</label>
                        <input 
                            v-model="formData.phone"
                            class="w-full h-12 border border-gray-300 px-4 bg-white text-fashion-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-fashion-black focus:border-fashion-black transition-all" 
                            id="phone" 
                            placeholder="0123-456-789" 
                            type="tel"
                        />
                    </div>

                    <!-- Password -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-fashion-black" for="password">Password</label>
                        <div class="relative">
                            <input 
                                v-model="formData.password"
                                :type="showPassword ? 'text' : 'password'"
                                class="w-full h-12 border border-gray-300 px-4 bg-white text-fashion-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-fashion-black focus:border-fashion-black transition-all" 
                                id="password" 
                                placeholder="Min 8 characters, 1 uppercase, 1 digit"
                                required
                            />
                            <button @click="togglePassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" type="button">
                                <span class="material-symbols-outlined text-[20px]">{{ showPassword ? 'visibility_off' : 'visibility' }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Confirm Password -->
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-bold uppercase tracking-wider text-fashion-black" for="confirm-password">Confirm Password</label>
                        <div class="relative">
                            <input 
                                v-model="formData.confirmPassword"
                                :type="showConfirmPassword ? 'text' : 'password'"
                                class="w-full h-12 border border-gray-300 px-4 bg-white text-fashion-black placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-fashion-black focus:border-fashion-black transition-all" 
                                id="confirm-password" 
                                placeholder="Confirm your password"
                                required
                            />
                            <button @click="toggleConfirmPassword" class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" type="button">
                                <span class="material-symbols-outlined text-[20px]">{{ showConfirmPassword ? 'visibility_off' : 'visibility' }}</span>
                            </button>
                        </div>
                    </div>

                    <!-- Submit Button -->
                    <button 
                        :disabled="isLoading"
                        class="mt-4 w-full h-12 bg-fashion-black text-white text-sm font-bold uppercase tracking-widest hover:bg-gray-800 transition-colors disabled:bg-gray-400 flex items-center justify-center gap-2" 
                        type="submit"
                    >
                        {{ isLoading ? 'Creating Account...' : 'Register Now' }}
                        <span v-if="!isLoading" class="material-symbols-outlined text-[18px]">arrow_forward</span>
                        <span v-else class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                    </button>
                </form>

                <!-- Footer -->
                <p class="text-center text-xs text-gray-400">
                    Already have an account? 
                    <router-link to="/auth/login" class="underline hover:text-fashion-black">Sign In</router-link>
                </p>
            </div>
        </div>
    </main>
</template>
