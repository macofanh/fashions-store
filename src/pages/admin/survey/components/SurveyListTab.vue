<script setup lang="ts">
import type { Survey } from '../types/survey.types'

interface Emits {
    (e: 'edit', survey: Survey): void
    (e: 'delete', id: number): void
    (e: 'toggle-active', survey: Survey): void
    (e: 'view-analytics', survey: Survey): void
    (e: 'view-responses', survey: Survey): void
}

defineProps<{
    surveys: Survey[]
    isLoading: boolean
}>()

const emit = defineEmits<Emits>()
</script>

<template>
    <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <!-- Loading -->
        <div v-if="isLoading" class="py-20 flex justify-center">
            <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>

        <!-- Empty state -->
        <div v-else-if="surveys.length === 0" class="py-20 text-center text-gray-400 italic">
            Chưa có biểu mẫu khảo sát nào được tạo.
        </div>

        <!-- Table -->
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
                    <tr
                        v-for="survey in surveys"
                        :key="survey.survey_id"
                        class="hover:bg-gray-50/40 transition-colors"
                    >
                        <td class="px-6 py-4 text-gray-400">#{{ survey.survey_id }}</td>

                        <td class="px-6 py-4 max-w-[280px]">
                            <p class="font-bold text-gray-900 leading-snug">{{ survey.title }}</p>
                            <p v-if="survey.description" class="text-xs text-gray-400 mt-1 truncate">
                                {{ survey.description }}
                            </p>
                        </td>

                        <td class="px-6 py-4 font-semibold text-gray-600">
                            {{ survey.questions?.length ?? 0 }} câu hỏi
                        </td>

                        <td class="px-6 py-4">
                            <span
                                v-if="survey.voucher"
                                class="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700"
                            >
                                <span class="material-symbols-outlined text-[14px]">confirmation_number</span>
                                {{ survey.voucher.code }}
                            </span>
                            <span v-else class="text-gray-400 font-light text-xs">Không gắn quà</span>
                        </td>

                        <td class="px-6 py-4">
                            <button
                                class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold transition-all"
                                :class="survey.is_active
                                    ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                                    : 'bg-gray-100 text-gray-400 border border-gray-200'"
                                @click="emit('toggle-active', survey)"
                            >
                                <span
                                    class="w-1.5 h-1.5 rounded-full"
                                    :class="survey.is_active ? 'bg-indigo-600 animate-pulse' : 'bg-gray-400'"
                                ></span>
                                {{ survey.is_active ? 'Hoạt động' : 'Tắt' }}
                            </button>
                        </td>

                        <td class="px-6 py-4 font-bold text-gray-700">
                            {{ survey.response_count }} phản hồi
                        </td>

                        <td class="px-6 py-4 text-right space-x-1.5">
                            <button
                                class="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-600 transition-colors"
                                title="Xem Thống Kê"
                                @click="emit('view-analytics', survey)"
                            >
                                <span class="material-symbols-outlined text-[18px]">bar_chart</span>
                            </button>
                            <button
                                class="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                                title="Danh sách Phản Hồi"
                                @click="emit('view-responses', survey)"
                            >
                                <span class="material-symbols-outlined text-[18px]">list_alt</span>
                            </button>
                            <button
                                class="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                                title="Sửa Câu Hỏi"
                                @click="emit('edit', survey)"
                            >
                                <span class="material-symbols-outlined text-[18px]">edit</span>
                            </button>
                            <button
                                class="inline-flex items-center justify-center p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                title="Xóa Form"
                                @click="emit('delete', survey.survey_id)"
                            >
                                <span class="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</template>
