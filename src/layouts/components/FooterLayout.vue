<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// ==========================================
// CÁC HÀM ĐIỀU HƯỚNG TƯƠNG LAI
// ==========================================

// 1. Chuyển đến trang chính sách (Terms, Privacy, Shipping...)
const goToPolicy = (policyName: string) => {
    console.log('Sẽ mở trang chính sách:', policyName)
    // VD sau này: router.push({ name: 'policy', params: { type: policyName } })
}

// 2. Chuyển đến trang hỗ trợ (CSKH, Size Guide...)
const goToHelp = (helpTopic: string) => {
    console.log('Sẽ mở trang hỗ trợ:', helpTopic)
    // VD sau này: router.push({ name: 'help', params: { topic: helpTopic } })
}

// 3. Chuyển đến danh mục giống Header
const goToCategory = (categorySlug: string) => {
    console.log('Sẽ chuyển đến danh mục từ footer:', categorySlug)
    // VD sau này: router.push({ name: 'category', params: { slug: categorySlug } })
}
</script>

<template>
    <footer
        class="bg-white border-t border-gray-100 pt-16 pb-8 px-6 md:px-10 lg:px-16"
    >
        <div class="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div class="col-span-1 md:col-span-1">
                <div class="flex items-center gap-2 mb-6">
                    <div class="size-5 text-[#17b0cf]">
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
                    <h2 class="text-[#0e191b] text-xl font-bold font-serif">
                        LUXE
                    </h2>
                </div>
                <p class="text-sm text-[#4e8b97] leading-relaxed">
                    Redefining modern luxury through sustainable practices and
                    timeless design.
                </p>
            </div>

            <div>
                <h4
                    class="font-bold text-sm uppercase tracking-wider mb-4 text-[#0e191b]"
                >
                    Shop
                </h4>
                <ul class="space-y-3 text-sm text-[#4e8b97]">
                    <li>
                        <a class="hover:text-[#17b0cf] cursor-pointer"
                            >New Arrivals</a
                        >
                    </li>
                    <li>
                        <a class="hover:text-[#17b0cf] cursor-pointer">Women</a>
                    </li>
                    <li>
                        <a class="hover:text-[#17b0cf] cursor-pointer">Men</a>
                    </li>
                    <li>
                        <a class="hover:text-[#17b0cf] cursor-pointer"
                            >Accessories</a
                        >
                    </li>
                </ul>
            </div>

            <div>
                <h4
                    class="font-bold text-sm uppercase tracking-wider mb-4 text-[#0e191b]"
                >
                    Help
                </h4>
                <ul class="space-y-3 text-sm text-[#4e8b97]">
                    <li>
                        <a class="hover:text-[#17b0cf] cursor-pointer"
                            >Customer Service</a
                        >
                    </li>
                    <li>
                        <a class="hover:text-[#17b0cf] cursor-pointer"
                            >Returns & Exchanges</a
                        >
                    </li>
                    <li>
                        <a class="hover:text-[#17b0cf] cursor-pointer"
                            >Shipping Info</a
                        >
                    </li>
                    <li>
                        <a class="hover:text-[#17b0cf] cursor-pointer"
                            >Size Guide</a
                        >
                    </li>
                </ul>
            </div>

            <div>
                <h4
                    class="font-bold text-sm uppercase tracking-wider mb-4 text-[#0e191b]"
                >
                    Follow Us
                </h4>
                <div class="flex gap-4 text-[#4e8b97]">
                    <a class="hover:text-[#17b0cf] transition-colors" href="#"
                        >IG</a
                    >
                    <a class="hover:text-[#17b0cf] transition-colors" href="#"
                        >FB</a
                    >
                    <a class="hover:text-[#17b0cf] transition-colors" href="#"
                        >TW</a
                    >
                    <a class="hover:text-[#17b0cf] transition-colors" href="#"
                        >PN</a
                    >
                </div>
            </div>
        </div>

        <div
            class="border-t border-gray-100 pt-8 flex flex-col md:flex-row justify-between items-center gap-4"
        >
            <p class="text-xs text-[#4e8b97]">
                © 2026 LUXE Fashion. All rights reserved.
            </p>
            <div class="flex gap-6 text-xs text-[#4e8b97]">
                <a class="hover:text-[#17b0cf] cursor-pointer"
                    >Privacy Policy</a
                >
                <a class="hover:text-[#17b0cf] cursor-pointer"
                    >Terms of Service</a
                >
            </div>
        </div>
    </footer>
</template>
