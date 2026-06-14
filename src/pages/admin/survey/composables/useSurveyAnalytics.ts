import { ref } from 'vue'
import { useUIStore } from '@/stores/useUIStore'
import { surveyService } from '../services/surveyService'
import type { SurveyStats, SurveyResponse } from '../types/survey.types'

/**
 * Quản lý dữ liệu analytics và danh sách responses cho một khảo sát được chọn.
 */
export function useSurveyAnalytics() {
    const uiStore = useUIStore()

    const selectedSurveyId = ref<number | null>(null)
    const selectedSurveyTitle = ref('')

    const stats = ref<SurveyStats | null>(null)
    const isStatsLoading = ref(false)

    const responses = ref<SurveyResponse[]>([])
    const isResponsesLoading = ref(false)

    const selectedResponseDetail = ref<SurveyResponse | null>(null)

    const loadStats = async (surveyId: number) => {
        isStatsLoading.value = true
        stats.value = null
        try {
            const res = await surveyService.getSurveyStats(surveyId)
            stats.value = res.data
        } catch {
            uiStore.error('Không thể lấy thống kê khảo sát.')
        } finally {
            isStatsLoading.value = false
        }
    }

    const loadResponses = async (surveyId: number) => {
        isResponsesLoading.value = true
        responses.value = []
        try {
            const res = await surveyService.getSurveyResponses(surveyId)
            responses.value = res.data.items ?? []
        } catch {
            uiStore.error('Không thể lấy danh sách câu trả lời.')
        } finally {
            isResponsesLoading.value = false
        }
    }

    const selectForAnalytics = (surveyId: number, title: string) => {
        selectedSurveyId.value = surveyId
        selectedSurveyTitle.value = title
        loadStats(surveyId)
    }

    const selectForResponses = (surveyId: number, title: string) => {
        selectedSurveyId.value = surveyId
        selectedSurveyTitle.value = title
        loadResponses(surveyId)
    }

    const formatTime = (dateStr: string): string => {
        const d = new Date(dateStr)
        return (
            d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
            ' · ' +
            d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
        )
    }

    const closeResponseDetail = () => {
        selectedResponseDetail.value = null
    }

    return {
        selectedSurveyId,
        selectedSurveyTitle,
        stats,
        isStatsLoading,
        responses,
        isResponsesLoading,
        selectedResponseDetail,
        selectForAnalytics,
        selectForResponses,
        formatTime,
        closeResponseDetail,
    }
}
