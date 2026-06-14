<script setup lang="ts">
import type { Survey, SurveyResponse } from '../types/survey.types'

interface Emits {
    (e: 'view-detail', response: SurveyResponse): void
    (e: 'close-detail'): void
}

defineProps<{
    title: string
    responses: SurveyResponse[]
    isLoading: boolean
    surveys: Survey[]
    selectedResponseDetail: SurveyResponse | null
    formatTime: (dateStr: string) => string
}>()

const emit = defineEmits<Emits>()
</script>

<template>
    <!-- Responses table -->
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div class="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
            <div>
                <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Danh sách lượt nộp khảo sát</h3>
                <p class="text-xs text-gray-400 mt-0.5">{{ title }}</p>
            </div>
        </div>

        <div v-if="isLoading" class="py-20 flex justify-center">
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
                    <tr
                        v-for="r in responses"
                        :key="r.response_id"
                        class="hover:bg-gray-50/40 transition-colors"
                    >
                        <td class="px-6 py-4 text-gray-400">#{{ r.response_id }}</td>
                        <td class="px-6 py-4 font-bold text-gray-900">{{ r.user_name }}</td>
                        <td class="px-6 py-4 text-gray-500">{{ r.user_email }}</td>
                        <td class="px-6 py-4 font-mono text-xs text-gray-600">
                            <span v-if="r.order_id" class="bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                                #{{ r.order_id }}
                            </span>
                            <span v-else class="text-gray-400 font-light font-sans italic">—</span>
                        </td>
                        <td class="px-6 py-4 text-gray-500">{{ formatTime(r.created_at) }}</td>
                        <td class="px-6 py-4 text-right">
                            <button
                                class="text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors"
                                @click="emit('view-detail', r)"
                            >
                                Xem câu trả lời
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>

    <!-- Response detail modal -->
    <Teleport to="body">
        <div
            v-if="selectedResponseDetail"
            class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        >
            <div
                class="absolute inset-0 bg-black/60 backdrop-blur-sm"
                @click="$emit('close-detail')"
            ></div>

            <div class="relative w-full max-w-[600px] bg-white rounded-2xl shadow-2xl overflow-hidden border border-gray-200 z-10">
                <!-- Modal header -->
                <div class="px-6 py-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center text-left">
                    <div>
                        <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">Chi tiết câu trả lời</h3>
                        <p class="text-[10px] text-gray-400 font-light mt-0.5">
                            Khách hàng: {{ selectedResponseDetail.user_name }} · Nộp lúc {{ formatTime(selectedResponseDetail.created_at) }}
                        </p>
                    </div>
                    <button
                        class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-gray-200 text-gray-400 hover:text-gray-700 transition-colors"
                        @click="$emit('close-detail')"
                    >
                        <span class="material-symbols-outlined text-[20px]">close</span>
                    </button>
                </div>

                <!-- Modal body -->
                <div class="p-6 space-y-4 max-h-[450px] overflow-y-auto text-left">
                    <div
                        v-for="(q, qIdx) in surveys.find(s => s.survey_id === selectedResponseDetail.survey_id)?.questions ?? []"
                        :key="q.id"
                        class="space-y-1.5 pb-3 border-b border-gray-100 last:border-b-0"
                    >
                        <p class="text-xs font-bold text-gray-800">
                            {{ qIdx + 1 }}. {{ q.text }}
                        </p>

                        <div class="p-2.5 bg-gray-50 rounded-lg border border-gray-100/50 text-sm">
                            <template v-if="selectedResponseDetail.answers[q.id] !== undefined">
                                <!-- Multiple choices -->
                                <span v-if="Array.isArray(selectedResponseDetail.answers[q.id])">
                                    <span
                                        v-for="val in (selectedResponseDetail.answers[q.id] as string[])"
                                        :key="val"
                                        class="inline-block bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full px-2 py-0.5 text-xs font-bold mr-1 mb-1"
                                    >
                                        {{ val }}
                                    </span>
                                </span>
                                <!-- Single / rating / text -->
                                <template v-else>
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
                                    <span
                                        v-else-if="q.type === 'SINGLE_CHOICE'"
                                        class="bg-amber-50 border border-amber-200 text-amber-800 rounded-full px-2.5 py-0.5 text-xs font-bold"
                                    >
                                        {{ selectedResponseDetail.answers[q.id] }}
                                    </span>
                                    <p v-else class="text-gray-700 italic font-light">
                                        "{{ selectedResponseDetail.answers[q.id] }}"
                                    </p>
                                </template>
                            </template>
                            <span v-else class="text-gray-400 font-light italic text-xs">
                                Không trả lời (Không bắt buộc)
                            </span>
                        </div>
                    </div>
                </div>

                <!-- Modal footer -->
                <div class="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
                    <button
                        class="px-5 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-colors"
                        @click="$emit('close-detail')"
                    >
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    </Teleport>
</template>
