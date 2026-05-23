import axios from 'axios'

export interface ChatAIRequest {
    message: string
    user_id?: number | string | null
}

export interface ChatAIResponse {
    response: string
}

class ChatAIService {
    private readonly baseUrl = 'http://127.0.0.1:8000'

    public sendMessage(data: ChatAIRequest) {
        return axios.post<ChatAIResponse>(`${this.baseUrl}/chat`, {
            message: data.message,
            user_id: String(data.user_id ?? ''),
        })
    }
}

export const chatAIService = new ChatAIService()
