<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()

const users = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

const isDrawerOpen = ref(false)
const activeTab = ref<'info' | 'points'>('info')
const isSaving = ref(false)
const saveError = ref('')

const editForm = reactive({
    user_id: 0,
    full_name: '',
    phone: '',
    email: '',
    role: '',
    is_active: true,
    total_points: 0,
    created_at: '',
    account_type: '',
})

const pointsForm = reactive({ points_delta: 0, reason: '' })
const isAdjustingPoints = ref(false)
const pointsError = ref('')
const pointsSuccess = ref('')

const filteredUsers = computed(() => {
    const q = searchQuery.value.toLowerCase().trim()
    if (!q) return users.value
    return users.value.filter(u =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.phone?.includes(q)
    )
})

const isCurrentUser = computed(() => editForm.user_id === authStore.user?.user_id)

const fetchUsers = async () => {
    isLoading.value = true
    try {
        const res = await axiosClient.get('/api/v1/users')
        users.value = res.data
    } catch (e) {
        console.error('Lỗi lấy danh sách người dùng:', e)
    } finally {
        isLoading.value = false
    }
}

const openDrawer = (user: any) => {
    Object.assign(editForm, {
        user_id:      user.user_id,
        full_name:    user.full_name,
        phone:        user.phone || '',
        email:        user.email,
        role:         user.role,
        is_active:    user.is_active,
        total_points: user.total_points,
        created_at:   user.created_at,
        account_type: user.account_type,
    })
    pointsForm.points_delta = 0
    pointsForm.reason = ''
    pointsError.value = ''
    pointsSuccess.value = ''
    saveError.value = ''
    activeTab.value = 'info'
    isDrawerOpen.value = true
}

const closeDrawer = () => { isDrawerOpen.value = false }

const handleSave = async () => {
    isSaving.value = true
    saveError.value = ''
    try {
        const res = await axiosClient.put(`/api/v1/users/${editForm.user_id}`, {
            full_name: editForm.full_name,
            phone:     editForm.phone || null,
            role:      editForm.role,
            is_active: editForm.is_active,
        })
        const idx = users.value.findIndex(u => u.user_id === editForm.user_id)
        if (idx !== -1) users.value[idx] = { ...users.value[idx], ...res.data }
        closeDrawer()
    } catch (e: any) {
        saveError.value = e.response?.data?.detail || 'Có lỗi xảy ra khi lưu.'
    } finally {
        isSaving.value = false
    }
}

const handleAdjustPoints = async () => {
    if (!pointsForm.points_delta || !pointsForm.reason.trim()) {
        pointsError.value = 'Vui lòng nhập số điểm và lý do.'
        return
    }
    isAdjustingPoints.value = true
    pointsError.value = ''
    pointsSuccess.value = ''
    try {
        await axiosClient.post(`/api/v1/users/${editForm.user_id}/reward-adjust`, {
            points_delta: Number(pointsForm.points_delta),
            reason: pointsForm.reason.trim(),
        })
        editForm.total_points += Number(pointsForm.points_delta)
        const idx = users.value.findIndex(u => u.user_id === editForm.user_id)
        if (idx !== -1) users.value[idx].total_points = editForm.total_points
        pointsSuccess.value = `Đã ${Number(pointsForm.points_delta) > 0 ? 'cộng' : 'trừ'} ${Math.abs(Number(pointsForm.points_delta))} điểm thành công.`
        pointsForm.points_delta = 0
        pointsForm.reason = ''
    } catch (e: any) {
        pointsError.value = e.response?.data?.detail || 'Có lỗi xảy ra.'
    } finally {
        isAdjustingPoints.value = false
    }
}

const formatDate = (dateStr: string) => {
    if (!dateStr) return 'N/A'
    return new Date(dateStr).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
}

const roleLabel: Record<string, string> = { admin: 'Admin', staff: 'Staff', customer: 'Khách hàng' }

onMounted(fetchUsers)
</script>

