import { ref, onMounted } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { surveyService } from '../services/surveyService'
import type { Survey, SurveyPayload, SurveyQuestionPayload } from '../types/survey.types'

/**
 * Quản lý danh sách khảo sát: fetch, toggle active, delete.
 */
export function useSurveyList() {
    const uiStore = useUIStore()

    const surveys = ref<Survey[]>([])
    const isLoading = ref(true)

    const fetchSurveys = async () => {
        isLoading.value = true
        try {
            const res = await surveyService.getSurveys()
            surveys.value = res.data.items ?? []
        } catch {
            uiStore.error('Lỗi khi tải danh sách khảo sát.')
        } finally {
            isLoading.value = false
        }
    }

    const toggleActive = async (survey: Survey) => {
        const payload: SurveyPayload = {
            title: survey.title,
            description: survey.description,
            reward_voucher_id: survey.reward_voucher_id,
            is_active: !survey.is_active,
            questions: survey.questions.map((q): SurveyQuestionPayload => ({
                id: q.id,
                text: q.text,
                type: q.type,
                is_required: q.is_required,
                options: ['SINGLE_CHOICE', 'MULTIPLE_CHOICE'].includes(q.type) ? q.options : null,
            })),
        }
        try {
            await surveyService.updateSurvey(survey.survey_id, payload)
            uiStore.success(payload.is_active ? 'Khảo sát đã được đặt hoạt động!' : 'Đã đóng khảo sát.')
            await fetchSurveys()
        } catch {
            uiStore.error('Lỗi khi thay đổi trạng thái.')
        }
    }

    const deleteSurvey = async (id: number) => {
        const confirmed = await uiStore.confirm({
            title: 'Xóa khảo sát',
            message: 'Bạn có chắc chắn muốn xóa? Hành động này sẽ xóa toàn bộ câu trả lời của khách hàng.',
            confirmLabel: 'Xóa',
            cancelLabel: 'Hủy',
            variant: 'danger',
        })
        if (!confirmed) return

        try {
            await surveyService.deleteSurvey(id)
            uiStore.success('Xóa khảo sát thành công.')
            await fetchSurveys()
        } catch {
            uiStore.error('Lỗi khi xóa khảo sát.')
        }
    }

    onMounted(fetchSurveys)

    return {
        surveys,
        isLoading,
        fetchSurveys,
        toggleActive,
        deleteSurvey,
    }
}
