<script setup lang="ts">
import { ref, nextTick } from 'vue'

interface Message {
    id: number
    role: 'user' | 'assistant'
    content: string
    time: string
}

const isOpen = ref(false)
const inputText = ref('')
const messages = ref<Message[]>([
    {
        id: 1,
        role: 'assistant',
        content: 'Xin chào! Tôi là trợ lý thời trang của LUXU. Tôi có thể giúp bạn tìm kiếm sản phẩm, tư vấn phong cách hoặc giải đáp thắc mắc. 👗',
        time: now(),
    }
])
const messagesContainer = ref<HTMLElement | null>(null)
let msgCounter = 2

function now() {
    return new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function toggleChat() {
    isOpen.value = !isOpen.value
}

async function sendMessage() {
    const text = inputText.value.trim()
    if (!text) return

    messages.value.push({ id: msgCounter++, role: 'user', content: text, time: now() })
    inputText.value = ''

    await nextTick()
    scrollToBottom()

    // Giả lập phản hồi AI (placeholder)
    setTimeout(async () => {
        messages.value.push({
            id: msgCounter++,
            role: 'assistant',
            content: 'Cảm ơn bạn đã nhắn tin! Tính năng AI đang được phát triển. Vui lòng liên hệ hotline để được hỗ trợ trực tiếp. 😊',
            time: now(),
        })
        await nextTick()
        scrollToBottom()
    }, 800)
}

function scrollToBottom() {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}
</script>

<template>
    <div class="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-3">
        <!-- Chat Window -->
        <Transition name="chat-window">
            <div
                v-if="isOpen"
                class="w-[360px] bg-white border border-border-light shadow-2xl flex flex-col overflow-hidden"
                style="height: 480px;"
            >
                <!-- Header -->
                <div class="bg-fashion-black text-white px-5 py-4 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-[18px]" style="font-variation-settings:'FILL' 1">smart_toy</span>
                        </div>
                        <div>
                            <p class="text-[11px] font-bold uppercase tracking-widest">Luxu AI</p>
                            <div class="flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                <span class="text-[9px] text-zinc-400 uppercase tracking-widest">Online</span>
                            </div>
                        </div>
                    </div>
                    <button @click="toggleChat" class="text-zinc-400 hover:text-white transition-colors">
                        <span class="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <!-- Messages -->
                <div
                    ref="messagesContainer"
                    class="flex-grow overflow-y-auto p-4 space-y-4 bg-background-light"
                >
                    <div
                        v-for="msg in messages"
                        :key="msg.id"
                        :class="['flex gap-2', msg.role === 'user' ? 'flex-row-reverse' : 'flex-row']"
                    >
                        <!-- Avatar -->
                        <div
                            :class="[
                                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1',
                                msg.role === 'assistant' ? 'bg-primary' : 'bg-fashion-black'
                            ]"
                        >
                            <span class="material-symbols-outlined text-white text-[14px]" style="font-variation-settings:'FILL' 1">
                                {{ msg.role === 'assistant' ? 'smart_toy' : 'person' }}
                            </span>
                        </div>

                        <!-- Bubble -->
                        <div :class="['max-w-[75%]', msg.role === 'user' ? 'items-end' : 'items-start', 'flex flex-col gap-1']">
                            <div
                                :class="[
                                    'px-4 py-3 text-[12px] leading-relaxed',
                                    msg.role === 'assistant'
                                        ? 'bg-white border border-border-light text-fashion-black'
                                        : 'bg-fashion-black text-white'
                                ]"
                            >
                                {{ msg.content }}
                            </div>
                            <span class="text-[9px] text-zinc-400 px-1">{{ msg.time }}</span>
                        </div>
                    </div>
                </div>

                <!-- Input -->
                <div class="border-t border-border-light p-3 flex gap-2 shrink-0 bg-white">
                    <input
                        v-model="inputText"
                        @keyup.enter="sendMessage"
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        class="flex-grow border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-fashion-black placeholder:text-zinc-400"
                    />
                    <button
                        @click="sendMessage"
                        :disabled="!inputText.trim()"
                        class="w-10 h-10 bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                        <span class="material-symbols-outlined text-[18px]">send</span>
                    </button>
                </div>
            </div>
        </Transition>

        <!-- Toggle Button -->
        <button
            @click="toggleChat"
            class="w-14 h-14 bg-fashion-black text-white rounded-full flex items-center justify-center shadow-xl hover:bg-primary transition-all duration-300 hover:scale-110 active:scale-95"
            :title="isOpen ? 'Đóng chat' : 'Chat với AI'"
        >
            <Transition name="icon-swap" mode="out-in">
                <span v-if="isOpen" key="close" class="material-symbols-outlined text-[24px]">close</span>
                <span v-else key="open" class="material-symbols-outlined text-[24px]" style="font-variation-settings:'FILL' 1">smart_toy</span>
            </Transition>
        </button>
    </div>
</template>

<style scoped>
.chat-window-enter-active { transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.chat-window-leave-active { transition: all 0.2s ease; }
.chat-window-enter-from   { opacity: 0; transform: translateY(16px) scale(0.95); }
.chat-window-leave-to     { opacity: 0; transform: translateY(8px) scale(0.97); }

.icon-swap-enter-active, .icon-swap-leave-active { transition: all 0.15s ease; }
.icon-swap-enter-from, .icon-swap-leave-to { opacity: 0; transform: scale(0.7) rotate(90deg); }
</style>
