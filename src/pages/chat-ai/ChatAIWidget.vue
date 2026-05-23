<script setup lang="ts">
import { ref } from 'vue'
import { chatAIHandler } from './chatAIHandler'

const isOpen = ref(false)
const messagesContainer = ref<HTMLElement | null>(null)

const {
    inputText,
    isSending,
    error,
    messages,
    sendMessage,
    retryLastMessage,
} = chatAIHandler()

function toggleChat() {
    isOpen.value = !isOpen.value
}

async function handleSendMessage() {
    await sendMessage(scrollToBottom)
}

async function handleRetryMessage() {
    await retryLastMessage(scrollToBottom)
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
                        v-for="message in messages"
                        :key="message.id"
                        :class="['flex gap-2', message.role === 'user' ? 'flex-row-reverse' : 'flex-row']"
                    >
                        <!-- Avatar -->
                        <div
                            :class="[
                                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1',
                                message.role === 'assistant' ? 'bg-primary' : 'bg-fashion-black'
                            ]"
                        >
                            <span class="material-symbols-outlined text-white text-[14px]" style="font-variation-settings:'FILL' 1">
                                {{ message.role === 'assistant' ? 'smart_toy' : 'person' }}
                            </span>
                        </div>

                        <!-- Bubble -->
                        <div :class="['max-w-[75%]', message.role === 'user' ? 'items-end' : 'items-start', 'flex flex-col gap-1']">
                            <div
                                :class="[
                                    'px-4 py-3 text-[12px] leading-relaxed whitespace-pre-wrap',
                                    message.role === 'assistant'
                                        ? 'bg-white border border-border-light text-fashion-black'
                                        : 'bg-fashion-black text-white'
                                ]"
                            >
                                {{ message.content }}
                            </div>
                            <span class="text-[9px] text-zinc-400 px-1">{{ message.time }}</span>
                        </div>
                    </div>

                    <div v-if="isSending" class="flex gap-2">
                        <div class="w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1 bg-primary">
                            <span class="material-symbols-outlined text-white text-[14px] ai-thinking-icon" style="font-variation-settings:'FILL' 1">progress_activity</span>
                        </div>
                        <div class="max-w-[75%] flex flex-col gap-1 items-start">
                            <div class="px-4 py-3 text-[12px] leading-relaxed bg-white border border-border-light text-text-muted flex items-center gap-2">
                                <span class="inline-flex gap-1">
                                    <span class="thinking-dot"></span>
                                    <span class="thinking-dot"></span>
                                    <span class="thinking-dot"></span>
                                </span>
                                <span>...</span>
                            </div>
                        </div>
                    </div>

                    <div v-if="error" class="flex justify-start">
                        <button
                            type="button"
                            class="ml-9 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:text-red-700 disabled:opacity-50"
                            :disabled="isSending"
                            @click="handleRetryMessage"
                        >
                            Gửi lại tin nhắn cuối
                        </button>
                    </div>
                </div>

                <!-- Input -->
                <div class="border-t border-border-light p-3 flex gap-2 shrink-0 bg-white">
                    <input
                        v-model="inputText"
                        @keyup.enter="handleSendMessage"
                        type="text"
                        placeholder="Nhập tin nhắn..."
                        :disabled="isSending"
                        class="flex-grow border border-zinc-200 px-4 py-2.5 text-sm outline-none focus:border-primary transition-colors text-fashion-black placeholder:text-zinc-400"
                    />
                    <button
                        @click="handleSendMessage"
                        :disabled="!inputText.trim() || isSending"
                        class="w-10 h-10 bg-primary text-white flex items-center justify-center hover:bg-primary-dark transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
                    >
                        <span v-if="isSending" class="material-symbols-outlined text-[18px] ai-thinking-icon">progress_activity</span>
                        <span v-else class="material-symbols-outlined text-[18px]">send</span>
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

.ai-thinking-icon {
    animation: ai-spin 0.9s linear infinite;
}

.thinking-dot {
    width: 4px;
    height: 4px;
    border-radius: 999px;
    background: #17b0cf;
    animation: ai-pulse 1s ease-in-out infinite;
}

.thinking-dot:nth-child(2) {
    animation-delay: 0.15s;
}

.thinking-dot:nth-child(3) {
    animation-delay: 0.3s;
}

@keyframes ai-spin {
    to { transform: rotate(360deg); }
}

@keyframes ai-pulse {
    0%, 80%, 100% { opacity: 0.35; transform: translateY(0); }
    40% { opacity: 1; transform: translateY(-2px); }
}
</style>
