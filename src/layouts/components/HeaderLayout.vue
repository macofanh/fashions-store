<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isScrolled = ref(false)
const isAuthenticated = ref(!!localStorage.getItem('access_token'))

onMounted(() => {
    window.addEventListener('scroll', () => {
        isScrolled.value = window.scrollY > 50
    })
})

const handleLogout = () => {
    localStorage.removeItem('access_token')
    localStorage.removeItem('user_info')
    isAuthenticated.value = false
    router.push({ name: 'login' })
}
</script>

<template>
    <header 
        :class="[
            'fixed top-0 left-0 w-full z-[100] transition-all duration-700 px-6 md:px-12 py-6 flex justify-between items-center',
            isScrolled ? 'bg-white/90 backdrop-blur-md py-4 border-b border-zinc-100 shadow-sm' : 'bg-transparent'
        ]"
    >
        <!-- Mobile Menu Icon -->
        <button class="md:hidden text-zinc-900">
            <span class="material-symbols-outlined">menu</span>
        </button>

        <!-- Navigation -->
        <nav class="hidden md:flex gap-10">
            <router-link to="/products" class="nav-link">Bộ sưu tập</router-link>
            <a href="#" class="nav-link">Mùa mới</a>
            <a href="#" class="nav-link">Về chúng tôi</a>
        </nav>

        <!-- Logo -->
        <router-link to="/" class="absolute left-1/2 -translate-x-1/2 text-center">
            <h1 class="text-2xl md:text-3xl serif-text tracking-tight text-zinc-900">AZURE</h1>
            <p class="text-[7px] uppercase tracking-[0.5em] text-zinc-400 -mt-1">Editorial</p>
        </router-link>

        <!-- Action Icons -->
        <div class="flex items-center gap-6">
            <button class="icon-link hidden sm:block">
                <span class="material-symbols-outlined text-xl">search</span>
            </button>
            
            <div class="relative group">
                <router-link :to="isAuthenticated ? '/profile' : '/auth/login'" class="icon-link">
                    <span class="material-symbols-outlined text-xl">person</span>
                </router-link>
                <!-- Dropdown đơn giản -->
                <div v-if="isAuthenticated" class="absolute right-0 top-full pt-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300">
                    <div class="bg-white border border-zinc-100 shadow-xl py-4 w-48">
                        <router-link to="/profile" class="block px-6 py-2 text-[10px] uppercase tracking-widest hover:bg-zinc-50 transition-colors">Hồ sơ của tôi</router-link>
                        <button @click="handleLogout" class="w-full text-left px-6 py-2 text-[10px] uppercase tracking-widest text-red-500 hover:bg-zinc-50 transition-colors">Đăng xuất</button>
                    </div>
                </div>
            </div>

            <router-link to="/cart" class="icon-link relative">
                <span class="material-symbols-outlined text-xl">shopping_bag</span>
                <span class="absolute -top-1 -right-1 bg-zinc-900 text-white text-[8px] w-4 h-4 rounded-full flex items-center justify-center font-bold">0</span>
            </router-link>
        </div>
    </header>
</template>

<style scoped>
@reference "../../assets/main.css";

.nav-link {
    @apply text-[10px] uppercase tracking-[0.2em] font-bold text-zinc-900 transition-all duration-300 hover:text-zinc-500;
}
.icon-link {
    @apply text-zinc-900 transition-colors hover:text-zinc-500;
}
.serif-text {
    font-family: 'Playfair Display', serif;
}
</style>
