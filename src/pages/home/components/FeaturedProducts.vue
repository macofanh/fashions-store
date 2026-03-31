<script setup lang="ts">
import { useRouter } from 'vue-router'

const router = useRouter()

// Hàm xem chi tiết sản phẩm
const goToProductDetail = (productSlug: string) => {
    console.log('Chuyển sang trang chi tiết sản phẩm:', productSlug)
    // router.push({ name: 'product-detail', params: { slug: productSlug } })
}

// Hàm thêm nhanh vào giỏ hàng
const addToCart = (productId: number) => {
    console.log('Đã thêm sản phẩm ID', productId, 'vào giỏ hàng')
    // Gọi API add to cart ở đây
    alert('Đã thêm vào giỏ hàng!')
}
</script>

<template>
    <section class="px-6 py-16 md:px-10 lg:px-16 lg:py-24 bg-[#f8fbfc]">
        <div
            class="flex flex-col md:flex-row items-end justify-between mb-12 gap-4"
        >
            <div>
                <h2
                    class="text-[#0e191b] text-3xl md:text-4xl font-serif font-semibold mb-2"
                >
                    New Arrivals
                </h2>
                <p class="text-[#4e8b97] text-sm md:text-base">
                    Discover the latest additions to our luxury collection.
                </p>
            </div>
            <a
                class="text-[#0e191b] font-medium text-sm border-b border-[#0e191b] pb-0.5 hover:text-[#17b0cf] hover:border-[#17b0cf] transition-colors cursor-pointer"
            >
                View All Products
            </a>
        </div>

        <div
            class="grid grid-cols-1 gap-x-6 gap-y-10 sm:grid-cols-2 lg:grid-cols-4 xl:gap-x-8"
        >
            <div
                class="group relative flex flex-col cursor-pointer"
                @click="goToProductDetail('silk-midi-dress')"
            >
                <div
                    class="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-200 relative"
                >
                    <span
                        class="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#0e191b]"
                        >New</span
                    >
                    <div
                        class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style="
                            background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuAc01CN5ogMccI4lslhOQxtipibqjd3K3mgas3UJfxb__MFr-Qw4sc_TKBhZEbwTeS9Vk5sgBpq9QmpXA4ARIU_3D-xn5nRLKVCZzlwHBpt_YG4fLg5t2mD9Y8nTVxx21uCKcOuz9ODHlB0PoAh4tHm_B9WkvZqQFyneZtff1mcxgkJgjAd0hY4B0RKvakyTCMr4WCVOwnXoxcDeTx3zfYv_gWEGqpAAxFxDUBFtfBSHI2RiESOJJNfQMqW7JS5IqbiftK8_ALzDjGS');
                        "
                    ></div>

                    <div
                        class="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden md:block"
                    >
                        <button
                            @click.stop="addToCart(1)"
                            class="w-full bg-white/90 backdrop-blur py-3 text-xs font-bold uppercase tracking-wider text-[#0e191b] hover:bg-[#17b0cf] hover:text-white transition-colors"
                        >
                            Quick Add
                        </button>
                    </div>
                </div>
                <div class="mt-4 flex justify-between">
                    <div>
                        <h3 class="text-sm text-[#0e191b] font-medium">
                            Silk Midi Dress
                        </h3>
                        <p class="mt-1 text-sm text-[#4e8b97]">Natural Silk</p>
                    </div>
                    <p class="text-sm font-medium text-[#0e191b]">$250.00</p>
                </div>
            </div>

            <div
                class="group relative flex flex-col cursor-pointer"
                @click="goToProductDetail('linen-blazer')"
            >
                <div
                    class="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-200 relative"
                >
                    <span
                        class="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold uppercase tracking-wider text-[#0e191b]"
                        >New</span
                    >
                    <div
                        class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style="
                            background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuATgkkwcAqGdNq_quO0TMpEksgDLsBukSpZsWFZ771ciOoh6uTi8qDfGG0pCB6ZC1tlS887fXeVe2VoTpCjXoh5Tzp00jUv7nfKGbxD7vsS6JE0T_Q_njMQHlwyru-sT4ew0amnPDPQjaXsPj3N_xcGWTNWvLA2BiO3e3X86BFCDWmOMSslZtcxeOh5frL206pQWS0AjU7A-g0M6zhOIvpR_M-xQ5zEicv_3pQ2zc5gXMeMrpQhtNin4fEJ8rMW0SGIQPcnAPrppiKm');
                        "
                    ></div>
                    <div
                        class="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden md:block"
                    >
                        <button
                            @click.stop="addToCart(2)"
                            class="w-full bg-white/90 backdrop-blur py-3 text-xs font-bold uppercase tracking-wider text-[#0e191b] hover:bg-[#17b0cf] hover:text-white transition-colors"
                        >
                            Quick Add
                        </button>
                    </div>
                </div>
                <div class="mt-4 flex justify-between">
                    <div>
                        <h3 class="text-sm text-[#0e191b] font-medium">
                            Linen Blazer
                        </h3>
                        <p class="mt-1 text-sm text-[#4e8b97]">Oatmeal</p>
                    </div>
                    <p class="text-sm font-medium text-[#0e191b]">$180.00</p>
                </div>
            </div>

            <div
                class="group relative flex flex-col cursor-pointer"
                @click="goToProductDetail('evening-gown')"
            >
                <div
                    class="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-200 relative"
                >
                    <div
                        class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style="
                            background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuC19fw8NYksTQJM-MSpGZjFeVHrmve_g-EEJliSuJ2xQH-WCGCdi0LL3SzJQiqljVxnD-riMItxuAwvoItLvEIWPp90SATxusk2WczUJE8IH86dsBm8hpZI5nM8DEm_LOK-oZfl_y4znkVmSZ0OC_WwHzxMXI_DUUM_M8QywPlUs8CYJaWz68KnVQ9mc31nGml9_WZcm7fr_D8bQ5YraamEp0UXbOtWAAYc4yOdc8doViM0i9ekCxIO7vDIInbn8L0Ic_GSnyKHzyNx');
                        "
                    ></div>
                    <div
                        class="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden md:block"
                    >
                        <button
                            @click.stop="addToCart(3)"
                            class="w-full bg-white/90 backdrop-blur py-3 text-xs font-bold uppercase tracking-wider text-[#0e191b] hover:bg-[#17b0cf] hover:text-white transition-colors"
                        >
                            Quick Add
                        </button>
                    </div>
                </div>
                <div class="mt-4 flex justify-between">
                    <div>
                        <h3 class="text-sm text-[#0e191b] font-medium">
                            Evening Gown
                        </h3>
                        <p class="mt-1 text-sm text-[#4e8b97]">
                            Midnight Black
                        </p>
                    </div>
                    <p class="text-sm font-medium text-[#0e191b]">$420.00</p>
                </div>
            </div>

            <div
                class="group relative flex flex-col cursor-pointer"
                @click="goToProductDetail('sculpted-tote')"
            >
                <div
                    class="aspect-[3/4] w-full overflow-hidden rounded-lg bg-gray-200 relative"
                >
                    <span
                        class="absolute top-3 left-3 z-10 bg-white/90 backdrop-blur-sm px-2 py-1 text-xs font-bold uppercase tracking-wider text-red-600"
                        >Low Stock</span
                    >
                    <div
                        class="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                        style="
                            background-image: url('https://lh3.googleusercontent.com/aida-public/AB6AXuB0cUmn9hygaL28DlvNTFPe0EQtKbLES5FL7CfTgrd7-nDWv4_HJlUt1T26eLlUkkGm8J5doQl3fIeU0br0TzykR2drtGh4sLzzNdEqk7rHaws9jXbWU5gu1uFaZDCM2ZTe9VYAd1wcunVsVRHV3ISR1kqB2ceeeMSTECuDCwL5qkrN4sBknJOAjrCweUHc6rOQjuoI9svZXy4BveTzMTwy6mumBBdu13uMolM0MdpZ8n7sy6pWZlb5-WuEHosJJ3NaAv75Tw6EcRj0');
                        "
                    ></div>
                    <div
                        class="absolute inset-x-0 bottom-0 p-4 opacity-0 transition-opacity duration-300 group-hover:opacity-100 hidden md:block"
                    >
                        <button
                            @click.stop="addToCart(4)"
                            class="w-full bg-white/90 backdrop-blur py-3 text-xs font-bold uppercase tracking-wider text-[#0e191b] hover:bg-[#17b0cf] hover:text-white transition-colors"
                        >
                            Quick Add
                        </button>
                    </div>
                </div>
                <div class="mt-4 flex justify-between">
                    <div>
                        <h3 class="text-sm text-[#0e191b] font-medium">
                            Sculpted Tote
                        </h3>
                        <p class="mt-1 text-sm text-[#4e8b97]">
                            Cognac Leather
                        </p>
                    </div>
                    <p class="text-sm font-medium text-[#0e191b]">$350.00</p>
                </div>
            </div>
        </div>
    </section>
</template>
