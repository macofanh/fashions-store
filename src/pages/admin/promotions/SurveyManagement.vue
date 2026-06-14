<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useUIStore } from '@/stores/useUIStore'
import { promotionService, type Voucher } from '@/pages/promotions/promotionService'

const uiStore = useUIStore()

// ── State ─────────────────────────────────────────────────────────
const activeTab = ref<'list' | 'builder' | 'analytics' | 'responses'>('list')
const surveys = ref<any[]>([])
const vouchers = ref<Voucher[]>([])
const isLoading = ref(true)

// Builder Form State
const builderId = ref<number | null>(null) // null = Create, number = Edit
const formTitle = ref('')
const formDesc = ref('')
const formVoucherId = ref<number | null>(null)
const formIsActive = ref(true)
const formQuestions = ref<any[]>([]) // [{"id": 1, "text": "", "type": "TEXT", "is_required": true, "options": []}]

// Selected Survey for Analytics/Responses
const selectedSurveyId = ref<number | null>(null)
const selectedSurveyTitle = ref('')
const responses = ref<any[]>([])
const stats = ref<any>(null)
const isStatsLoading = ref(false)
const isResponsesLoading = ref(false)
const selectedResponseDetail = ref<any>(null)

// ── Load Data ─────────────────────────────────────────────────────
const fetchSurveys = async () => {
    isLoading.value = true
    try {
        const res = await axiosClient.get('/api/v1/orders/admin/surveys', { params: { page_size: 100 } })
        surveys.value = res.data.items || []
    } catch (e: any) {
        uiStore.error('Lỗi khi tải danh sách khảo sát.')
    } finally {
        isLoading.value = false
    }
}

const fetchVouchers = async () => {
    try {
        const res = await promotionService.getVouchers({ include_inactive: false })
        vouchers.value = res.data || []
    } catch (e: any) {
        console.error('Lỗi lấy voucher:', e)
    }
}

onMounted(() => {
    fetchSurveys()
    fetchVouchers()
})

// ── Builder Actions ───────────────────────────────────────────────
const addQuestion = () => {
    const nextId = formQuestions.value.length > 0 
        ? Math.max(...formQuestions.value.map(q => q.id)) + 1 
        : 1
    formQuestions.value.push({
        id: nextId,
        text: '',
        type: 'TEXT',
        is_required: true,
        options: []
    })
}

const removeQuestion = (idx: number) => {
    formQuestions.value.splice(idx, 1)
}

const moveQuestion = (idx: number, direction: 'up' | 'down') => {
    if (direction === 'up' && idx > 0) {
        const temp = formQuestions.value[idx]
        formQuestions.value[idx] = formQuestions.value[idx - 1]
        formQuestions.value[idx - 1] = temp
    } else if (direction === 'down' && idx < formQuestions.value.length - 1) {
        const temp = formQuestions.value[idx]
        formQuestions.value[idx] = formQuestions.value[idx + 1]
        formQuestions.value[idx + 1] = temp
    }
}

// Choice Option Actions
const addOption = (qIdx: number) => {
    if (!formQuestions.value[qIdx].options) {
        formQuestions.value[qIdx].options = []
    }
    formQuestions.value[qIdx].options.push('')
}

const removeOption = (qIdx: number, optIdx: number) => {
    formQuestions.value[qIdx].options.splice(optIdx, 1)
}

const resetBuilder = () => {
    builderId.value = null
    formTitle.value = ''
    formDesc.value = ''
    formVoucherId.value = null
    formIsActive.value = true
    formQuestions.value = [
        { id: 1, text: 'Trải nghiệm chung của bạn?', type: 'RATING', is_required: true, options: [] }
    ]
}

const startCreate = () => {
    resetBuilder()
    activeTab.value = 'builder'
}

const startEdit = (survey: any) => {
    builderId.value = survey.survey_id
    formTitle.value = survey.title
    formDesc.value = survey.description || ''
    formVoucherId.value = survey.reward_voucher_id
    formIsActive.value = survey.is_active
    // Clone questions to avoid direct state mutation
    formQuestions.value = JSON.parse(JSON.stringify(survey.questions || []))
    activeTab.value = 'builder'
}

