<script setup lang="ts">
import { ref } from 'vue'
import { useUIStore } from '@/stores/useUIStore'

const uiStore = useUIStore()
const emailInput = ref('')

const handleSubscribe = () => {
    if (!emailInput.value) return
    console.log('Đăng ký nhận bản tin với email:', emailInput.value)
    uiStore.success('Cảm ơn bạn đã đăng ký nhận bản tin!')
    emailInput.value = ''
}
</script>

<template>
    <section class="py-20 bg-[#e7f1f3]/50">
        <div class="container mx-auto px-6 text-center max-w-2xl">
            <h2 class="text-3xl font-serif mb-4 text-[#0e191b]">
                Join the World of Luxe
            </h2>
            <p class="text-[#4e8b97] mb-8">
                Subscribe to receive updates, access to exclusive deals, and
                more.
            </p>

            <form
                @submit.prevent="handleSubscribe"
                class="flex flex-col sm:flex-row gap-3"
            >
                <input
                    v-model="emailInput"
                    class="flex-1 rounded-lg border-gray-300 px-4 py-3 focus:border-[#17b0cf] focus:ring-[#17b0cf] bg-white text-[#0e191b]"
                    placeholder="Your email address"
                    type="email"
                    required
                />
                <button
                    type="submit"
                    class="bg-[#0e191b] text-white px-8 py-3 rounded-lg font-bold uppercase text-sm tracking-wider hover:bg-[#17b0cf] transition-colors"
                >
                    Subscribe
                </button>
            </form>
        </div>
    </section>
</template>
