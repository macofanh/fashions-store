<script setup lang="ts">
import type { SurveyStats } from '../types/survey.types'

defineProps<{
    title: string
    stats: SurveyStats | null
    isLoading: boolean
}>()
</script>

<template>
    <div class="space-y-6">
        <!-- Header card -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex flex-col md:flex-row items-center justify-between gap-6">
            <div class="text-left space-y-1">
                <span class="text-[10px] font-bold text-indigo-600 uppercase tracking-widest bg-indigo-50 px-2.5 py-0.5 rounded-full">
                    Báo cáo khảo sát
                </span>
                <h2 class="text-lg font-bold text-gray-900 leading-snug">{{ title }}</h2>
                <p class="text-xs text-gray-400 font-light">Thống kê phân tích câu trả lời từ khách hàng mua hàng thành công</p>
            </div>
            <div class="bg-gray-50 border border-gray-100 rounded-xl px-6 py-4 text-center shrink-0">
                <span class="text-xs text-gray-400 font-semibold block">Tổng số phản hồi</span>
                <span class="text-3xl font-black text-slate-800 mt-1 block">
                    {{ stats?.total_responses ?? 0 }}
                </span>
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="py-20 flex justify-center bg-white rounded-2xl border border-gray-100 shadow-sm">
            <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>

        <!-- Empty -->
        <div
            v-else-if="!stats || stats.total_responses === 0"
            class="py-20 text-center text-gray-400 italic bg-white rounded-2xl border border-gray-100 shadow-sm"
        >
            Chưa có bất kỳ lượt nộp phản hồi nào cho khảo sát này.
        </div>

        <!-- Question stats grid -->
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

                <!-- TEXT: list of answers -->
                <div v-if="qStats.type === 'TEXT'" class="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                    <div
                        v-for="(ans, aIdx) in (qStats.stats as any).answers"
                        :key="aIdx"
                        class="p-3 bg-slate-50/50 rounded-xl border border-gray-50 text-xs space-y-1"
                    >
                        <div class="flex items-center justify-between text-gray-400 font-semibold text-[10px]">
                            <span>{{ ans.user_name }}</span>
                            <span>{{ ans.created_at }}</span>
                        </div>
                        <p class="text-gray-700 italic font-light">"{{ ans.answer }}"</p>
                    </div>
                    <div v-if="!(qStats.stats as any).answers?.length" class="text-center text-gray-400 italic text-xs py-4">
                        Chưa có bình luận.
                    </div>
                </div>

                <!-- RATING: average + distribution bar -->
                <div v-if="qStats.type === 'RATING'" class="space-y-4">
                    <div class="flex items-center gap-6">
                        <div class="text-center bg-indigo-50/50 border border-indigo-100/50 rounded-2xl p-4 min-w-[100px]">
                            <span class="text-[10px] text-gray-400 font-bold block uppercase tracking-wide">Điểm TB</span>
                            <span class="text-3xl font-black text-indigo-700 mt-1 block">{{ (qStats.stats as any).average }}★</span>
                            <span class="text-[9px] text-gray-400 font-light mt-0.5 block">Trên {{ (qStats.stats as any).count }} lượt</span>
                        </div>
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
                                        :style="{
                                            width: `${(qStats.stats as any).count > 0
                                                ? ((qStats.stats as any).distribution[star] / (qStats.stats as any).count) * 100
                                                : 0}%`
                                        }"
                                    ></div>
                                </div>
                                <span class="w-8 text-gray-400 font-light shrink-0 text-right">
                                    {{ (qStats.stats as any).distribution[star] }} lượt
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- SINGLE_CHOICE / MULTIPLE_CHOICE: distribution bars -->
                <div
                    v-if="qStats.type === 'SINGLE_CHOICE' || qStats.type === 'MULTIPLE_CHOICE'"
                    class="space-y-3"
                >
                    <div
                        v-for="(count, opt) in (qStats.stats as any).distribution"
                        :key="opt"
                        class="space-y-1.5"
                    >
                        <div class="flex justify-between text-xs font-semibold text-gray-700">
                            <span>{{ opt }}</span>
                            <span class="text-gray-400">
                                {{ count }} lượt ({{ stats.total_responses > 0 ? Math.round((count / stats.total_responses) * 100) : 0 }}%)
                            </span>
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
</template>
