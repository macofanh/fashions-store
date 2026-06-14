<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { promotionService, type Voucher } from '@/pages/promotions/promotionService'
import { useSurveyList } from './composables/useSurveyList'
import { useSurveyBuilder } from './composables/useSurveyBuilder'
import { useSurveyAnalytics } from './composables/useSurveyAnalytics'
import SurveyListTab from './components/SurveyListTab.vue'
import SurveyBuilderTab from './components/SurveyBuilderTab.vue'
import SurveyAnalyticsTab from './components/SurveyAnalyticsTab.vue'
import SurveyResponsesTab from './components/SurveyResponsesTab.vue'
import type { Survey } from './types/survey.types'

type Tab = 'list' | 'builder' | 'analytics' | 'responses'

// ── Active tab ────────────────────────────────────────────────────
const activeTab = ref<Tab>('list')

// ── Vouchers (for builder form) ───────────────────────────────────
const vouchers = ref<Voucher[]>([])

const fetchVouchers = async () => {
    try {
        const res = await promotionService.getVouchers({ include_inactive: false })
        vouchers.value = res.data ?? []
    } catch (e) {
        console.error('Lỗi lấy voucher:', e)
    }
}

// ── Composables ───────────────────────────────────────────────────
const surveyList = useSurveyList()

const surveyBuilder = useSurveyBuilder(async () => {
    await surveyList.fetchSurveys()
    activeTab.value = 'list'
})

const surveyAnalytics = useSurveyAnalytics()

// ── Tab navigation helpers ────────────────────────────────────────
const goToCreate = () => {
    surveyBuilder.resetBuilder()
    activeTab.value = 'builder'
}

const goToEdit = (survey: Survey) => {
    surveyBuilder.populateFromSurvey(survey)
    activeTab.value = 'builder'
}

const goToAnalytics = (survey: Survey) => {
    surveyAnalytics.selectForAnalytics(survey.survey_id, survey.title)
    activeTab.value = 'analytics'
}

const goToResponses = (survey: Survey) => {
    surveyAnalytics.selectForResponses(survey.survey_id, survey.title)
    activeTab.value = 'responses'
}

// ── Init ──────────────────────────────────────────────────────────
onMounted(fetchVouchers)
</script>

<template>
    <div class="space-y-6">
        <!-- Page header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 font-display">Quản lý Khảo sát khách hàng</h1>
                <p class="text-sm text-gray-400 mt-1">
                    Xây dựng form khảo sát thu thập ý kiến động và tự động tặng voucher quà tặng
                </p>
            </div>

            <div class="flex gap-2">
                <button
                    class="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                    @click="activeTab = 'list'"
                >
                    Danh sách
                </button>
                <button
                    class="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-900 hover:bg-primary text-white transition-colors flex items-center gap-1.5"
                    @click="goToCreate"
                >
                    <span class="material-symbols-outlined text-[16px]">add_circle</span>
                    Tạo Form Khảo Sát
                </button>
            </div>
        </div>

        <!-- Tab: List -->
        <SurveyListTab
            v-if="activeTab === 'list'"
            :surveys="surveyList.surveys.value"
            :is-loading="surveyList.isLoading.value"
            @edit="goToEdit"
            @delete="surveyList.deleteSurvey"
            @toggle-active="surveyList.toggleActive"
            @view-analytics="goToAnalytics"
            @view-responses="goToResponses"
        />

        <!-- Tab: Builder (Create / Edit) -->
        <SurveyBuilderTab
            v-else-if="activeTab === 'builder'"
            :builder-id="surveyBuilder.builderId.value"
            :form-title="surveyBuilder.formTitle.value"
            :form-desc="surveyBuilder.formDesc.value"
            :form-voucher-id="surveyBuilder.formVoucherId.value"
            :form-is-active="surveyBuilder.formIsActive.value"
            :form-questions="surveyBuilder.formQuestions.value"
            :vouchers="vouchers"
            :choice-types="surveyBuilder.CHOICE_TYPES"
            @update:form-title="surveyBuilder.formTitle.value = $event"
            @update:form-desc="surveyBuilder.formDesc.value = $event"
            @update:form-voucher-id="surveyBuilder.formVoucherId.value = $event"
            @update:form-is-active="surveyBuilder.formIsActive.value = $event"
            @add-question="surveyBuilder.addQuestion"
            @remove-question="surveyBuilder.removeQuestion"
            @move-question="surveyBuilder.moveQuestion"
            @add-option="surveyBuilder.addOption"
            @remove-option="surveyBuilder.removeOption"
            @save="surveyBuilder.saveSurvey"
            @cancel="activeTab = 'list'"
        />

        <!-- Tab: Analytics -->
        <SurveyAnalyticsTab
            v-else-if="activeTab === 'analytics'"
            :title="surveyAnalytics.selectedSurveyTitle.value"
            :stats="surveyAnalytics.stats.value"
            :is-loading="surveyAnalytics.isStatsLoading.value"
        />

        <!-- Tab: Responses -->
        <SurveyResponsesTab
            v-else-if="activeTab === 'responses'"
            :title="surveyAnalytics.selectedSurveyTitle.value"
            :responses="surveyAnalytics.responses.value"
            :is-loading="surveyAnalytics.isResponsesLoading.value"
            :surveys="surveyList.surveys.value"
            :selected-response-detail="surveyAnalytics.selectedResponseDetail.value"
            :format-time="surveyAnalytics.formatTime"
            @view-detail="(r) => (surveyAnalytics.selectedResponseDetail.value = r)"
            @close-detail="surveyAnalytics.closeResponseDetail"
        />
    </div>
</template>
