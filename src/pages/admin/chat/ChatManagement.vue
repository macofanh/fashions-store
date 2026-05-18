<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { isFirebaseConfigured } from '@/lib/firebase'
import { sendChatMessage, subscribeToConversationMessages, subscribeToConversations } from '@/pages/chat/chatService'
import { playChatNotification } from '@/pages/chat/chatSound'
import type { ChatConversation, ChatMessage } from '@/pages/chat/chat.types'

const authStore = useAuthStore()
const conversations = ref<ChatConversation[]>([])
const selectedConversationId = ref('')
const messages = ref<ChatMessage[]>([])
const inputText = ref('')
const sendError = ref('')
const unreadCounts = ref<Record<string, number>>({})
const messagesContainer = ref<HTMLElement | null>(null)
let unsubscribeConversations: (() => void) | null = null
let unsubscribeMessages: (() => void) | null = null
let hasLoadedConversations = false

const selectedConversation = computed(() =>
    conversations.value.find(item => item.id === selectedConversationId.value) ?? null
)

function formatTime(message: ChatMessage) {
    return message.createdAt?.toDate().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    }) ?? '--:--'
}

function formatConversationTime(conversation: ChatConversation) {
    return conversation.updatedAt?.toDate().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    }) ?? '--:--'
}

function scrollToBottom() {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
    }
}

function selectConversation(conversationId: string) {
    selectedConversationId.value = conversationId
    unreadCounts.value[conversationId] = 0
}

function getUnreadCount(conversationId: string) {
    return unreadCounts.value[conversationId] ?? 0
}

async function sendMessage() {
    if (!selectedConversation.value || !authStore.user) return

    const content = inputText.value.trim()
    if (!content) return

    try {
        sendError.value = ''
        await sendChatMessage({
            customerId: selectedConversation.value.customerId,
            customerName: selectedConversation.value.customerName,
            customerEmail: selectedConversation.value.customerEmail,
            senderId: String(authStore.user.user_id),
            senderName: authStore.user.full_name,
            senderRole: 'staff',
            content,
        })

        inputText.value = ''
    } catch (error) {
        sendError.value = error instanceof Error ? error.message : 'Không thể gửi tin nhắn.'
    }
}

if (isFirebaseConfigured) {
    unsubscribeConversations = subscribeToConversations(nextConversations => {
        const previousById = new Map(conversations.value.map(item => [item.id, item]))

        if (hasLoadedConversations) {
            let hasNewCustomerMessage = false

            nextConversations.forEach(conversation => {
                const previousConversation = previousById.get(conversation.id)
                const previousTime = previousConversation?.updatedAt?.toMillis() ?? 0
                const nextTime = conversation.updatedAt?.toMillis() ?? 0
                const isNewCustomerMessage =
                    conversation.lastSenderRole === 'customer' &&
                    nextTime > previousTime

                if (isNewCustomerMessage && conversation.id !== selectedConversationId.value) {
                    unreadCounts.value[conversation.id] = (unreadCounts.value[conversation.id] ?? 0) + 1
                    hasNewCustomerMessage = true
                }
            })

            if (hasNewCustomerMessage) {
                playChatNotification()
            }
        }

        conversations.value = nextConversations
        if (!selectedConversationId.value && nextConversations[0]) {
            selectedConversationId.value = nextConversations[0].id
        }
        hasLoadedConversations = true
    })
}

watch(
    selectedConversationId,
    conversationId => {
        unsubscribeMessages?.()
        messages.value = []

        if (!conversationId) return

        unsubscribeMessages = subscribeToConversationMessages(conversationId, async nextMessages => {
            messages.value = nextMessages
            await nextTick()
            scrollToBottom()
        })
    },
    { immediate: true },
)

onBeforeUnmount(() => {
    unsubscribeConversations?.()
    unsubscribeMessages?.()
})
</script>

