<script setup lang="ts">
import { ref, watch } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useUIStore } from '@/stores/useUIStore'

const props = defineProps<{
    show: boolean
    survey: any // Dynamic survey details containing title, description, questions list
    orderId: number
}>()

const emit = defineEmits<{
    (e: 'close'): void
    (e: 'success', voucher: any): void
}>()

const uiStore = useUIStore()

const answers = ref<Record<string, any>>({})
const validationErrors = ref<Record<string, string>>({})
const isSubmitting = ref(false)
const showSuccess = ref(false)
const rewardedVoucher = ref<any>(null)

// Initialize form answers based on survey questions
const initializeAnswers = () => {
    if (!props.survey || !props.survey.questions) return
    const initialAnswers: Record<string, any> = {}
    props.survey.questions.forEach((q: any) => {
        const qId = q.id.toString()
        if (q.type === 'MULTIPLE_CHOICE') {
            initialAnswers[qId] = []
        } else if (q.type === 'RATING') {
            initialAnswers[qId] = 0 // 0 means unrated
        } else {
            initialAnswers[qId] = ''
        }
    })
    answers.value = initialAnswers
    validationErrors.value = {}
}

watch(() => props.survey, initializeAnswers, { immediate: true })

const clearError = (qId: string) => {
    if (validationErrors.value[qId]) {
        delete validationErrors.value[qId]
    }
}

// Client-side validation logic
const validateForm = (): boolean => {
    validationErrors.value = {}
    let isValid = true
    
    if (!props.survey || !props.survey.questions) return false
    
    props.survey.questions.forEach((q: any) => {
        const qId = q.id.toString()
        const answer = answers.value[qId]
        
        if (q.is_required) {
            if (q.type === 'MULTIPLE_CHOICE') {
                if (!answer || answer.length === 0) {
                    validationErrors.value[qId] = 'Vui lòng chọn ít nhất một phương án.'
                    isValid = false
                }
            } else if (q.type === 'RATING') {
                if (!answer || answer === 0) {
                    validationErrors.value[qId] = 'Vui lòng chọn mức đánh giá sao.'
                    isValid = false
                }
            } else if (q.type === 'SINGLE_CHOICE') {
                if (!answer) {
                    validationErrors.value[qId] = 'Vui lòng chọn một phương án.'
                    isValid = false
                }
            } else { // TEXT
                if (!answer || !answer.trim()) {
                    validationErrors.value[qId] = 'Vui lòng điền câu trả lời.'
                    isValid = false
                }
            }
        }
    })
    
    return isValid
}

const submitSurvey = async () => {
    if (!validateForm()) {
        uiStore.warning('Vui lòng hoàn thành đầy đủ các câu hỏi bắt buộc.')
        return
    }

    isSubmitting.value = true
    try {
        // Convert any numeric rating answers to strings to match Pydantic schema validation
        const processedAnswers: Record<string, string | string[]> = {}
        for (const [key, val] of Object.entries(answers.value)) {
            if (typeof val === 'number') {
                processedAnswers[key] = val.toString()
            } else {
                processedAnswers[key] = val
            }
        }

        const res = await axiosClient.post('/api/v1/orders/survey/submit', {
            survey_id: props.survey.survey_id,
            order_id: props.orderId || null,
            answers: processedAnswers
        })
        
        rewardedVoucher.value = res.data.voucher
        showSuccess.value = true
        emit('success', res.data.voucher)
    } catch (e: any) {
        console.error(e)
        const msg = e.response?.data?.detail || 'Gửi khảo sát thất bại.'
        uiStore.error(msg)
    } finally {
        isSubmitting.value = false
    }
}

const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)
</script>

