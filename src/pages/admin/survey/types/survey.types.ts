// ── Question ──────────────────────────────────────────────────────
export type QuestionType = 'TEXT' | 'RATING' | 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE'

export interface Question {
    id: number
    text: string
    type: QuestionType
    is_required: boolean
    options: string[]
}

// ── Voucher summary (embedded in Survey) ──────────────────────────
export interface SurveyVoucher {
    voucher_id: number
    code: string
    name: string
}

// ── Survey ────────────────────────────────────────────────────────
export interface Survey {
    survey_id: number
    title: string
    description: string | null
    reward_voucher_id: number | null
    is_active: boolean
    questions: Question[]
    response_count: number
    voucher: SurveyVoucher | null
}

// ── Survey form state (create / edit) ─────────────────────────────
export interface SurveyFormState {
    builderId: number | null // null = create mode, number = edit mode
    title: string
    description: string
    voucherId: number | null
    isActive: boolean
    questions: Question[]
}

// ── Analytics & Responses ─────────────────────────────────────────
export interface TextAnswer {
    user_name: string
    created_at: string
    answer: string
}

export interface TextStats {
    answers: TextAnswer[]
}

export interface RatingStats {
    average: number
    count: number
    distribution: Record<number, number> // { 1: 3, 2: 5, 3: 10, 4: 20, 5: 12 }
}

export interface ChoiceStats {
    distribution: Record<string, number>
}

export interface QuestionStats {
    id: number
    text: string
    type: QuestionType
    stats: TextStats | RatingStats | ChoiceStats
}

export interface SurveyStats {
    total_responses: number
    questions_stats: QuestionStats[]
}

export interface SurveyResponse {
    response_id: number
    survey_id: number
    user_name: string
    user_email: string
    order_id: number | null
    created_at: string
    answers: Record<number, string | string[] | number>
}

// ── API payloads ──────────────────────────────────────────────────
export interface SurveyQuestionPayload {
    id: number
    text: string
    type: QuestionType
    is_required: boolean
    options: string[] | null
}

export interface SurveyPayload {
    title: string
    description: string | null
    reward_voucher_id: number | null
    is_active: boolean
    questions: SurveyQuestionPayload[]
}
