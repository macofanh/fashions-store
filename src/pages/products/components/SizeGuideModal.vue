<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { SIZE_TABLES, getSuggestedSize } from '@/lib/sizeHelper'
import { useAuthStore } from '@/stores/useAuthStore'

const props = defineProps<{
    initialGender: 'male' | 'female' | 'unisex' | null
    initialSizeType: 'top' | 'bottom' | null
}>()

const emit = defineEmits<{
    close: []
}>()

const authStore = useAuthStore()

// --- UI State ---
const activeTab = ref<'chart' | 'calculator'>('chart')
const selectedGender = ref<'male' | 'female'>(
    props.initialGender === 'female' ? 'female' : 'male'
)
const selectedSizeType = ref<'top' | 'bottom'>(
    props.initialSizeType === 'bottom' ? 'bottom' : 'top'
)

// --- Calculator State ---
const calcHeight = ref<number | ''>(authStore.user?.height_cm ?? '')
const calcWeight = ref<number | ''>(authStore.user?.weight_kg ?? '')
const calcGender = ref<'male' | 'female'>(
    props.initialGender === 'female' ? 'female' : 'male'
)
const calcSizeType = ref<'top' | 'bottom'>(
    props.initialSizeType === 'bottom' ? 'bottom' : 'top'
)
const calcResult = ref<string | null>(null)
const calcDetail = ref<string | null>(null)

// --- Size Chart Data ---
const currentTableData = computed(() => {
    const key = `${selectedSizeType.value}_${selectedGender.value}`
    return SIZE_TABLES[key] || []
})

// --- Run Size Predictor ---
const handleCalculate = () => {
    if (!calcHeight.value || !calcWeight.value) {
        return
    }

    const size = getSuggestedSize(
        Number(calcHeight.value),
        Number(calcWeight.value),
        calcSizeType.value,
        calcGender.value
    )

    if (size) {
        calcResult.value = size
        
        // Find ranges to provide explanation
        const key = `${calcSizeType.value}_${calcGender.value}`
        const record = SIZE_TABLES[key]?.find(item => item.name === size)
        
        if (record) {
            calcDetail.value = `Kích cỡ ${size} phù hợp với chiều cao khoảng ${record.heightMin}-${record.heightMax}cm và cân nặng khoảng ${record.weightMin}-${record.weightMax}kg.`
        } else {
            calcDetail.value = `Gợi ý kích cỡ dựa trên thông số chiều cao và cân nặng bạn đã nhập.`
        }
    } else {
        calcResult.value = 'N/A'
        calcDetail.value = 'Không tìm thấy kích cỡ phù hợp. Vui lòng thử lại với các số đo khác.'
    }
}

onMounted(() => {
    if (calcHeight.value && calcWeight.value) {
        handleCalculate()
    }
})
</script>

