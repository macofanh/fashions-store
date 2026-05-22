import type { Timestamp } from 'firebase/firestore'

export type ChatSenderRole = 'customer' | 'staff'

export interface ChatConversation {
    id: string
    customerId: string
    customerName: string
    customerEmail: string
    lastMessage: string
    lastSenderRole: ChatSenderRole
    lastMessageAt: Timestamp | null
    updatedAt: Timestamp | null
    staffLastReadAt?: Timestamp | null
}

export interface ChatMessage {
    id: string
    senderId: string
    senderName: string
    senderRole: ChatSenderRole
    content: string
    createdAt: Timestamp | null
}