const saveSurvey = async () => {
    if (!formTitle.value.trim()) {
        uiStore.error('Tiêu đề khảo sát không được để trống.')
        return
    }
    if (formQuestions.value.length === 0) {
        uiStore.error('Khảo sát cần có ít nhất một câu hỏi.')
        return
    }

    // Validate questions text
    for (let i = 0; i < formQuestions.value.length; i++) {
        const q = formQuestions.value[i]
        if (!q.text.trim()) {
            uiStore.error(`Câu hỏi số ${i + 1} không được để trống nội dung.`)
            return
        }
        if ((q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') && (!q.options || q.options.filter((o: string) => o.trim()).length < 2)) {
            uiStore.error(`Câu hỏi lựa chọn số ${i + 1} phải có ít nhất 2 phương án trả lời.`)
            return
        }
    }

    const payload = {
        title: formTitle.value.trim(),
        description: formDesc.value.trim() || null,
        reward_voucher_id: formVoucherId.value,
        is_active: formIsActive.value,
        questions: formQuestions.value.map(q => ({
            id: q.id,
            text: q.text.trim(),
            type: q.type,
            is_required: q.is_required,
            options: (q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE') 
                ? q.options.map((o: string) => o.trim()).filter(Boolean) 
                : null
        }))
    }

    try {
        if (builderId.value) {
            await axiosClient.put(`/api/v1/orders/admin/surveys/${builderId.value}`, payload)
            uiStore.success('Cập nhật biểu mẫu khảo sát thành công!')
        } else {
            await axiosClient.post('/api/v1/orders/admin/surveys', payload)
            uiStore.success('Tạo biểu mẫu khảo sát mới thành công!')
        }
        fetchSurveys()
        activeTab.value = 'list'
    } catch (e: any) {
        uiStore.error(e.response?.data?.detail || 'Lỗi khi lưu biểu mẫu khảo sát.')
    }
}

const deleteSurvey = async (id: number) => {
    if (!confirm('Bạn có chắc chắn muốn xóa biểu mẫu khảo sát này? Hành động này sẽ xóa toàn bộ câu trả lời của khách hàng.')) return
    try {
        await axiosClient.delete(`/api/v1/orders/admin/surveys/${id}`)
        uiStore.success('Xóa khảo sát thành công.')
        fetchSurveys()
        if (selectedSurveyId.value === id) {
            selectedSurveyId.value = null
            stats.value = null
            responses.value = []
        }
    } catch (e: any) {
        uiStore.error('Lỗi khi xóa khảo sát.')
    }
}

const toggleActive = async (survey: any) => {
    try {
        const payload = {
            title: survey.title,
            description: survey.description,
            reward_voucher_id: survey.reward_voucher_id,
            is_active: !survey.is_active,
            questions: survey.questions
        }
        await axiosClient.put(`/api/v1/orders/admin/surveys/${survey.survey_id}`, payload)
        uiStore.success(payload.is_active ? 'Khảo sát đã được đặt hoạt động!' : 'Đã đóng khảo sát.')
        fetchSurveys()
    } catch (e: any) {
        uiStore.error('Lỗi khi thay đổi trạng thái.')
    }
}

// ── Analytics & Responses Actions ─────────────────────────────────
const selectSurvey = (survey: any, tab: 'analytics' | 'responses') => {
    selectedSurveyId.value = survey.survey_id
    selectedSurveyTitle.value = survey.title
    activeTab.value = tab
    if (tab === 'analytics') {
        loadStats(survey.survey_id)
    } else {
        loadResponses(survey.survey_id)
    }
}

const loadStats = async (surveyId: number) => {
    isStatsLoading.value = true
    stats.value = null
    try {
        const res = await axiosClient.get(`/api/v1/orders/admin/surveys/${surveyId}/stats`)
        stats.value = res.data
    } catch (e) {
        uiStore.error('Không thể lấy thống kê khảo sát.')
    } finally {
        isStatsLoading.value = false
    }
}

const loadResponses = async (surveyId: number) => {
    isResponsesLoading.value = true
    responses.value = []
    try {
        const res = await axiosClient.get(`/api/v1/orders/admin/surveys/${surveyId}/responses`)
        responses.value = res.data.items || []
    } catch (e) {
        uiStore.error('Không thể lấy danh sách câu trả lời.')
    } finally {
        isResponsesLoading.value = false
    }
}

const formatTime = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) +
        ' · ' + d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-gray-900 font-display">Quản lý Khảo sát khách hàng</h1>
                <p class="text-sm text-gray-400 mt-1">Xây dựng form khảo sát thu thập ý kiến động và tự động tặng voucher quà tặng</p>
            </div>
            
            <div class="flex gap-2">
                <button
                    @click="activeTab = 'list'"
                    class="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                >
                    Danh sách
                </button>
                <button
                    @click="startCreate"
                    class="px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-900 hover:bg-primary text-white transition-colors flex items-center gap-1.5"
                >
                    <span class="material-symbols-outlined text-[16px]">add_circle</span>
                    Tạo Form Khảo Sát
                </button>
            </div>
        </div>

        <!-- Tab Content -->
        <!-- TAB 1: LIST -->
        <div v-if="activeTab === 'list'" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div v-if="isLoading" class="py-20 flex justify-center">
                <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>

            <div v-else-if="surveys.length === 0" class="py-20 text-center text-gray-400 italic">
                Chưa có biểu mẫu khảo sát nào được tạo.
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-4">ID</th>
                            <th class="px-6 py-4">Khảo sát / Tiêu đề</th>
                            <th class="px-6 py-4">Số câu hỏi</th>
                            <th class="px-6 py-4">Voucher Quà Tặng</th>
                            <th class="px-6 py-4">Trạng thái</th>
                            <th class="px-6 py-4">Lượt nộp</th>
                            <th class="px-6 py-4 text-right">Hành động</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50 text-sm">
                        <tr v-for="s in surveys" :key="s.survey_id" class="hover:bg-gray-50/40 transition-colors">
                            <td class="px-6 py-4 text-gray-400">#{{ s.survey_id }}</td>
                            <td class="px-6 py-4 max-w-[280px]">
                                <p class="font-bold text-gray-900 leading-snug">{{ s.title }}</p>
                                <p class="text-xs text-gray-400 mt-1 truncate" v-if="s.description">{{ s.description }}</p>
                            </td>
                            <td class="px-6 py-4 font-semibold text-gray-600">{{ s.questions?.length || 0 }} câu hỏi</td>
                            <td class="px-6 py-4">
                                <span v-if="s.voucher" class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700">
                                    <span class="material-symbols-outlined text-[14px]">confirmation_number</span>
                                    {{ s.voucher.code }}
                                </span>
                                <span v-else class="text-gray-400 font-light text-xs">Không gắn quà</span>
                            </td>
                            <td class="px-6 py-4">
                                <button 
                                    @click="toggleActive(s)"
                                    class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                                    :class="s.is_active ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' : 'bg-gray-100 text-gray-400 border border-gray-200'"
                                >
                                    <span class="w-1.5 h-1.5 rounded-full" :class="s.is_active ? 'bg-indigo-600 animate-pulse' : 'bg-gray-400'"></span>
                                    {{ s.is_active ? 'Hoạt động' : 'Tắt' }}
                                </button>
                            </td>
                            <td class="px-6 py-4 font-bold text-gray-700">{{ s.response_count }} phản hồi</td>
                            <td class="px-6 py-4 text-right space-x-1.5">
                                <button 
                                    @click="selectSurvey(s, 'analytics')" 
                                    class="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                                    title="Xem Thống Kê"
                                >
                                    <span class="material-symbols-outlined text-[18px]">bar_chart</span>
                                </button>
                                <button 
                                    @click="selectSurvey(s, 'responses')" 
                                    class="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                                    title="Danh sách Phản Hồi"
                                >
                                    <span class="material-symbols-outlined text-[18px]">list_alt</span>
                                </button>
                                <button 
                                    @click="startEdit(s)" 
                                    class="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                                    title="Sửa Câu Hỏi"
                                >
                                    <span class="material-symbols-outlined text-[18px]">edit</span>
                                </button>
                                <button 
                                    @click="deleteSurvey(s.survey_id)" 
                                    class="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                    title="Xóa Form"
                                >
                                    <span class="material-symbols-outlined text-[18px]">delete</span>
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- TAB 2: BUILDER (CREATE / EDIT) -->
        <div v-if="activeTab === 'builder'" class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
            <!-- Left: Config Settings & Questions list (2 cols) -->
            <div class="lg:col-span-2 space-y-6">
                <!-- Header Card -->
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                    <h3 class="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2 uppercase tracking-wider">Thông tin Khảo sát</h3>
                    
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold text-gray-700">Tiêu đề khảo sát *</label>
                            <input 
                                v-model="formTitle"
                                type="text"
                                placeholder="Ví dụ: Khảo sát chất lượng dịch vụ Hè 2026"
                                class="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition-colors bg-white font-medium text-gray-900"
                            />
                        </div>
                        <div class="flex flex-col gap-1.5">
                            <label class="text-xs font-semibold text-gray-700">Gắn Voucher Quà Tặng (Tùy chọn)</label>
                            <select 
                                v-model="formVoucherId"
                                class="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition-colors bg-white text-gray-900 font-semibold"
                            >
                                <option :value="null">Không tặng quà</option>
                                <option 
                                    v-for="v in vouchers" 
                                    :key="v.voucher_id" 
                                    :value="v.voucher_id"
                                >
                                    {{ v.code }} - {{ v.name }} (-{{ v.discount_type === 'PERCENT' ? `${v.discount_value}%` : `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discount_value)}` }})
                                </option>
                            </select>
                        </div>
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold text-gray-700">Mô tả (Hướng dẫn khách hàng)</label>
                        <textarea 
                            v-model="formDesc"
                            rows="2"
                            placeholder="Mô tả mục đích khảo sát và quyền lợi của khách hàng khi hoàn thành..."
                            class="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition-colors bg-white resize-none"
                        ></textarea>
                    </div>

                    <div class="flex items-center gap-2 pt-2">
                        <input 
                            v-model="formIsActive"
                            type="checkbox"
                            id="isActiveSurvey"
                            class="w-4 h-4 rounded accent-indigo-600"
                        />
                        <label for="isActiveSurvey" class="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                            Đặt làm khảo sát hoạt động ngay lập tức (Hệ thống sẽ tự động tắt các khảo sát khác)
                        </label>
                    </div>
                </div>

                <!-- Questions Card -->
                <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                    <div class="flex items-center justify-between border-b border-gray-50 pb-2">
                        <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Danh sách câu hỏi ({{ formQuestions.length }})</h3>
                        <button 
                            @click="addQuestion"
                            class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                        >
                            <span class="material-symbols-outlined text-[16px]">add_circle</span>
                            Thêm câu hỏi mới
                        </button>
                    </div>

                    <!-- Empty state -->
                    <div v-if="formQuestions.length === 0" class="py-12 text-center text-gray-400 italic text-sm">
                        Chưa có câu hỏi nào. Click "Thêm câu hỏi mới" để thiết lập.
                    </div>

                    <div v-else class="space-y-6">
                        <div 
                            v-for="(q, idx) in formQuestions" 
                            :key="q.id"
                            class="border border-gray-100 rounded-xl p-4 bg-gray-50/30 space-y-4 relative group"
                        >
                            <!-- Index and move arrows -->
                            <div class="flex items-center justify-between border-b border-gray-100/50 pb-2">
                                <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">Câu {{ idx + 1 }}</span>
                                
                                <div class="flex items-center gap-1.5">
                                    <button 
                                        @click="moveQuestion(idx, 'up')" 
                                        :disabled="idx === 0"
                                        class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30"
                                    >
                                        <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
                                    </button>
                                    <button 
                                        @click="moveQuestion(idx, 'down')" 
                                        :disabled="idx === formQuestions.length - 1"
                                        class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30"
                                    >
                                        <span class="material-symbols-outlined text-[16px]">arrow_downward</span>
                                    </button>
                                    <button 
                                        @click="removeQuestion(idx)" 
                                        class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                        title="Xóa câu hỏi này"
                                    >
                                        <span class="material-symbols-outlined text-[16px]">delete</span>
                                    </button>
                                </div>
                            </div>

                            <!-- Question editor fields -->
                            <div class="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div class="md:col-span-8 flex flex-col gap-1">
                                    <label class="text-[10px] uppercase font-bold text-gray-500">Nội dung câu hỏi *</label>
                                    <input 
                                        v-model="q.text"
                                        type="text"
                                        placeholder="Ví dụ: Bạn có hài lòng với dịch vụ đóng gói không?"
                                        class="w-full text-sm p-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-400 transition-colors bg-white text-gray-900"
                                    />
                                </div>
                                <div class="md:col-span-4 flex flex-col gap-1">
                                    <label class="text-[10px] uppercase font-bold text-gray-500">Loại câu hỏi</label>
                                    <select 
                                        v-model="q.type"
                                        class="w-full text-sm p-2.5 border border-gray-200 rounded-lg outline-none focus:border-indigo-400 transition-colors bg-white text-gray-900 font-semibold"
                                    >
                                        <option value="TEXT">Nhập văn bản (Text)</option>
                                        <option value="RATING">Đánh giá 1-5 sao (Rating)</option>
                                        <option value="SINGLE_CHOICE">Trắc nghiệm chọn 1 (Radio)</option>
                                        <option value="MULTIPLE_CHOICE">Trắc nghiệm chọn nhiều (Checkbox)</option>
                                    </select>
                                </div>
                            </div>

                            <!-- Predefined options details if choice question -->
                            <div 
                                v-if="q.type === 'SINGLE_CHOICE' || q.type === 'MULTIPLE_CHOICE'" 
                                class="bg-white border border-gray-100 rounded-xl p-4 space-y-3"
                            >
                                <div class="flex items-center justify-between">
                                    <label class="text-[10px] uppercase font-bold text-gray-500">Các phương án lựa chọn *</label>
                                    <button 
                                        @click="addOption(idx)"
                                        class="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                                    >
                                        <span class="material-symbols-outlined text-[14px]">add</span>
                                        Thêm phương án
                                    </button>
                                </div>

                                <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                                    <div 
                                        v-for="(opt, optIdx) in q.options" 
                                        :key="optIdx"
                                        class="flex items-center gap-1.5 border border-gray-100 rounded-lg p-2 bg-gray-50/20"
                                    >
                                        <span class="text-xs text-gray-400 font-bold">{{ optIdx + 1 }}.</span>
                                        <input 
                                            v-model="q.options[optIdx]"
                                            type="text"
                                            placeholder="Nội dung phương án..."
                                            class="w-full text-xs bg-transparent border-none outline-none text-gray-900 font-medium"
                                        />
                                        <button 
                                            @click="removeOption(idx, optIdx)"
                                            class="text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <span class="material-symbols-outlined text-[16px]">close</span>
                                        </button>
                                    </div>
                                </div>
                                <p class="text-[10px] text-gray-400 font-light">Lưu ý: Mẫu trắc nghiệm cần tối thiểu 2 phương án trở lên.</p>
                            </div>

                            <!-- Footer properties (Required toggle) -->
                            <div class="flex items-center gap-2 pt-1">
                                <input 
                                    v-model="q.is_required"
                                    type="checkbox"
                                    :id="`req-${q.id}`"
                                    class="w-4 h-4 rounded accent-indigo-600"
                                />
                                <label :for="`req-${q.id}`" class="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                                    Bắt buộc khách hàng phải trả lời câu này
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Action Button -->
                <div class="flex justify-end gap-3 pt-2">
                    <button
                        @click="activeTab = 'list'"
                        class="px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        @click="saveSurvey"
                        class="px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-900 hover:bg-indigo-600 text-white transition-colors"
                    >
                        Lưu Biểu Mẫu Khảo Sát
                    </button>
                </div>
            </div>

            <!-- Right: Preview Box (1 col) -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-24">
                <h3 class="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2 uppercase tracking-wider">Xem trước giao diện Form</h3>
                
                <div class="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                    <div class="bg-zinc-50 border-b border-gray-200 px-4 py-3 text-left">
                        <h4 class="text-xs font-bold text-fashion-black font-display uppercase tracking-wider truncate">
                            {{ formTitle || 'Chưa đặt tiêu đề' }}
                        </h4>
                        <p class="text-[10px] text-zinc-500 font-light mt-1 line-clamp-2" v-if="formDesc">
                            {{ formDesc }}
                        </p>
                    </div>

                    <div class="p-4 space-y-4 bg-white max-h-[350px] overflow-y-auto">
                        <div 
                            v-for="(q, idx) in formQuestions" 
                            :key="q.id"
                            class="text-left space-y-1.5 border-b border-dashed border-zinc-100 pb-3 last:border-b-0"
                        >
                            <span class="text-xs font-bold text-zinc-700 leading-snug">
                                {{ idx + 1 }}. {{ q.text || 'Nội dung câu hỏi...' }}
                                <span v-if="q.is_required" class="text-red-500">*</span>
                            </span>

                            <!-- Text Input Preview -->
                            <div v-if="q.type === 'TEXT'">
                                <textarea disabled placeholder="Nhập câu trả lời..." class="w-full text-xs p-2 border border-zinc-200 rounded-lg bg-zinc-50 resize-none" rows="2"></textarea>
                            </div>

                            <!-- Rating Preview -->
                            <div v-if="q.type === 'RATING'" class="flex gap-1 text-amber-400">
                                <span v-for="s in 5" :key="s" class="material-symbols-outlined text-[20px]" style="font-variation-settings:'FILL' 1">star</span>
                            </div>

                            <!-- Radio Preview -->
                            <div v-if="q.type === 'SINGLE_CHOICE'" class="space-y-1">
                                <div v-for="(opt, oIdx) in q.options" :key="oIdx" class="flex items-center gap-1.5 text-xs text-zinc-600 font-light">
                                    <span class="w-3.5 h-3.5 rounded-full border border-zinc-300 bg-white flex items-center justify-center shrink-0"></span>
                                    <span>{{ opt || 'Phương án...' }}</span>
                                </div>
                            </div>

                            <!-- Checkbox Preview -->
                            <div v-if="q.type === 'MULTIPLE_CHOICE'" class="space-y-1">
                                <div v-for="(opt, oIdx) in q.options" :key="oIdx" class="flex items-center gap-1.5 text-xs text-zinc-600 font-light">
                                    <span class="w-3.5 h-3.5 rounded border border-zinc-300 bg-white flex items-center justify-center shrink-0"></span>
                                    <span>{{ opt || 'Phương án...' }}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- TAB 3: STATS ANALYTICS -->
        <div v-if="activeTab === 'analytics'" class="space-y-6">
            <!-- Analytics header card -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
                <div class="text-left space-y-1">
                    <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full">Báo cáo khảo sát</span>
                    <h2 class="text-lg font-bold text-gray-900 leading-snug">{{ selectedSurveyTitle }}</h2>
                    <p class="text-xs text-gray-400 font-light">Thống kê phân tích câu trả lời từ khách hàng mua hàng thành công</p>
                </div>
                
                <div class="bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 text-center shrink-0">
                    <span class="text-xs text-gray-400 font-semibold block">Tổng số phản hồi</span>
                    <span class="text-3xl font-black text-slate-800 mt-1 block">
                        {{ stats ? stats.total_responses : 0 }}
                    </span>
                </div>
            </div>

            <!-- Loader / Stats Details -->
            <div v-if="isStatsLoading" class="py-20 flex justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
                <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>

            <div v-else-if="!stats || stats.total_responses === 0" class="py-20 text-center text-gray-400 italic bg-white rounded-2xl border border-gray-100 shadow-sm">
                Chưa có bất kỳ lượt nộp phản hồi nào cho khảo sát này.
            </div>

            <div v-else class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div 
                    v-for="(qStats, qIdx) in stats.questions_stats" 
                    :key="qStats.id"
                    class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4 text-left"
                >
                    <div class="border-b border-gray-50 pb-2">
                        <span class="text-[9px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 px-2 py-0.5 rounded border border-gray-100">
                            {{ qStats.type }}
                        </span>
                        <h4 class="text-sm font-bold text-gray-800 mt-2 leading-relaxed">
                            Câu {{ qIdx + 1 }}. {{ qStats.text }}
                        </h4>
                    </div>

                    <!-- 1. TEXT Type statistics (List of responses) -->
                    <div v-if="qStats.type === 'TEXT'" class="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                        <div 
                            v-for="(ans, aIdx) in qStats.stats.answers" 
                            :key="aIdx"
                            class="p-3 bg-slate-50/50 rounded-xl border border-gray-50 text-xs space-y-1"
                        >
                            <div class="flex items-center justify-between text-gray-400 font-semibold text-[10px]">
                                <span>{{ ans.user_name }}</span>
                                <span>{{ formatTime(ans.created_at) }}</span>
                            </div>
                            <p class="text-gray-700 italic font-light">"{{ ans.answer }}"</p>
                        </div>
                        <div v-if="!qStats.stats.answers?.length" class="text-center text-gray-400 italic text-xs py-4">Chưa có bình luận.</div>
                    </div>

                    <!-- 2. RATING Type statistics (Stars count & average score) -->
                    <div v-if="qStats.type === 'RATING'" class="space-y-4">
                        <div class="flex items-center gap-6">
                            <div class="text-center bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 min-w-[100px]">
                                <span class="text-[10px] text-gray-400 font-bold block uppercase tracking-wide">Điểm TB</span>
                                <span class="text-3xl font-black text-indigo-700 mt-1 block">{{ qStats.stats.average }}★</span>
                                <span class="text-[9px] text-gray-400 font-light mt-0.5 block">Trên {{ qStats.stats.count }} lượt</span>
                            </div>

                            <!-- Star chart distribution -->
                            <div class="flex-grow space-y-2">
                                <div 
                                    v-for="star in [5, 4, 3, 2, 1]" 
                                    :key="star"
                                    class="flex items-center gap-2 text-xs"
                                >
                                    <span class="w-6 font-bold text-gray-500 shrink-0 text-right">{{ star }}★</span>
                                    <div class="flex-grow h-2 bg-gray-100 rounded-full overflow-hidden">
                                        <div 
                                            class="h-full bg-indigo-500 rounded-full"
                                            :style="{ width: `${qStats.stats.count > 0 ? (qStats.stats.distribution[star] / qStats.stats.count) * 100 : 0}%` }"
                                        ></div>
                                    </div>
                                    <span class="w-8 text-gray-400 font-light shrink-0 text-right">{{ qStats.stats.distribution[star] }} lượt</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- 3. SINGLE_CHOICE / MULTIPLE_CHOICE statistics -->
                    <div v-if="qStats.type === 'SINGLE_CHOICE' || qStats.type === 'MULTIPLE_CHOICE'" class="space-y-3">
                        <div 
                            v-for="(count, opt) in qStats.stats.distribution" 
                            :key="opt"
                            class="space-y-1.5"
                        >
                            <div class="flex justify-between text-xs font-semibold text-gray-700">
                                <span>{{ opt }}</span>
                                <span class="text-gray-400">{{ count }} lượt ({{ stats.total_responses > 0 ? Math.round((count / stats.total_responses) * 100) : 0 }}%)</span>
                            </div>
                            <div class="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div 
                                    class="h-full rounded-full"
                                    :class="qStats.type === 'SINGLE_CHOICE' ? 'bg-amber-500' : 'bg-emerald-500'"
                                    :style="{ width: `${stats.total_responses > 0 ? (count / stats.total_responses) * 100 : 0}%` }"
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- TAB 4: RESPONSES DETAIL LIST -->
        <div v-if="activeTab === 'responses'" class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                <div>
                    <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Danh sách lượt nộp khảo sát</h3>
                    <p class="text-xs text-gray-400 mt-0.5">{{ selectedSurveyTitle }}</p>
                </div>
            </div>

            <div v-if="isResponsesLoading" class="py-20 flex justify-center">
                <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
            </div>

            <div v-else-if="responses.length === 0" class="py-20 text-center text-gray-400 italic">
                Chưa có câu trả lời nào được nộp.
            </div>

            <div v-else class="overflow-x-auto">
                <table class="w-full text-left border-collapse">
                    <thead>
                        <tr class="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-500 uppercase tracking-wider">
                            <th class="px-6 py-4">ID</th>
                            <th class="px-6 py-4">Khách hàng</th>
                            <th class="px-6 py-4">Email</th>
                            <th class="px-6 py-4">Đơn hàng tương ứng</th>
                            <th class="px-6 py-4">Thời gian nộp</th>
                            <th class="px-6 py-4 text-right">Chi tiết</th>
                        </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-50 text-sm">
                        <tr v-for="r in responses" :key="r.response_id" class="hover:bg-gray-50/40 transition-colors">
                            <td class="px-6 py-4 text-gray-400">#{{ r.response_id }}</td>
                            <td class="px-6 py-4 font-bold text-gray-900">{{ r.user_name }}</td>
                            <td class="px-6 py-4 text-gray-500">{{ r.user_email }}</td>
                            <td class="px-6 py-4 font-mono text-xs text-gray-600">
                                <span v-if="r.order_id" class="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">#{{ r.order_id }}</span>
                                <span v-else class="text-gray-400 font-light font-sans italic">—</span>
                            </td>
                            <td class="px-6 py-4 text-gray-500">{{ formatTime(r.created_at) }}</td>
                            <td class="px-6 py-4 text-right">
                                <button 
                                    @click="selectedResponseDetail = r"
                                    class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                >
                                    Xem câu trả lời
                                </button>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>

        <!-- RESPONSE DETAIL DIALOG MODAL -->
        <div 
            v-if="selectedResponseDetail" 
            class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
            <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="selectedResponseDetail = null"></div>

            <div class="relative w-full max-w-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-10">
                <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-left">
                    <div>
                        <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Chi tiết câu trả lời</h3>
                        <p class="text-[10px] text-gray-400 font-light mt-0.5">Khách hàng: {{ selectedResponseDetail.user_name }} · Nộp lúc {{ formatTime(selectedResponseDetail.created_at) }}</p>
                    </div>
                    <button 
                        @click="selectedResponseDetail = null"
                        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                    >
                        <span class="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <div class="p-6 space-y-4 max-h-[450px] overflow-y-auto text-left">
                    <div 
                        v-for="(q, qIdx) in surveys.find(s => s.survey_id === selectedResponseDetail.survey_id)?.questions || []" 
                        :key="q.id"
                        class="space-y-1.5 pb-3 border-b border-gray-100 last:border-b-0"
                    >
                        <p class="text-xs font-bold text-gray-800">
                            {{ qIdx + 1 }}. {{ q.text }}
                        </p>
                        
                        <div class="p-2.5 bg-gray-50 rounded-lg border border-gray-100/50 text-sm">
                            <span v-if="selectedResponseDetail.answers[q.id] !== undefined">
                                <!-- Multiple choices display -->
                                <span v-if="Array.isArray(selectedResponseDetail.answers[q.id])">
                                    <span 
                                        v-for="(val, vIdx) in selectedResponseDetail.answers[q.id]" 
                                        :key="val"
                                        class="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full px-2 py-0.5 text-xs font-bold mr-1 mb-1"
                                    >
                                        {{ val }}
                                    </span>
                                </span>
                                <!-- Single choice / rating / text display -->
                                <span v-else>
                                    <span v-if="q.type === 'RATING'" class="flex items-center gap-1">
                                        <b class="text-amber-500 font-bold">{{ selectedResponseDetail.answers[q.id] }}★</b>
                                        <span class="flex text-amber-400">
                                            <span 
                                                v-for="s in 5" 
                                                :key="s" 
                                                class="material-symbols-outlined text-[16px]" 
                                                :style="{ fontVariationSettings: Number(selectedResponseDetail.answers[q.id]) >= s ? `'FILL' 1` : `'FILL' 0` }"
                                            >star</span>
                                        </span>
                                    </span>
                                    <span v-else-if="q.type === 'SINGLE_CHOICE'" class="bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-bold">
                                        {{ selectedResponseDetail.answers[q.id] }}
                                    </span>
                                    <p v-else class="text-gray-700 italic font-light">
                                        "{{ selectedResponseDetail.answers[q.id] }}"
                                    </p>
                                </span>
                            </span>
                            <span v-else class="text-gray-400 font-light italic text-xs">Không trả lời (Không bắt buộc)</span>
                        </div>
                    </div>
                </div>

                <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button 
                        @click="selectedResponseDetail = null"
                        class="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
</style>
