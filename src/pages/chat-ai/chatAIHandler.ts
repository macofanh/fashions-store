import { nextTick, ref } from 'vue'
import { chatAIService } from './chatAIService'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'

export interface ChatAIMessage {
    id: number
    role: 'user' | 'assistant'
    content: string
    time: string
}

function getMessageTime() {
    return new Date().toLocaleTimeString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
    })
}

export function chatAIHandler() {
    const authStore = useAuthStore()
    const uiStore = useUIStore()

    const inputText = ref('')
    const isSending = ref(false)
    const error = ref<string | null>(null)
    const messages = ref<ChatAIMessage[]>([
        {
            id: 1,
            role: 'assistant',
            content: 'Xin chào! Tôi là trợ lý AI của LUXU. Bạn muốn tìm sản phẩm hay cần tư vấn phối đồ?',
            time: getMessageTime(),
        },
    ])

    let messageId = 2

    const sendMessage = async (afterUpdate?: () => void) => {
        const content = inputText.value.trim()
        if (!content || isSending.value) return

        messages.value.push({
            id: messageId++,
            role: 'user',
            content,
            time: getMessageTime(),
        })
        inputText.value = ''
        error.value = null
        isSending.value = true

        await nextTick()
        afterUpdate?.()

        try {
            const response = await chatAIService.sendMessage({
                message: content,
                user_id: authStore.user?.user_id,
            })

            messages.value.push({
                id: messageId++,
                role: 'assistant',
                content: response.data.response,
                time: getMessageTime(),
            })
        } catch (err: any) {
            const message =
                err.response?.data?.detail ||
                'Không thể kết nối tới trợ lý AI. Vui lòng kiểm tra server 127.0.0.1:8000.'
            error.value = message
            uiStore.error(message)
        } finally {
            isSending.value = false
            await nextTick()
            afterUpdate?.()
        }
    }

    const retryLastMessage = async (afterUpdate?: () => void) => {
        const lastUserMessage = [...messages.value].reverse().find(message => message.role === 'user')
        if (!lastUserMessage || isSending.value) return

        inputText.value = lastUserMessage.content
        await sendMessage(afterUpdate)
    }

    const clearMessages = () => {
        messages.value = [
            {
                id: messageId++,
                role: 'assistant',
                content: 'Cuộc trò chuyện đã được làm mới. Bạn cần tôi hỗ trợ gì tiếp theo?',
                time: getMessageTime(),
            },
        ]
        error.value = null
    }

    return {
        inputText,
        isSending,
        error,
        messages,
        sendMessage,
        retryLastMessage,
        clearMessages,
    }
}
