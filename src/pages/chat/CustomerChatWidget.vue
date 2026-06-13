<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'
import { isFirebaseConfigured } from '@/lib/firebase'
import { sendChatMessage, subscribeToConversationMessages } from './chatService'
import { playChatNotification } from './chatSound'
import type { ChatMessage } from './chat.types'

const authStore = useAuthStore()
const router = useRouter()
const uiStore = useUIStore()
const isOpen = computed({
    get: () => uiStore.isChatOpen,
    set: (val) => { uiStore.isChatOpen = val }
})
const inputText = ref('')
const messages = ref<ChatMessage[]>([])
const sendError = ref('')
const unreadCount = ref(0)
const messagesContainer = ref<HTMLElement | null>(null)
let unsubscribe: (() => void) | null = null
let hasLoadedMessages = false

function formatTime(message: ChatMessage) {
    return message.createdAt?.toDate().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    }) ?? '--:--'
}

function scrollToBottom() {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

function startListening() {
    const customerId = authStore.user?.user_id
    if (!customerId || unsubscribe || !isFirebaseConfigured) return

    unsubscribe = subscribeToConversationMessages(String(customerId), async nextMessages => {
        const knownMessageIds = new Set(messages.value.map(message => message.id))
        const newStaffMessages = nextMessages.filter(message =>
            !knownMessageIds.has(message.id) && message.senderRole === 'staff'
        )

        messages.value = nextMessages

        if (hasLoadedMessages && newStaffMessages.length > 0) {
            if (!isOpen.value) {
                unreadCount.value += newStaffMessages.length
            }
            playChatNotification()
        }

        hasLoadedMessages = true
        await nextTick()
        scrollToBottom()
    })
}

function stopListening() {
    unsubscribe?.()
    unsubscribe = null
    hasLoadedMessages = false
}

function toggleChat() {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
        unreadCount.value = 0
    }
}

async function sendMessage() {
    if (!authStore.user) {
        router.push({ name: 'login' })
        return
    }

    const content = inputText.value.trim()
    if (!content) return

    try {
        sendError.value = ''
        await sendChatMessage({
            customerId: String(authStore.user.user_id),
            customerName: authStore.user.full_name,
            customerEmail: authStore.user.email,
            senderId: String(authStore.user.user_id),
            senderName: authStore.user.full_name,
            senderRole: 'customer',
            content,
        })

        inputText.value = ''
    } catch (error) {
        sendError.value = error instanceof Error ? error.message : 'Không thể gửi tin nhắn.'
    }
}

watch(
    () => authStore.user?.user_id,
    customerId => {
        if (customerId && authStore.user) {
            startListening()
        } else {
            stopListening()
        }
    },
    { immediate: true },
)

onBeforeUnmount(stopListening)
</script>

<template>
    <div class="fixed bottom-6 right-6 z-[150] flex flex-col items-end gap-3">
        <Transition name="chat-window">
            <div
                v-if="isOpen"
                class="w-[360px] bg-white border border-border-light shadow-2xl flex flex-col overflow-hidden"
                style="height: 480px;"
            >
                <div class="bg-fashion-black text-white px-5 py-4 flex items-center justify-between shrink-0">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span class="material-symbols-outlined text-white text-[18px]">support_agent</span>
                        </div>
                        <div>
                            <p class="text-[11px] font-bold uppercase tracking-widest">Nhân viên hỗ trợ</p>
                            <div class="flex items-center gap-1.5">
                                <span class="w-1.5 h-1.5 bg-green-400 rounded-full"></span>
                                <span class="text-[9px] text-zinc-400 uppercase tracking-widest">Realtime</span>
                            </div>
                        </div>
                    </div>
                    <button @click="toggleChat" class="text-zinc-400 hover:text-white transition-colors">
                        <span class="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div ref="messagesContainer" class="flex-grow overflow-y-auto p-4 space-y-4 bg-background-light">
                    <div v-if="!authStore.user" class="h-full flex flex-col items-center justify-center text-center px-6">
                        <span class="material-symbols-outlined text-4xl text-zinc-300 mb-3">lock</span>
                        <p class="text-sm font-semibold text-fashion-black">Đăng nhập để chat với nhân viên</p>
                        <button @click="router.push({ name: 'login' })" class="btn-primary mt-4">Đăng nhập</button>
                    </div>

                    <div v-else-if="!isFirebaseConfigured" class="h-full flex flex-col items-center justify-center text-center px-6">
                        <span class="material-symbols-outlined text-4xl text-zinc-300 mb-3">settings</span>
                        <p class="text-sm font-semibold text-fashion-black">Chat chưa được cấu hình</p>
                        <p class="text-xs text-zinc-400 mt-1">Thêm biến môi trường Firebase để bật realtime chat.</p>
                    </div>

                    <div v-else-if="messages.length === 0" class="h-full flex flex-col items-center justify-center text-center px-6">
                        <span class="material-symbols-outlined text-4xl text-zinc-300 mb-3">forum</span>
                        <p class="text-sm font-semibold text-fashion-black">Bắt đầu cuộc trò chuyện</p>
                        <p class="text-xs text-zinc-400 mt-1">Nhân viên sẽ phản hồi ngay tại đây.</p>
                    </div>

                    <div
                        v-for="message in messages"
                        :key="message.id"
                        :class="['flex gap-2', message.senderRole === 'customer' ? 'flex-row-reverse' : 'flex-row']"
                    >
                        <div
                            :class="[
                                'w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-1',
                                message.senderRole === 'customer' ? 'bg-fashion-black' : 'bg-primary'
                            ]"
                        >
                            <span class="material-symbols-outlined text-white text-[14px]">
                                {{ message.senderRole === 'customer' ? 'person' : 'support_agent' }}
                            </span>
                        </div>

                        <div :class="['max-w-[75%] flex flex-col gap-1', message.senderRole === 'customer' ? 'items-end' : 'items-start']">
                            <div
                                :class="[
                                    'px-4 py-3 text-[12px] leading-relaxed',
                                    message.senderRole === 'customer'
                                        ? 'bg-fashion-black text-white'
                                        : 'bg-white border border-border-light text-fashion-black'
                                ]"
                            >
                                {{ message.content }}
                            </div>
                            <span class="text-[9px] text-zinc-400 px-1">{{ formatTime(message) }}</span>
                        </div>
                    </div>
                </div>

                <div v-if="authStore.user && isFirebaseConfigured" class="border-t border-border-light p-3 flex gap-2 shrink-0 bg-white">
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
                <p v-if="sendError" class="border-t border-red-100 bg-red-50 px-4 py-2 text-[11px] text-red-600">
                    {{ sendError }}
                </p>
            </div>
        </Transition>

        <button
            @click="toggleChat"
            class="relative w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-xl hover:bg-primary-dark transition-all duration-300 hover:scale-110 active:scale-95"
            :title="isOpen ? 'Đóng chat' : 'Chat với nhân viên'"
        >
            <span
                v-if="unreadCount > 0 && !isOpen"
                class="absolute -right-1 -top-1 min-w-5 h-5 px-1 rounded-full bg-red-500 text-[11px] font-bold leading-5 text-white"
            >
                {{ unreadCount > 99 ? '99+' : unreadCount }}
            </span>
            <Transition name="icon-swap" mode="out-in">
                <span v-if="isOpen" key="close" class="material-symbols-outlined text-[24px]">close</span>
                <span v-else key="open" class="material-symbols-outlined text-[24px]">support_agent</span>
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
