<script setup lang="ts">
import type { Voucher } from '@/pages/promotions/promotionService'
import type { Question, QuestionType } from '../types/survey.types'

interface Emits {
    (e: 'save'): void
    (e: 'cancel'): void
    (e: 'update:formTitle', value: string): void
    (e: 'update:formDesc', value: string): void
    (e: 'update:formVoucherId', value: number | null): void
    (e: 'update:formIsActive', value: boolean): void
    (e: 'add-question'): void
    (e: 'remove-question', idx: number): void
    (e: 'move-question', idx: number, direction: 'up' | 'down'): void
    (e: 'add-option', qIdx: number): void
    (e: 'remove-option', qIdx: number, optIdx: number): void
}

defineProps<{
    builderId: number | null
    formTitle: string
    formDesc: string
    formVoucherId: number | null
    formIsActive: boolean
    formQuestions: Question[]
    vouchers: Voucher[]
    choiceTypes: QuestionType[]
}>()

const emit = defineEmits<Emits>()
</script>

<template>
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        <!-- Left: Config + Questions (2 cols) -->
        <div class="lg:col-span-2 space-y-6">
            <!-- Survey info card -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
                <h3 class="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2 uppercase tracking-wider">
                    Thông tin Khảo sát
                </h3>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold text-gray-700">Tiêu đề khảo sát *</label>
                        <input
                            :value="formTitle"
                            type="text"
                            placeholder="Ví dụ: Khảo sát chất lượng dịch vụ Hè 2026"
                            class="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition-colors bg-white font-medium text-gray-900"
                            @input="$emit('update:formTitle', ($event.target as HTMLInputElement).value)"
                        />
                    </div>

                    <div class="flex flex-col gap-1.5">
                        <label class="text-xs font-semibold text-gray-700">Gắn Voucher Quà Tặng (Tùy chọn)</label>
                        <select
                            :value="formVoucherId"
                            class="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition-colors bg-white text-gray-900 font-semibold"
                            @change="$emit('update:formVoucherId', ($event.target as HTMLSelectElement).value === '' ? null : Number(($event.target as HTMLSelectElement).value))"
                        >
                            <option :value="null">Không tặng quà</option>
                            <option
                                v-for="v in vouchers"
                                :key="v.voucher_id"
                                :value="v.voucher_id"
                            >
                                {{ v.code }} - {{ v.name }} (-{{ v.discount_type === 'PERCENT'
                                    ? `${v.discount_value}%`
                                    : new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(v.discount_value)
                                }})
                            </option>
                        </select>
                    </div>
                </div>

                <div class="flex flex-col gap-1.5">
                    <label class="text-xs font-semibold text-gray-700">Mô tả (Hướng dẫn khách hàng)</label>
                    <textarea
                        :value="formDesc"
                        rows="2"
                        placeholder="Mô tả mục đích khảo sát và quyền lợi của khách hàng khi hoàn thành..."
                        class="w-full text-sm p-3 border border-gray-200 rounded-xl outline-none focus:border-indigo-400 transition-colors bg-white resize-none"
                        @input="$emit('update:formDesc', ($event.target as HTMLTextAreaElement).value)"
                    ></textarea>
                </div>

                <div class="flex items-center gap-2 pt-2">
                    <input
                        :checked="formIsActive"
                        type="checkbox"
                        id="isActiveSurvey"
                        class="w-4 h-4 rounded accent-indigo-600"
                        @change="$emit('update:formIsActive', ($event.target as HTMLInputElement).checked)"
                    />
                    <label for="isActiveSurvey" class="text-xs font-semibold text-gray-700 cursor-pointer select-none">
                        Đặt làm khảo sát hoạt động ngay lập tức (Hệ thống sẽ tự động tắt các khảo sát khác)
                    </label>
                </div>
            </div>

            <!-- Questions card -->
            <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
                <div class="flex items-center justify-between border-b border-gray-50 pb-2">
                    <h3 class="text-sm font-bold text-gray-900 uppercase tracking-wider">
                        Danh sách câu hỏi ({{ formQuestions.length }})
                    </h3>
                    <button
                        class="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors"
                        @click="$emit('add-question')"
                    >
                        <span class="material-symbols-outlined text-[16px]">add_circle</span>
                        Thêm câu hỏi mới
                    </button>
                </div>

                <div v-if="formQuestions.length === 0" class="py-12 text-center text-gray-400 italic text-sm">
                    Chưa có câu hỏi nào. Click "Thêm câu hỏi mới" để thiết lập.
                </div>

                <div v-else class="space-y-6">
                    <div
                        v-for="(q, idx) in formQuestions"
                        :key="q.id"
                        class="border border-gray-100 rounded-xl p-4 bg-gray-50/30 space-y-4 relative group"
                    >
                        <!-- Header: index + move controls -->
                        <div class="flex items-center justify-between border-b border-gray-100/50 pb-2">
                            <span class="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                                Câu {{ idx + 1 }}
                            </span>
                            <div class="flex items-center gap-1.5">
                                <button
                                    :disabled="idx === 0"
                                    class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30"
                                    @click="$emit('move-question', idx, 'up')"
                                >
                                    <span class="material-symbols-outlined text-[16px]">arrow_upward</span>
                                </button>
                                <button
                                    :disabled="idx === formQuestions.length - 1"
                                    class="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors disabled:opacity-30"
                                    @click="$emit('move-question', idx, 'down')"
                                >
                                    <span class="material-symbols-outlined text-[16px]">arrow_downward</span>
                                </button>
                                <button
                                    class="p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                    title="Xóa câu hỏi này"
                                    @click="$emit('remove-question', idx)"
                                >
                                    <span class="material-symbols-outlined text-[16px]">delete</span>
                                </button>
                            </div>
                        </div>

                        <!-- Question fields -->
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

                        <!-- Options (choice questions only) -->
                        <div
                            v-if="choiceTypes.includes(q.type)"
                            class="bg-white border border-gray-100 rounded-xl p-4 space-y-3"
                        >
                            <div class="flex items-center justify-between">
                                <label class="text-[10px] uppercase font-bold text-gray-500">Các phương án lựa chọn *</label>
                                <button
                                    class="text-xs text-indigo-600 hover:text-indigo-800 font-bold flex items-center gap-0.5"
                                    @click="$emit('add-option', idx)"
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
                                        class="text-gray-400 hover:text-red-500 transition-colors"
                                        @click="$emit('remove-option', idx, optIdx)"
                                    >
                                        <span class="material-symbols-outlined text-[16px]">close</span>
                                    </button>
                                </div>
                            </div>
                            <p class="text-[10px] text-gray-400 font-light">Lưu ý: Mẫu trắc nghiệm cần tối thiểu 2 phương án trở lên.</p>
                        </div>

                        <!-- Required toggle -->
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

            <!-- Action buttons -->
            <div class="flex justify-end gap-3 pt-2">
                <button
                    class="px-5 py-3 text-xs font-bold uppercase tracking-wider rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 transition-colors"
                    @click="emit('cancel')"
                >
                    Hủy bỏ
                </button>
                <button
                    class="px-6 py-3 text-xs font-bold uppercase tracking-wider rounded-xl bg-slate-900 hover:bg-indigo-600 text-white transition-colors"
                    @click="emit('save')"
                >
                    Lưu Biểu Mẫu Khảo Sát
                </button>
            </div>
        </div>

        <!-- Right: Preview (1 col) -->
        <div class="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-6 sticky top-24">
            <h3 class="text-sm font-bold text-gray-900 border-b border-gray-50 pb-2 uppercase tracking-wider">
                Xem trước giao diện Form
            </h3>

            <div class="border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
                <div class="bg-zinc-50 border-b border-gray-200 px-4 py-3 text-left">
                    <h4 class="text-xs font-bold text-fashion-black font-display uppercase tracking-wider truncate">
                        {{ formTitle || 'Chưa đặt tiêu đề' }}
                    </h4>
                    <p v-if="formDesc" class="text-[10px] text-zinc-500 font-light mt-1 line-clamp-2">
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

                        <div v-if="q.type === 'TEXT'">
                            <textarea disabled placeholder="Nhập câu trả lời..." class="w-full text-xs p-2 border border-zinc-200 rounded-lg bg-zinc-50 resize-none" rows="2"></textarea>
                        </div>

                        <div v-if="q.type === 'RATING'" class="flex gap-1 text-amber-400">
                            <span v-for="s in 5" :key="s" class="material-symbols-outlined text-[20px]" style="font-variation-settings:'FILL' 1">star</span>
                        </div>

                        <div v-if="q.type === 'SINGLE_CHOICE'" class="space-y-1">
                            <div v-for="(opt, oIdx) in q.options" :key="oIdx" class="flex items-center gap-1.5 text-xs text-zinc-600 font-light">
                                <span class="w-3.5 h-3.5 rounded-full border border-zinc-300 bg-white flex items-center justify-center shrink-0"></span>
                                <span>{{ opt || 'Phương án...' }}</span>
                            </div>
                        </div>

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
</template>