<template>
    <div 
        v-if="show" 
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
    >
        <!-- Backdrop -->
        <div class="absolute inset-0 bg-black/60 backdrop-blur-sm" @click="!isSubmitting && !showSuccess && emit('close')"></div>

        <!-- Content -->
        <div class="relative w-full max-w-[550px] max-h-[90vh] flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden border border-border-light z-10 transform transition-all duration-300">
            <!-- Header -->
            <div class="px-6 py-5 border-b border-border-light flex justify-between items-center bg-background-light shrink-0">
                <h3 class="text-base font-bold text-fashion-black font-display uppercase tracking-wider">Khảo sát ý kiến khách hàng</h3>
                <button 
                    v-if="!isSubmitting && !showSuccess" 
                    @click="emit('close')"
                    class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-border-light text-zinc-400 hover:text-fashion-black transition-colors"
                >
                    <span class="material-symbols-outlined text-[20px]">close</span>
                </button>
            </div>

            <!-- Body: Form -->
            <div v-if="!showSuccess" class="flex-1 overflow-y-auto p-6 space-y-6">
                <div>
                    <h4 class="text-sm font-bold text-zinc-800 mb-1">{{ survey?.title }}</h4>
                    <p class="text-xs text-zinc-500 leading-relaxed font-light">
                        {{ survey?.description || 'Ý kiến đóng góp của bạn cực kỳ quý giá giúp chúng tôi nâng cấp chất lượng phục vụ mỗi ngày. Sau khi hoàn thành, bạn sẽ nhận được 01 Gift Voucher đặc biệt.' }}
                    </p>
                </div>

                <!-- Survey Questions -->
                <div class="space-y-6">
                    <div 
                        v-for="(q, idx) in survey?.questions" 
                        :key="q.id" 
                        class="space-y-3 pb-6 border-b border-zinc-100 last:border-b-0 last:pb-0"
                    >
                        <div class="flex flex-col gap-1">
                            <label class="text-xs font-semibold text-zinc-800">
                                {{ Number(idx) + 1 }}. {{ q.text }}
                                <span v-if="q.is_required" class="text-red-500 ml-0.5">*</span>
                            </label>
                        </div>

                        <!-- Render based on Question Type -->

                        <!-- 1. TEXT -->
                        <div v-if="q.type === 'TEXT'">
                            <textarea 
                                v-model="answers[q.id.toString()]"
                                @input="clearError(q.id.toString())"
                                rows="3"
                                :disabled="isSubmitting"
                                maxlength="1000"
                                :placeholder="q.is_required ? 'Nhập ý kiến của bạn ở đây (bắt buộc)...' : 'Nhập ý kiến của bạn ở đây (không bắt buộc)...'"
                                class="w-full text-xs font-light p-3 border rounded-xl outline-none transition-colors resize-none placeholder:text-zinc-300 focus:border-primary disabled:bg-zinc-50"
                                :class="validationErrors[q.id.toString()] ? 'border-red-400' : 'border-border-light'"
                            ></textarea>
                        </div>

                        <!-- 2. RATING -->
                        <div v-else-if="q.type === 'RATING'" class="flex items-center gap-1.5">
                            <button 
                                v-for="star in 5" 
                                :key="star"
                                type="button"
                                :disabled="isSubmitting"
                                @click="answers[q.id.toString()] = star; clearError(q.id.toString())"
                                class="text-amber-400 focus:outline-none transition-all active:scale-95 hover:scale-110 disabled:opacity-50"
                            >
                                <span class="material-symbols-outlined text-[32px] select-none" :style="{ fontVariationSettings: answers[q.id.toString()] >= star ? `'FILL' 1` : `'FILL' 0` }">
                                    star
                                </span>
                            </button>
                            <span class="ml-2 text-xs font-medium text-zinc-500">
                                {{ 
                                    answers[q.id.toString()] === 5 ? 'Rất tốt' : 
                                    answers[q.id.toString()] === 4 ? 'Tốt' : 
                                    answers[q.id.toString()] === 3 ? 'Bình thường' : 
                                    answers[q.id.toString()] === 2 ? 'Không tốt' : 
                                    answers[q.id.toString()] === 1 ? 'Rất tệ' : 'Chưa đánh giá'
                                }}
                            </span>
                        </div>

                        <!-- 3. SINGLE_CHOICE -->
                        <div v-else-if="q.type === 'SINGLE_CHOICE'" class="grid grid-cols-1 gap-2">
                            <label 
                                v-for="option in q.options" 
                                :key="option"
                                class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-200"
                                :class="[
                                    answers[q.id.toString()] === option ? 'border-primary bg-primary/5 text-fashion-black font-semibold' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300',
                                    isSubmitting ? 'pointer-events-none opacity-50' : ''
                                ]"
                            >
                                <input 
                                    type="radio" 
                                    :name="'q_' + q.id" 
                                    :value="option"
                                    :disabled="isSubmitting"
                                    v-model="answers[q.id.toString()]"
                                    @change="clearError(q.id.toString())"
                                    class="hidden"
                                />
                                <span class="w-4 h-4 rounded-full border flex items-center justify-center shrink-0 transition-colors"
                                      :class="answers[q.id.toString()] === option ? 'border-primary' : 'border-zinc-300'">
                                    <span v-if="answers[q.id.toString()] === option" class="w-2.5 h-2.5 rounded-full bg-primary"></span>
                                </span>
                                <span class="text-xs">{{ option }}</span>
                            </label>
                        </div>

                        <!-- 4. MULTIPLE_CHOICE -->
                        <div v-else-if="q.type === 'MULTIPLE_CHOICE'" class="grid grid-cols-1 gap-2">
                            <label 
                                v-for="option in q.options" 
                                :key="option"
                                class="flex items-center gap-3 p-3 border rounded-xl cursor-pointer transition-all duration-200"
                                :class="[
                                    answers[q.id.toString()]?.includes(option) ? 'border-primary bg-primary/5 text-fashion-black font-semibold' : 'border-zinc-200 text-zinc-600 hover:border-zinc-300',
                                    isSubmitting ? 'pointer-events-none opacity-50' : ''
                                ]"
                            >
                                <input 
                                    type="checkbox" 
                                    :value="option"
                                    :disabled="isSubmitting"
                                    v-model="answers[q.id.toString()]"
                                    @change="clearError(q.id.toString())"
                                    class="hidden"
                                />
                                <span class="w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors"
                                      :class="answers[q.id.toString()]?.includes(option) ? 'border-primary bg-primary text-white' : 'border-zinc-300'">
                                    <span v-if="answers[q.id.toString()]?.includes(option)" class="material-symbols-outlined text-[12px] font-bold">check</span>
                                </span>
                                <span class="text-xs">{{ option }}</span>
                            </label>
                        </div>

                        <!-- Validation error for current question -->
                        <span v-if="validationErrors[q.id.toString()]" class="text-[10px] text-red-500 font-medium block mt-1 flex items-center gap-1">
                            <span class="material-symbols-outlined text-[12px]">error</span>
                            {{ validationErrors[q.id.toString()] }}
                        </span>
                    </div>
                </div>

                <!-- Footer / Button -->
                <div class="pt-4 shrink-0">
                    <button
                        @click="submitSurvey"
                        :disabled="isSubmitting"
                        class="w-full bg-fashion-black text-white hover:bg-primary transition-colors py-3.5 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50 cursor-pointer"
                    >
                        <span v-if="isSubmitting" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                        <span v-else class="material-symbols-outlined text-[16px]">send</span>
                        Gửi phản hồi khảo sát
                    </button>
                </div>
            </div>

            <!-- Body: Success screen -->
            <div v-else class="flex-1 overflow-y-auto p-8 text-center space-y-6">
                <!-- Checkmark animation -->
                <div class="mx-auto w-16 h-16 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center animate-bounce">
                    <span class="material-symbols-outlined text-[36px]" style="font-variation-settings:'FILL' 1">check_circle</span>
                </div>
                
                <div class="space-y-2">
                    <h4 class="text-lg font-bold text-fashion-black">Gửi khảo sát thành công!</h4>
                    <p class="text-xs text-zinc-500 font-light max-w-sm mx-auto">
                        Cảm ơn bạn rất nhiều! Ý kiến của bạn đã được ghi nhận. Để bày tỏ sự cảm ơn, chúng tôi xin gửi tặng bạn một phần quà:
                    </p>
                </div>

                <!-- Rewarded Voucher Card -->
                <div v-if="rewardedVoucher" class="border border-emerald-200 bg-emerald-50/30 rounded-xl p-5 relative overflow-hidden max-w-sm mx-auto text-left flex gap-4">
                    <div class="flex h-16 w-20 shrink-0 flex-col items-center justify-center rounded-lg text-center bg-emerald-500 text-white shadow-sm">
                        <span class="text-lg font-serif italic font-bold leading-none">
                            {{ rewardedVoucher.discount_type === 'PERCENT' ? `-${rewardedVoucher.discount_value}%` : `-${formatPrice(rewardedVoucher.discount_value)}` }}
                        </span>
                        <span class="mt-0.5 text-[8px] uppercase tracking-widest opacity-85">GIFT</span>
                    </div>
                    <div class="min-w-0 flex-1 pt-0.5">
                        <span class="inline-flex rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[8px] font-bold uppercase tracking-widest text-emerald-700">
                            {{ rewardedVoucher.code }}
                        </span>
                        <h5 class="mt-2 line-clamp-1 text-sm font-bold leading-snug text-fashion-black font-display">{{ rewardedVoucher.name }}</h5>
                        <p class="text-[9px] text-zinc-500 font-light mt-1">Đã được thêm trực tiếp vào ví Voucher của bạn.</p>
                    </div>
                </div>

                <div class="pt-4">
                    <button 
                        @click="emit('close')"
                        class="px-8 py-3 bg-fashion-black text-white hover:bg-primary transition-colors rounded-xl text-xs font-bold uppercase tracking-widest cursor-pointer"
                    >
                        Đóng và tiếp tục
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<style scoped>
@reference "../../assets/main.css";
</style>