<template>
    <div class="space-y-6">
        <div>
            <h1 class="text-2xl font-bold text-slate-900">Chat khách hàng</h1>
            <p class="text-sm text-slate-500 mt-1">Mỗi khách hàng là một cuộc trò chuyện riêng.</p>
        </div>

        <div v-if="!isFirebaseConfigured" class="rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <span class="material-symbols-outlined block text-5xl text-slate-200">settings</span>
            <p class="mt-4 text-sm font-semibold text-slate-800">Chat chưa được cấu hình</p>
            <p class="mt-1 text-sm text-slate-400">Thêm các biến `VITE_FIREBASE_*` trong `.env` để bật Firestore realtime.</p>
        </div>

        <div v-else class="grid min-h-[640px] grid-cols-1 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[320px_minmax(0,1fr)]">
            <aside class="border-b border-slate-200 lg:border-b-0 lg:border-r">
                <div class="border-b border-slate-100 px-5 py-4">
                    <p class="text-xs font-semibold uppercase tracking-wider text-slate-400">Khách hàng</p>
                </div>

                <div class="max-h-[260px] overflow-y-auto lg:max-h-[580px]">
                    <button
                        v-for="conversation in conversations"
                        :key="conversation.id"
                        @click="selectConversation(conversation.id)"
                        :class="[
                            'w-full border-b border-slate-100 px-5 py-4 text-left transition-colors',
                            selectedConversationId === conversation.id ? 'bg-slate-900 text-white' : 'hover:bg-slate-50'
                        ]"
                    >
                        <div class="flex items-start justify-between gap-3">
                            <div class="min-w-0">
                                <div class="flex items-center gap-2">
                                    <p class="truncate text-sm font-semibold">{{ conversation.customerName }}</p>
                                    <span
                                        v-if="getUnreadCount(conversation.id)"
                                        class="min-w-5 h-5 rounded-full bg-red-500 px-1 text-center text-[11px] font-bold leading-5 text-white"
                                    >
                                        {{ getUnreadCount(conversation.id) > 99 ? '99+' : getUnreadCount(conversation.id) }}
                                    </span>
                                </div>
                                <p :class="['truncate text-xs mt-1', selectedConversationId === conversation.id ? 'text-slate-300' : 'text-slate-400']">
                                    {{ conversation.lastMessage }}
                                </p>
                            </div>
                            <span :class="['shrink-0 text-[10px]', selectedConversationId === conversation.id ? 'text-slate-300' : 'text-slate-400']">
                                {{ formatConversationTime(conversation) }}
                            </span>
                        </div>
                    </button>

                    <div v-if="conversations.length === 0" class="px-5 py-16 text-center">
                        <span class="material-symbols-outlined block text-4xl text-slate-200">forum</span>
                        <p class="mt-3 text-sm text-slate-400">Chưa có cuộc trò chuyện nào</p>
                    </div>
                </div>
            </aside>

            <section class="flex min-h-[420px] flex-col">
                <template v-if="selectedConversation">
                    <header class="border-b border-slate-100 px-6 py-4">
                        <p class="text-sm font-semibold text-slate-900">{{ selectedConversation.customerName }}</p>
                        <p class="text-xs text-slate-400">{{ selectedConversation.customerEmail }}</p>
                    </header>

                    <div ref="messagesContainer" class="flex-grow space-y-4 overflow-y-auto bg-slate-50 px-6 py-5">
                        <div
                            v-for="message in messages"
                            :key="message.id"
                            :class="['flex', message.senderRole === 'staff' ? 'justify-end' : 'justify-start']"
                        >
                            <div class="max-w-[75%]">
                                <div
                                    :class="[
                                        'px-4 py-3 text-sm leading-relaxed',
                                        message.senderRole === 'staff'
                                            ? 'bg-slate-900 text-white'
                                            : 'border border-slate-200 bg-white text-slate-800'
                                    ]"
                                >
                                    {{ message.content }}
                                </div>
                                <p :class="['mt-1 text-[10px]', message.senderRole === 'staff' ? 'text-right text-slate-400' : 'text-slate-400']">
                                    {{ message.senderName }} · {{ formatTime(message) }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <div class="flex gap-3 border-t border-slate-100 bg-white p-4">
                        <input
                            v-model="inputText"
                            @keyup.enter="sendMessage"
                            type="text"
                            placeholder="Nhập phản hồi..."
                            class="flex-grow rounded-xl border border-slate-200 px-4 py-3 text-sm outline-none transition-all focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                        />
                        <button
                            @click="sendMessage"
                            :disabled="!inputText.trim()"
                            class="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 text-white transition-colors hover:bg-slate-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                            <span class="material-symbols-outlined text-[20px]">send</span>
                        </button>
                    </div>
                    <p v-if="sendError" class="border-t border-red-100 bg-red-50 px-4 py-2 text-xs text-red-600">
                        {{ sendError }}
                    </p>
                </template>

                <div v-else class="flex flex-grow flex-col items-center justify-center px-6 text-center">
                    <span class="material-symbols-outlined text-5xl text-slate-200">mark_chat_unread</span>
                    <p class="mt-4 text-sm font-semibold text-slate-700">Chọn một khách hàng để bắt đầu</p>
                </div>
            </section>
        </div>
    </div>
</template>
