import { ref } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { surveyService } from '../services/surveyService'
import type { Survey, Question, QuestionType, SurveyPayload } from '../types/survey.types'

const CHOICE_TYPES: QuestionType[] = ['SINGLE_CHOICE', 'MULTIPLE_CHOICE']

const createEmptyQuestion = (id: number): Question => ({
    id,
    text: '',
    type: 'TEXT',
    is_required: true,
    options: [],
})

const buildDefaultQuestion = (): Question => ({
    id: 1,
    text: 'Trải nghiệm chung của bạn?',
    type: 'RATING',
    is_required: true,
    options: [],
})

/**
 * Quản lý form tạo/sửa khảo sát (builder tab).
 */
export function useSurveyBuilder(onSaved: () => Promise<void>) {
    const uiStore = useUIStore()

    const builderId = ref<number | null>(null)
    const formTitle = ref('')
    const formDesc = ref('')
    const formVoucherId = ref<number | null>(null)
    const formIsActive = ref(true)
    const formQuestions = ref<Question[]>([])

    // ── Reset & Initialize ────────────────────────────────────────

    const resetBuilder = () => {
        builderId.value = null
        formTitle.value = ''
        formDesc.value = ''
        formVoucherId.value = null
        formIsActive.value = true
        formQuestions.value = [buildDefaultQuestion()]
    }

    const populateFromSurvey = (survey: Survey) => {
        builderId.value = survey.survey_id
        formTitle.value = survey.title
        formDesc.value = survey.description ?? ''
        formVoucherId.value = survey.reward_voucher_id
        formIsActive.value = survey.is_active
        // deep clone để tránh mutate state gốc
        formQuestions.value = JSON.parse(JSON.stringify(survey.questions ?? []))
    }

    // ── Question management ───────────────────────────────────────

    const addQuestion = () => {
        const nextId = formQuestions.value.length > 0
            ? Math.max(...formQuestions.value.map(q => q.id)) + 1
            : 1
        formQuestions.value.push(createEmptyQuestion(nextId))
    }

    const removeQuestion = (idx: number) => {
        formQuestions.value.splice(idx, 1)
    }

    const moveQuestion = (idx: number, direction: 'up' | 'down') => {
        const target = direction === 'up' ? idx - 1 : idx + 1
        if (target < 0 || target >= formQuestions.value.length) return
        const questions = formQuestions.value
        const a = questions[idx]!
        const b = questions[target]!
        questions[idx] = b
        questions[target] = a
    }

    // ── Option management (for choice questions) ──────────────────

    const addOption = (qIdx: number) => {
        const q = formQuestions.value[qIdx]
        if (!q) return
        q.options ??= []
        q.options.push('')
    }

    const removeOption = (qIdx: number, optIdx: number) => {
        const q = formQuestions.value[qIdx]
        if (!q) return
        q.options.splice(optIdx, 1)
    }

    // ── Validation ────────────────────────────────────────────────

    const validate = (): boolean => {
        if (!formTitle.value.trim()) {
            uiStore.error('Tiêu đề khảo sát không được để trống.')
            return false
        }
        if (formQuestions.value.length === 0) {
            uiStore.error('Khảo sát cần có ít nhất một câu hỏi.')
            return false
        }
        for (let i = 0; i < formQuestions.value.length; i++) {
            const q = formQuestions.value[i]
            if (!q) continue
            if (!q.text.trim()) {
                uiStore.error(`Câu hỏi số ${i + 1} không được để trống nội dung.`)
                return false
            }
            if (CHOICE_TYPES.includes(q.type)) {
                const validOptions = (q.options ?? []).filter(o => o.trim()).length
                if (validOptions < 2) {
                    uiStore.error(`Câu hỏi lựa chọn số ${i + 1} phải có ít nhất 2 phương án trả lời.`)
                    return false
                }
            }
        }
        return true
    }

    // ── Build payload ─────────────────────────────────────────────

    const buildPayload = (): SurveyPayload => ({
        title: formTitle.value.trim(),
        description: formDesc.value.trim() || null,
        reward_voucher_id: formVoucherId.value,
        is_active: formIsActive.value,
        questions: formQuestions.value.map(q => ({
            id: q.id,
            text: q.text.trim(),
            type: q.type,
            is_required: q.is_required,
            options: CHOICE_TYPES.includes(q.type)
                ? q.options.map(o => o.trim()).filter(Boolean)
                : null,
        })),
    })

    // ── Save ──────────────────────────────────────────────────────

    const saveSurvey = async (): Promise<boolean> => {
        if (!validate()) return false

        const payload = buildPayload()
        try {
            if (builderId.value) {
                await surveyService.updateSurvey(builderId.value, payload)
                uiStore.success('Cập nhật biểu mẫu khảo sát thành công!')
            } else {
                await surveyService.createSurvey(payload)
                uiStore.success('Tạo biểu mẫu khảo sát mới thành công!')
            }
            await onSaved()
            return true
        } catch (e: any) {
            uiStore.error(e.response?.data?.detail ?? 'Lỗi khi lưu biểu mẫu khảo sát.')
            return false
        }
    }

    return {
        builderId,
        formTitle,
        formDesc,
        formVoucherId,
        formIsActive,
        formQuestions,
        CHOICE_TYPES,
        resetBuilder,
        populateFromSurvey,
        addQuestion,
        removeQuestion,
        moveQuestion,
        addOption,
        removeOption,
        saveSurvey,
    }
}