<template>
    <div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
        <!-- Modal Container -->
        <div class="bg-white w-full max-w-3xl rounded-2xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-gray-100 animate-scale-up">
            
            <!-- Modal Header -->
            <div class="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                    <h3 class="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <span class="material-symbols-outlined text-gray-700">straighten</span>
                        Hướng dẫn chọn kích cỡ
                    </h3>
                    <p class="text-xs text-gray-500 mt-0.5">Tìm kích cỡ vừa vặn nhất cho cơ thể bạn</p>
                </div>
                <button @click="emit('close')" class="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors">
                    <span class="material-symbols-outlined text-xl">close</span>
                </button>
            </div>

            <!-- Tabs Navigation -->
            <div class="flex border-b border-gray-100 bg-gray-50 px-6 gap-6">
                <button 
                    @click="activeTab = 'chart'"
                    :class="[
                        'py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all font-display',
                        activeTab === 'chart' 
                            ? 'border-black text-black' 
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                    ]"
                >
                    Bảng số đo chi tiết
                </button>
                <button 
                    @click="activeTab = 'calculator'"
                    :class="[
                        'py-3.5 text-sm font-semibold tracking-wide border-b-2 transition-all font-display',
                        activeTab === 'calculator' 
                            ? 'border-black text-black' 
                            : 'border-transparent text-gray-400 hover:text-gray-600'
                    ]"
                >
                    Máy tính gợi ý size
                </button>
            </div>

            <!-- Modal Body (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-6">
                
                <!-- Tab 1: Size Chart Table -->
                <div v-if="activeTab === 'chart'" class="space-y-6">
                    <!-- Toggles -->
                    <div class="flex flex-wrap items-center gap-4 justify-between bg-gray-50 p-3 rounded-xl border border-gray-100">
                        <!-- Gender toggle -->
                        <div class="flex bg-white rounded-lg p-0.5 shadow-sm border border-gray-100">
                            <button 
                                @click="selectedGender = 'male'"
                                :class="[
                                    'px-4 py-1.5 text-xs font-semibold rounded-md transition-colors',
                                    selectedGender === 'male' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
                                ]"
                            >
                                Nam
                            </button>
                            <button 
                                @click="selectedGender = 'female'"
                                :class="[
                                    'px-4 py-1.5 text-xs font-semibold rounded-md transition-colors',
                                    selectedGender === 'female' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
                                ]"
                            >
                                Nữ
                            </button>
                        </div>

                        <!-- Product Type toggle -->
                        <div class="flex bg-white rounded-lg p-0.5 shadow-sm border border-gray-100">
                            <button 
                                @click="selectedSizeType = 'top'"
                                :class="[
                                    'px-4 py-1.5 text-xs font-semibold rounded-md transition-colors',
                                    selectedSizeType === 'top' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
                                ]"
                            >
                                Áo (Tops)
                            </button>
                            <button 
                                @click="selectedSizeType = 'bottom'"
                                :class="[
                                    'px-4 py-1.5 text-xs font-semibold rounded-md transition-colors',
                                    selectedSizeType === 'bottom' ? 'bg-black text-white' : 'text-gray-600 hover:text-black'
                                ]"
                            >
                                Quần & Váy (Bottoms)
                            </button>
                        </div>
                    </div>

                    <!-- Size Chart Table -->
                    <div class="overflow-x-auto rounded-xl border border-gray-200">
                        <table class="w-full text-left border-collapse">
                            <thead>
                                <tr class="bg-gray-50 text-gray-700 text-xs font-bold border-b border-gray-200">
                                    <th class="py-3 px-4 font-display">Size</th>
                                    <th class="py-3 px-4 font-display">Chiều cao (cm)</th>
                                    <th class="py-3 px-4 font-display">Cân nặng (kg)</th>
                                    <template v-if="selectedSizeType === 'top'">
                                        <th class="py-3 px-4 font-display">Dài áo (cm)</th>
                                        <th class="py-3 px-4 font-display">Rộng ngực (cm)</th>
                                        <th class="py-3 px-4 font-display" v-if="selectedGender === 'male'">Rộng vai (cm)</th>
                                        <th class="py-3 px-4 font-display">Chiều dài tay (cm)</th>
                                    </template>
                                    <template v-else>
                                        <th class="py-3 px-4 font-display">Vòng eo (cm)</th>
                                        <th class="py-3 px-4 font-display">Vòng mông (cm)</th>
                                        <th class="py-3 px-4 font-display">Rộng ống (cm)</th>
                                    </template>
                                </tr>
                            </thead>
                            <tbody>
                                <tr 
                                    v-for="row in currentTableData" 
                                    :key="row.name"
                                    class="border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors text-sm text-gray-800"
                                >
                                    <td class="py-3 px-4 font-bold text-black font-display">{{ row.name }}</td>
                                    <td class="py-3 px-4">{{ row.heightMin }} – {{ row.heightMax }}cm</td>
                                    <td class="py-3 px-4">{{ row.weightMin }} – {{ row.weightMax }}kg</td>
                                    <template v-if="selectedSizeType === 'top'">
                                        <td class="py-3 px-4">{{ row.topLength || '-' }}</td>
                                        <td class="py-3 px-4">{{ row.topWidth || '-' }}</td>
                                        <td class="py-3 px-4" v-if="selectedGender === 'male'">{{ row.shoulder || '-' }}</td>
                                        <td class="py-3 px-4">{{ row.sleeve || '-' }}</td>
                                    </template>
                                    <template v-else>
                                        <td class="py-3 px-4">{{ row.bottomWidth || '-' }}</td>
                                        <td class="py-3 px-4">{{ row.hip || '-' }}</td>
                                        <td class="py-3 px-4">{{ row.legOpening || '-' }}</td>
                                    </template>
                                </tr>
                            </tbody>
                        </table>
                    </div>

                    <div class="text-xs text-gray-400 italic">
                        * Số đo thực tế có thể chênh lệch 1-2cm tùy theo form dáng của từng dòng sản phẩm cụ thể.
                    </div>
                </div>

                <!-- Tab 2: Size Calculator -->
                <div v-else-if="activeTab === 'calculator'" class="space-y-6">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                        
                        <!-- Form Card -->
                        <div class="p-6 rounded-2xl border border-gray-200 bg-white shadow-sm space-y-4">
                            <h4 class="text-sm font-bold text-gray-900 uppercase tracking-wider font-display">Nhập thông số của bạn</h4>
                            
                            <!-- Gender selection -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Giới tính</label>
                                <div class="flex gap-2">
                                    <button 
                                        @click="calcGender = 'male'"
                                        type="button"
                                        :class="[
                                            'flex-1 py-2 text-sm font-semibold border rounded-lg transition-all',
                                            calcGender === 'male' 
                                                ? 'border-black bg-black text-white' 
                                                : 'border-gray-200 text-gray-700 hover:border-black'
                                        ]"
                                    >
                                        Nam
                                    </button>
                                    <button 
                                        @click="calcGender = 'female'"
                                        type="button"
                                        :class="[
                                            'flex-1 py-2 text-sm font-semibold border rounded-lg transition-all',
                                            calcGender === 'female' 
                                                ? 'border-black bg-black text-white' 
                                                : 'border-gray-200 text-gray-700 hover:border-black'
                                        ]"
                                    >
                                        Nữ
                                    </button>
                                </div>
                            </div>

                            <!-- Product Type selection -->
                            <div>
                                <label class="block text-xs font-semibold text-gray-600 mb-1.5">Loại sản phẩm</label>
                                <div class="flex gap-2">
                                    <button 
                                        @click="calcSizeType = 'top'"
                                        type="button"
                                        :class="[
                                            'flex-1 py-2 text-sm font-semibold border rounded-lg transition-all',
                                            calcSizeType === 'top' 
                                                ? 'border-black bg-black text-white' 
                                                : 'border-gray-200 text-gray-700 hover:border-black'
                                        ]"
                                    >
                                        Áo (Tops)
                                    </button>
                                    <button 
                                        @click="calcSizeType = 'bottom'"
                                        type="button"
                                        :class="[
                                            'flex-1 py-2 text-sm font-semibold border rounded-lg transition-all',
                                            calcSizeType === 'bottom' 
                                                ? 'border-black bg-black text-white' 
                                                : 'border-gray-200 text-gray-700 hover:border-black'
                                        ]"
                                    >
                                        Quần (Bottoms)
                                    </button>
                                </div>
                            </div>

                            <!-- Height input -->
                            <div>
                                <label for="heightInput" class="block text-xs font-semibold text-gray-600 mb-1">Chiều cao (cm)</label>
                                <input 
                                    id="heightInput"
                                    type="number" 
                                    v-model="calcHeight" 
                                    placeholder="Ví dụ: 170"
                                    min="100"
                                    max="250"
                                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-black focus:outline-none transition-colors"
                                />
                            </div>

                            <!-- Weight input -->
                            <div>
                                <label for="weightInput" class="block text-xs font-semibold text-gray-600 mb-1">Cân nặng (kg)</label>
                                <input 
                                    id="weightInput"
                                    type="number" 
                                    v-model="calcWeight" 
                                    placeholder="Ví dụ: 62"
                                    min="20"
                                    max="200"
                                    class="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:border-black focus:outline-none transition-colors"
                                />
                            </div>

                            <button 
                                @click="handleCalculate"
                                :disabled="!calcHeight || !calcWeight"
                                class="w-full bg-black text-white font-bold py-2.5 rounded-lg text-sm hover:bg-gray-900 transition-colors disabled:opacity-40 disabled:cursor-not-allowed font-display flex items-center justify-center gap-1.5 shadow-sm"
                            >
                                <span class="material-symbols-outlined text-sm">calculate</span>
                                Tính toán kích cỡ gợi ý
                            </button>
                        </div>

                        <!-- Result Card -->
                        <div class="flex flex-col items-center justify-center p-6 rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 text-center">
                            
                            <template v-if="calcResult">
                                <div class="bg-black text-white w-20 h-20 rounded-full flex items-center justify-center text-3xl font-bold font-display shadow-md mb-4 animate-scale-up">
                                    {{ calcResult }}
                                </div>
                                <h4 class="text-base font-bold text-black font-display mb-1.5">Kích cỡ đề xuất dành cho bạn</h4>
                                <p class="text-xs text-gray-500 max-w-xs leading-relaxed">
                                    {{ calcDetail }}
                                </p>
                                <div class="mt-4 inline-flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                                    <span class="material-symbols-outlined text-[13px]">check_circle</span>
                                    Độ tin cậy: cao
                                </div>
                            </template>

                            <template v-else>
                                <span class="material-symbols-outlined text-4xl text-gray-300 mb-3">psychology</span>
                                <h4 class="text-sm font-semibold text-gray-700 mb-1 font-display">Chưa có kết quả gợi ý</h4>
                                <p class="text-xs text-gray-400 max-w-[200px] leading-relaxed">
                                    Nhập chiều cao và cân nặng để hệ thống đề xuất size phù hợp nhất với form dáng của bạn.
                                </p>
                            </template>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </div>
</template>

<style scoped>
.animate-fade-in {
    animation: fadeIn 0.2s ease-out forwards;
}
.animate-scale-up {
    animation: scaleUp 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
}

@keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
}
@keyframes scaleUp {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
</style>
