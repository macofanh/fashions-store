import axiosClient from '@/lib/axiosClient'
import type { Survey, SurveyPayload, SurveyStats, SurveyResponse } from '../types/survey.types'

const BASE = '/api/v1/orders/admin/surveys'

export const surveyService = {
    /** Lấy danh sách tất cả khảo sát */
    getSurveys(): Promise<{ data: { items: Survey[] } }> {
        return axiosClient.get(BASE, { params: { page_size: 100 } })
    },

    /** Tạo khảo sát mới */
    createSurvey(payload: SurveyPayload): Promise<{ data: Survey }> {
        return axiosClient.post(BASE, payload)
    },

    /** Cập nhật khảo sát */
    updateSurvey(id: number, payload: SurveyPayload): Promise<{ data: Survey }> {
        return axiosClient.put(`${BASE}/${id}`, payload)
    },

    /** Xóa khảo sát */
    deleteSurvey(id: number): Promise<void> {
        return axiosClient.delete(`${BASE}/${id}`)
    },

    /** Lấy thống kê câu trả lời của một khảo sát */
    getSurveyStats(id: number): Promise<{ data: SurveyStats }> {
        return axiosClient.get(`${BASE}/${id}/stats`)
    },

    /** Lấy danh sách phản hồi của một khảo sát */
    getSurveyResponses(id: number): Promise<{ data: { items: SurveyResponse[] } }> {
        return axiosClient.get(`${BASE}/${id}/responses`)
    },
}
