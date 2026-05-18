import {
    addDoc,
    collection,
    doc,
    onSnapshot,
    orderBy,
    query,
    serverTimestamp,
    setDoc,
    type Unsubscribe,
} from 'firebase/firestore'
import { db } from '@/lib/firebase'
import type { ChatConversation, ChatMessage, ChatSenderRole } from './chat.types'

function getDb() {
    if (!db) {
        throw new Error('Firebase chưa được cấu hình.')
    }

    return db
}

function conversationsCollection() {
    return collection(getDb(), 'customerChats')
}

function conversationRef(customerId: string) {
    return doc(getDb(), 'customerChats', customerId)
}

function messagesCollection(customerId: string) {
    return collection(getDb(), 'customerChats', customerId, 'messages')
}

export function subscribeToConversationMessages(
    customerId: string,
    onChange: (messages: ChatMessage[]) => void,
): Unsubscribe {
    const messagesQuery = query(messagesCollection(customerId), orderBy('createdAt', 'asc'))

    return onSnapshot(messagesQuery, snapshot => {
        onChange(
            snapshot.docs.map(item => ({
                id: item.id,
                ...(item.data() as Omit<ChatMessage, 'id'>),
            })),
        )
    })
}

export function subscribeToConversations(
    onChange: (conversations: ChatConversation[]) => void,
): Unsubscribe {
    const conversationsQuery = query(conversationsCollection(), orderBy('updatedAt', 'desc'))

    return onSnapshot(conversationsQuery, snapshot => {
        onChange(
            snapshot.docs.map(item => ({
                id: item.id,
                ...(item.data() as Omit<ChatConversation, 'id'>),
            })),
        )
    })
}

export async function sendChatMessage(input: {
    customerId: string
    customerName: string
    customerEmail: string
    senderId: string
    senderName: string
    senderRole: ChatSenderRole
    content: string
}) {
    const content = input.content.trim()
    if (!content) return

    await setDoc(
        conversationRef(input.customerId),
        {
            customerId: input.customerId,
            customerName: input.customerName,
            customerEmail: input.customerEmail,
            lastMessage: content,
            lastSenderRole: input.senderRole,
            lastMessageAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
        },
        { merge: true },
    )

    await addDoc(messagesCollection(input.customerId), {
        senderId: input.senderId,
        senderName: input.senderName,
        senderRole: input.senderRole,
        content,
        createdAt: serverTimestamp(),
    })
}