<template>
    <div class="space-y-6">
        <!-- Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
                <h1 class="text-2xl font-bold text-slate-900">Quản lý Người dùng</h1>
                <p class="text-sm text-slate-500 mt-1">
                    {{ isLoading ? 'Đang tải...' : `${filteredUsers.length} / ${users.length} tài khoản` }}
                </p>
            </div>
            <div class="relative w-full sm:w-80">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[20px] pointer-events-none">search</span>
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Tìm tên, email, số điện thoại..."
                    class="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all bg-white"
                />
            </div>
        </div>

        <!-- Loading -->
        <div v-if="isLoading" class="flex justify-center py-20">
            <div class="animate-spin h-8 w-8 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
        </div>

        <!-- Empty -->
        <div v-else-if="filteredUsers.length === 0" class="text-center py-20 bg-white rounded-2xl border border-slate-100">
            <span class="material-symbols-outlined text-5xl text-slate-200 block mb-3">person_search</span>
            <p class="text-slate-400 text-sm">{{ searchQuery ? 'Không tìm thấy người dùng nào.' : 'Chưa có người dùng nào.' }}</p>
        </div>

        <!-- User Table -->
        <div v-else class="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-slate-50 border-b border-slate-100">
                    <tr>
                        <th class="px-5 py-3.5 text-xs font-semibold text-slate-400">Người dùng</th>
                        <th class="px-5 py-3.5 text-xs font-semibold text-slate-400 hidden md:table-cell">Email</th>
                        <th class="px-5 py-3.5 text-xs font-semibold text-slate-400">Vai trò</th>
                        <th class="px-5 py-3.5 text-xs font-semibold text-slate-400 hidden lg:table-cell">Điểm</th>
                        <th class="px-5 py-3.5 text-xs font-semibold text-slate-400 hidden lg:table-cell">Trạng thái</th>
                        <th class="px-5 py-3.5 text-xs font-semibold text-slate-400 hidden xl:table-cell">Ngày tham gia</th>
                        <th class="px-5 py-3.5 text-xs font-semibold text-slate-400 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-slate-50">
                    <tr
                        v-for="u in filteredUsers"
                        :key="u.user_id"
                        :class="['hover:bg-slate-50/60 transition-colors group', !u.is_active ? 'opacity-60' : '']"
                    >
                        <!-- Avatar + tên -->
                        <td class="px-5 py-4">
                            <div class="flex items-center gap-3">
                                <div :class="['w-9 h-9 rounded-full flex items-center justify-center text-white font-bold text-sm shrink-0', u.role === 'admin' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : u.role === 'staff' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-gray-400 to-gray-500']">
                                    {{ u.full_name?.charAt(0)?.toUpperCase() || '?' }}
                                </div>
                                <div>
                                    <p class="text-sm font-semibold text-slate-900">{{ u.full_name }}</p>
                                    <p class="text-xs text-slate-400">{{ u.phone || '—' }}</p>
                                </div>
                            </div>
                        </td>
                        <!-- Email -->
                        <td class="px-5 py-4 text-sm text-slate-500 hidden md:table-cell">{{ u.email }}</td>
                        <!-- Role -->
                        <td class="px-5 py-4">
                            <span :class="['text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wide', u.role === 'admin' ? 'bg-violet-100 text-violet-700' : u.role === 'staff' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500']">
                                {{ roleLabel[u.role] || u.role }}
                            </span>
                        </td>
                        <!-- Điểm -->
                        <td class="px-5 py-4 hidden lg:table-cell">
                            <div class="flex items-center gap-1">
                                <span class="material-symbols-outlined text-[14px] text-amber-400">star</span>
                                <span class="text-sm font-medium text-slate-700">{{ u.total_points.toLocaleString('vi-VN') }}</span>
                            </div>
                        </td>
                        <!-- Trạng thái -->
                        <td class="px-5 py-4 hidden lg:table-cell">
                            <span :class="['inline-flex items-center gap-1 text-[10px] font-semibold px-2.5 py-1 rounded-full', u.is_active ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500']">
                                <span :class="['w-1.5 h-1.5 rounded-full', u.is_active ? 'bg-emerald-500' : 'bg-red-400']"></span>
                                {{ u.is_active ? 'Hoạt động' : 'Đã khóa' }}
                            </span>
                        </td>
                        <!-- Ngày tham gia -->
                        <td class="px-5 py-4 text-xs text-slate-400 hidden xl:table-cell">{{ formatDate(u.created_at) }}</td>
                        <!-- Action -->
                        <td class="px-5 py-4 text-right">
                            <button
                                @click="openDrawer(u)"
                                class="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-50"
                            >
                                <span class="material-symbols-outlined text-[15px]">edit</span>
                                Sửa
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <!-- Footer -->
            <div class="px-5 py-3 border-t border-slate-50 text-xs text-slate-400">
                Hiển thị {{ filteredUsers.length }} / {{ users.length }} người dùng
            </div>
        </div>

        <!-- DRAWER -->
        <Teleport to="body">
            <Transition name="drawer">
                <div v-if="isDrawerOpen" class="fixed inset-0 z-[200] flex justify-end">
                    <div class="absolute inset-0 bg-black/40 backdrop-blur-sm" @click="closeDrawer"></div>

                    <div class="relative w-full max-w-md bg-white shadow-2xl flex flex-col h-full rounded-l-2xl overflow-hidden">
                        <!-- Header -->
                        <div class="px-6 py-5 border-b border-slate-100 flex items-center gap-4 shrink-0">
                            <div :class="['w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shrink-0', editForm.role === 'admin' ? 'bg-gradient-to-br from-violet-500 to-purple-600' : editForm.role === 'staff' ? 'bg-gradient-to-br from-blue-400 to-indigo-500' : 'bg-gradient-to-br from-gray-400 to-gray-500']">
                                {{ editForm.full_name?.charAt(0)?.toUpperCase() || '?' }}
                            </div>
                            <div class="flex-grow min-w-0">
                                <h2 class="font-bold text-slate-900 truncate">{{ editForm.full_name }}</h2>
                                <p class="text-xs text-slate-400 truncate">{{ editForm.email }}</p>
                            </div>
                            <button @click="closeDrawer" class="w-8 h-8 flex items-center justify-center hover:bg-slate-100 rounded-full transition-colors shrink-0">
                                <span class="material-symbols-outlined text-[20px] text-slate-500">close</span>
                            </button>
                        </div>

                        <!-- Tabs -->
                        <div class="flex px-6 pt-4 gap-1 shrink-0">
                            <button
                                @click="activeTab = 'info'"
                                :class="['flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all', activeTab === 'info' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50']"
                            >Thông tin</button>
                            <button
                                @click="activeTab = 'points'"
                                :class="['flex-1 py-2.5 text-xs font-semibold rounded-lg transition-all', activeTab === 'points' ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500 hover:bg-slate-50']"
                            >Điểm thưởng</button>
                        </div>

                        <!-- Body -->
                        <div class="flex-grow overflow-y-auto p-6 space-y-5">

                            <!-- TAB INFO -->
                            <template v-if="activeTab === 'info'">
                                <div class="grid grid-cols-2 gap-3">
                                    <div class="bg-slate-50 rounded-xl p-3">
                                        <p class="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Loại tài khoản</p>
                                        <p class="text-sm font-semibold text-slate-700 capitalize">{{ editForm.account_type }}</p>
                                    </div>
                                    <div class="bg-slate-50 rounded-xl p-3">
                                        <p class="text-[10px] uppercase tracking-wider text-slate-400 mb-1">Ngày tham gia</p>
                                        <p class="text-sm font-semibold text-slate-700">{{ formatDate(editForm.created_at) }}</p>
                                    </div>
                                </div>

                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Họ và tên <span class="text-red-400">*</span></label>
                                    <input v-model="editForm.full_name" type="text"
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="Nhập họ và tên..." />
                                </div>

                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-1.5">Số điện thoại</label>
                                    <input v-model="editForm.phone" type="tel"
                                        class="w-full border border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                        placeholder="Nhập số điện thoại..." />
                                </div>

                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-2">Vai trò</label>
                                    <div class="grid grid-cols-3 gap-2">
                                        <button
                                            v-for="r in ['customer', 'staff', 'admin']"
                                            :key="r"
                                            @click="editForm.role = r"
                                            :disabled="r === 'admin' && authStore.user?.role !== 'admin'"
                                            :class="['py-2.5 text-xs font-semibold rounded-xl border-2 transition-all disabled:opacity-30 disabled:cursor-not-allowed', editForm.role === r ? (r === 'admin' ? 'bg-violet-600 text-white border-violet-600' : r === 'staff' ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-slate-700 text-white border-slate-700') : 'border-slate-200 text-slate-500 hover:border-slate-400']"
                                        >{{ roleLabel[r] }}</button>
                                    </div>
                                    <p v-if="authStore.user?.role !== 'admin'" class="text-[10px] text-slate-400 mt-1.5 italic">* Chỉ Admin mới có thể cấp quyền Admin</p>
                                </div>

                                <div>
                                    <label class="text-xs font-semibold text-slate-500 block mb-2">Trạng thái tài khoản</label>
                                    <button
                                        @click="!isCurrentUser && (editForm.is_active = !editForm.is_active)"
                                        :disabled="isCurrentUser"
                                        :class="['w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all', editForm.is_active ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50', isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-90']"
                                    >
                                        <div class="flex items-center gap-3">
                                            <div :class="['w-9 h-9 rounded-full flex items-center justify-center', editForm.is_active ? 'bg-emerald-100' : 'bg-red-100']">
                                                <span :class="['material-symbols-outlined text-[20px]', editForm.is_active ? 'text-emerald-600' : 'text-red-500']">
                                                    {{ editForm.is_active ? 'check_circle' : 'block' }}
                                                </span>
                                            </div>
                                            <div class="text-left">
                                                <p :class="['text-sm font-semibold', editForm.is_active ? 'text-emerald-700' : 'text-red-600']">
                                                    {{ editForm.is_active ? 'Đang hoạt động' : 'Đã bị khóa' }}
                                                </p>
                                                <p class="text-[10px] text-slate-400">
                                                    {{ isCurrentUser ? 'Không thể khóa tài khoản của chính mình' : 'Nhấn để ' + (editForm.is_active ? 'khóa' : 'mở khóa') }}
                                                </p>
                                            </div>
                                        </div>
                                        <div :class="['w-11 h-6 rounded-full transition-colors relative shrink-0', editForm.is_active ? 'bg-emerald-500' : 'bg-slate-300']">
                                            <div :class="['absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform', editForm.is_active ? 'translate-x-5' : 'translate-x-0.5']"></div>
                                        </div>
                                    </button>
                                </div>

                                <div v-if="saveError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                                    <span class="material-symbols-outlined text-[16px]">error</span>
                                    {{ saveError }}
                                </div>
                            </template>

                            <!-- TAB POINTS -->
                            <template v-if="activeTab === 'points'">
                                <div class="bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl p-6 text-white text-center">
                                    <span class="material-symbols-outlined text-3xl mb-2 block" style="font-variation-settings:'FILL' 1">stars</span>
                                    <p class="text-4xl font-black">{{ editForm.total_points.toLocaleString('vi-VN') }}</p>
                                    <p class="text-sm text-amber-100 mt-1">điểm thưởng</p>
                                </div>

                                <div class="space-y-4">
                                    <div>
                                        <label class="text-xs font-semibold text-slate-500 block mb-1.5">
                                            Số điểm điều chỉnh
                                            <span class="text-slate-400 font-normal ml-1">(+ cộng / - trừ)</span>
                                        </label>
                                        <div class="flex gap-2">
                                            <button
                                                @click="pointsForm.points_delta = -Math.abs(Number(pointsForm.points_delta))"
                                                :class="['px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors', Number(pointsForm.points_delta) < 0 ? 'bg-red-500 text-white border-red-500' : 'border-slate-200 text-slate-500 hover:border-red-300 hover:text-red-500']"
                                            ><span class="material-symbols-outlined text-[18px]">remove</span></button>
                                            <input
                                                v-model.number="pointsForm.points_delta"
                                                type="number"
                                                class="flex-grow border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm text-center font-bold outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                                placeholder="0"
                                            />
                                            <button
                                                @click="pointsForm.points_delta = Math.abs(Number(pointsForm.points_delta))"
                                                :class="['px-3 py-2.5 rounded-xl border-2 text-sm font-bold transition-colors', Number(pointsForm.points_delta) > 0 ? 'bg-emerald-500 text-white border-emerald-500' : 'border-slate-200 text-slate-500 hover:border-emerald-300 hover:text-emerald-500']"
                                            ><span class="material-symbols-outlined text-[18px]">add</span></button>
                                        </div>
                                        <p v-if="pointsForm.points_delta !== 0" :class="['text-xs font-semibold mt-1.5', Number(pointsForm.points_delta) > 0 ? 'text-emerald-600' : 'text-red-500']">
                                            Sau điều chỉnh: {{ (editForm.total_points + Number(pointsForm.points_delta)).toLocaleString('vi-VN') }} điểm
                                        </p>
                                    </div>

                                    <div>
                                        <label class="text-xs font-semibold text-slate-500 block mb-1.5">Lý do <span class="text-red-400">*</span></label>
                                        <input v-model="pointsForm.reason" type="text"
                                            class="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                                            placeholder="VD: Bù điểm do lỗi hệ thống..." />
                                    </div>

                                    <div v-if="pointsError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-xs">
                                        <span class="material-symbols-outlined text-[16px]">error</span>{{ pointsError }}
                                    </div>
                                    <div v-if="pointsSuccess" class="flex items-center gap-2 p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs">
                                        <span class="material-symbols-outlined text-[16px]">check_circle</span>{{ pointsSuccess }}
                                    </div>

                                    <button
                                        @click="handleAdjustPoints"
                                        :disabled="isAdjustingPoints || !pointsForm.points_delta || !pointsForm.reason.trim()"
                                        class="w-full bg-indigo-600 text-white py-3 text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span v-if="isAdjustingPoints" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                        {{ isAdjustingPoints ? 'Đang xử lý...' : 'Xác nhận điều chỉnh' }}
                                    </button>
                                </div>
                            </template>
                        </div>

                        <!-- Footer -->
                        <div v-if="activeTab === 'info'" class="px-6 py-4 border-t border-slate-100 flex gap-3 shrink-0">
                            <button @click="closeDrawer" class="flex-1 py-2.5 text-sm font-semibold text-slate-500 hover:text-slate-700 border border-slate-200 rounded-xl transition-colors">Hủy</button>
                            <button
                                @click="handleSave"
                                :disabled="isSaving || !editForm.full_name.trim()"
                                class="flex-1 bg-indigo-600 text-white py-2.5 text-sm font-semibold rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                <span v-if="isSaving" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                {{ isSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                            </button>
                        </div>
                    </div>
                </div>
            </Transition>
        </Teleport>
    </div>
</template>

<style scoped>
.drawer-enter-active, .drawer-leave-active { transition: opacity 0.25s ease; }
.drawer-enter-active .relative, .drawer-leave-active .relative { transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from { opacity: 0; }
.drawer-leave-to   { opacity: 0; }
.drawer-enter-from .relative { transform: translateX(100%); }
.drawer-leave-to   .relative { transform: translateX(100%); }
</style>
