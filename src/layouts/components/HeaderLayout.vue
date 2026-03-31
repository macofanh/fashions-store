<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// ==========================================
// CÁC HÀM ĐIỀU HƯỚNG TƯƠNG LAI
// (Khi nào có trang tương ứng thì mở comment code bên trong ra)
// ==========================================

// 1. Chuyển đến các danh mục (Men, Women, New In...)
const goToCategory = (categorySlug: string) => {
    console.log('Sẽ chuyển đến danh mục:', categorySlug)
    // VD sau này: router.push({ name: 'category', params: { slug: categorySlug } })
}

// 2. Mở ô tìm kiếm
const openSearch = () => {
    console.log('Sẽ mở Modal/Trang tìm kiếm sản phẩm')
    // Logic mở popup hoặc sang route search
}

// 3. Vào trang Cá nhân (Kiểm tra xem đã đăng nhập chưa)
const goToProfile = () => {
    const isLoggedIn = !!localStorage.getItem('access_token')
    if (isLoggedIn) {
        console.log('Sẽ vào trang Profile cá nhân')
        // router.push({ name: 'profile' })
    } else {
        router.push({ name: 'login' })
    }
}

// 4. Vào trang Danh sách yêu thích (Wishlist)
const goToWishlist = () => {
    console.log('Sẽ chuyển đến trang Wishlist')
    // router.push({ name: 'wishlist' })
}

// 5. Vào Giỏ hàng
const goToCart = () => {
    console.log('Sẽ chuyển đến Giỏ hàng')
    // router.push({ name: 'cart' })
}

// 6. Xử lý Đăng xuất
const handleLogout = () => {
    if (confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        localStorage.removeItem('access_token')
        localStorage.removeItem('refresh_token')
        localStorage.removeItem('user_info')
        router.push({ name: 'login' })
    }
}
</script>

<template>
    <header
        class="sticky z-50 flex w-full items-center justify-between border-b border-[#e7f1f3] bg-[#f8fbfc]/95 px-6 py-4 backdrop-blur-md md:px-10 lg:px-16"
    >
        <div class="flex items-center gap-4 text-[#0e191b]">
            <div class="size-6 text-[#17b0cf]">
                <svg
                    class="w-full h-full"
                    fill="none"
                    viewBox="0 0 48 48"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M36.7273 44C33.9891 44 31.6043 39.8386 30.3636 33.69C29.123 39.8386 26.7382 44 24 44C21.2618 44 18.877 39.8386 17.6364 33.69C16.3957 39.8386 14.0109 44 11.2727 44C7.25611 44 4 35.0457 4 24C4 12.9543 7.25611 4 11.2727 4C14.0109 4 16.3957 8.16144 17.6364 14.31C18.877 8.16144 21.2618 4 24 4C26.7382 4 29.123 8.16144 30.3636 14.31C31.6043 8.16144 33.9891 4 36.7273 4C40.7439 4 44 12.9543 44 24C44 35.0457 40.7439 44 36.7273 44Z"
                        fill="currentColor"
                    ></path>
                </svg>
            </div>
            <router-link
                to="/"
                class="text-[#0e191b] text-2xl font-bold tracking-tight font-serif"
                >LUXU</router-link
            >
        </div>

        <nav class="hidden md:flex flex-1 justify-center gap-10">
            <a
                class="text-[#0e191b] text-sm font-medium hover:text-[#17b0cf] transition-colors uppercase tracking-widest cursor-pointer"
                >New In</a
            >
            <a
                class="text-[#0e191b] text-sm font-medium hover:text-[#17b0cf] transition-colors uppercase tracking-widest cursor-pointer"
                >Men</a
            >
            <a
                class="text-[#0e191b] text-sm font-medium hover:text-[#17b0cf] transition-colors uppercase tracking-widest cursor-pointer"
                >Women</a
            >
            <a
                class="text-[#0e191b] text-sm font-medium hover:text-[#17b0cf] transition-colors uppercase tracking-widest cursor-pointer"
                >Collections</a
            >
        </nav>

        <div class="flex items-center gap-4">
            <button
                class="flex items-center justify-center rounded-full p-2 text-[#0e191b] hover:bg-[#e7f1f3] transition-colors"
            >
                <span class="material-symbols-outlined" style="font-size: 24px"
                    >search</span
                >
            </button>

            <button
                @click="goToProfile"
                class="flex items-center justify-center rounded-full p-2 text-[#0e191b] hover:bg-[#e7f1f3] transition-colors"
            >
                <span class="material-symbols-outlined" style="font-size: 24px"
                    >person</span
                >
            </button>

            <button
                class="flex items-center justify-center rounded-full p-2 text-[#0e191b] hover:bg-[#e7f1f3] transition-colors"
            >
                <span class="material-symbols-outlined" style="font-size: 24px"
                    >favorite</span
                >
            </button>

            <button
                class="relative flex items-center justify-center rounded-full p-2 text-[#0e191b] hover:bg-[#e7f1f3] transition-colors"
            >
                <span class="material-symbols-outlined" style="font-size: 24px"
                    >shopping_bag</span
                >
                <span
                    class="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-[#17b0cf] text-[10px] font-bold text-white"
                    >2</span
                >
            </button>
        </div>
    </header>
</template>
