<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import axiosClient from '@/lib/axiosClient'
import { useAuthStore } from '@/stores/useAuthStore'

const authStore = useAuthStore()

// ── State ─────────────────────────────────────────────────────────
const users = ref<any[]>([])
const isLoading = ref(true)
const searchQuery = ref('')

// Drawer
const isDrawerOpen = ref(false)
const activeTab = ref<'info' | 'points'>('info')
const isSaving = ref(false)
const saveError = ref('')

// Form sửa user
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

// Form điều chỉnh điểm
const pointsForm = reactive({ points_delta: 0, reason: '' })
const isAdjustingPoints = ref(false)
const pointsError = ref('')
const pointsSuccess = ref('')

// ── Computed ──────────────────────────────────────────────────────
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

// ── Methods ───────────────────────────────────────────────────────
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
const roleBadgeClass: Record<string, string> = {
    admin:    'bg-zinc-900 text-white',
    staff:    'bg-blue-100 text-blue-700',
    customer: 'bg-zinc-100 text-zinc-600',
}

onMounted(fetchUsers)
</script>

<template>
    <div class="space-y-8">
        <!-- Header -->
        <header class="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
                <h1 class="text-3xl serif-text italic text-zinc-900">Quản lý Người dùng</h1>
                <p class="text-xs text-zinc-400 uppercase tracking-widest mt-2 font-bold">
                    Phân quyền và quản lý tài khoản thành viên
                </p>
            </div>
            <div class="relative w-full sm:w-72">
                <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 text-[18px] pointer-events-none">search</span>
                <input
                    v-model="searchQuery"
                    type="text"
                    placeholder="Tìm tên, email, SĐT..."
                    class="w-full pl-9 pr-4 py-2.5 border border-zinc-200 text-sm outline-none focus:border-zinc-900 transition-colors bg-zinc-50 focus:bg-white"
                />
            </div>
        </header>

        <!-- Table -->
        <div class="bg-white border border-zinc-100 shadow-sm overflow-hidden">
            <table class="w-full text-left border-collapse">
                <thead class="bg-zinc-50 border-b border-zinc-100">
                    <tr>
                        <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400">ID</th>
                        <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Người dùng</th>
                        <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hidden md:table-cell">Email</th>
                        <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400">Vai trò</th>
                        <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hidden lg:table-cell">Điểm</th>
                        <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hidden lg:table-cell">Trạng thái</th>
                        <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hidden xl:table-cell">Ngày tham gia</th>
                        <th class="px-6 py-4 text-[10px] uppercase tracking-widest font-bold text-zinc-400 text-right">Thao tác</th>
                    </tr>
                </thead>
                <tbody class="divide-y divide-zinc-50">
                    <tr v-if="isLoading">
                        <td colspan="8" class="px-6 py-20 text-center">
                            <div class="animate-spin h-6 w-6 border-2 border-zinc-900 border-t-transparent rounded-full mx-auto"></div>
                        </td>
                    </tr>
                    <tr v-else-if="filteredUsers.length === 0">
                        <td colspan="8" class="px-6 py-20 text-center text-zinc-400 text-xs uppercase tracking-widest">
                            {{ searchQuery ? 'Không tìm thấy người dùng nào.' : 'Chưa có người dùng nào.' }}
                        </td>
                    </tr>
                    <tr
                        v-for="u in filteredUsers"
                        :key="u.user_id"
                        class="hover:bg-zinc-50/50 transition-colors"
                        :class="{ 'opacity-50': !u.is_active }"
                    >
                        <td class="px-6 py-5 text-xs text-zinc-400">#{{ u.user_id }}</td>
                        <td class="px-6 py-5">
                            <p class="text-sm font-bold text-zinc-900">{{ u.full_name }}</p>
                            <p class="text-[10px] text-zinc-400 mt-0.5">{{ u.phone || '—' }}</p>
                        </td>
                        <td class="px-6 py-5 text-sm text-zinc-500 hidden md:table-cell">{{ u.email }}</td>
                        <td class="px-6 py-5">
                            <span :class="['text-[9px] font-bold px-2 py-1 tracking-widest uppercase', roleBadgeClass[u.role] || 'bg-zinc-100 text-zinc-600']">
                                {{ roleLabel[u.role] || u.role }}
                            </span>
                        </td>
                        <td class="px-6 py-5 text-xs font-medium text-zinc-700 hidden lg:table-cell">
                            {{ u.total_points.toLocaleString('vi-VN') }} đ
                        </td>
                        <td class="px-6 py-5 hidden lg:table-cell">
                            <span :class="['text-[9px] font-bold px-2 py-1 uppercase tracking-widest', u.is_active ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-500']">
                                {{ u.is_active ? 'Hoạt động' : 'Đã khóa' }}
                            </span>
                        </td>
                        <td class="px-6 py-5 text-xs text-zinc-400 hidden xl:table-cell">{{ formatDate(u.created_at) }}</td>
                        <td class="px-6 py-5 text-right">
                            <button
                                @click="openDrawer(u)"
                                class="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-widest font-bold text-zinc-900 hover:text-zinc-500 transition-colors px-3 py-1.5 border border-zinc-200 hover:border-zinc-400"
                            >
                                <span class="material-symbols-outlined text-[14px]">edit</span>
                                Sửa
                            </button>
                        </td>
                    </tr>
                </tbody>
            </table>
            <div v-if="!isLoading && users.length > 0" class="px-6 py-3 border-t border-zinc-50 text-[10px] text-zinc-400 uppercase tracking-widest">
                Hiển thị {{ filteredUsers.length }} / {{ users.length }} người dùng
            </div>
        </div>

        <!-- ── DRAWER ──────────────────────────────────────────────── -->
        <Teleport to="body">
            <Transition name="drawer">
                <div v-if="isDrawerOpen" class="fixed inset-0 z-50 flex justify-end">
                    <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="closeDrawer"></div>

                    <div class="relative w-full max-w-lg bg-white shadow-2xl flex flex-col h-full">
                        <!-- Header -->
                        <div class="px-8 py-6 border-b border-zinc-100 bg-zinc-50 flex items-center justify-between shrink-0">
                            <div>
                                <h2 class="text-lg serif-text italic text-zinc-900">Chỉnh sửa người dùng</h2>
                                <p class="text-[9px] uppercase tracking-widest text-zinc-400 mt-0.5">#{{ editForm.user_id }} · {{ editForm.email }}</p>
                            </div>
                            <button @click="closeDrawer" class="w-9 h-9 flex items-center justify-center hover:bg-zinc-200 rounded-full transition-colors">
                                <span class="material-symbols-outlined text-[20px]">close</span>
                            </button>
                        </div>

                        <!-- Tabs -->
                        <div class="flex border-b border-zinc-100 shrink-0">
                            <button
                                @click="activeTab = 'info'"
                                :class="['flex-1 py-3.5 text-[10px] uppercase tracking-widest font-bold transition-colors border-b-2', activeTab === 'info' ? 'text-zinc-900 border-zinc-900' : 'text-zinc-400 border-transparent hover:text-zinc-700']"
                            >Thông tin</button>
                            <button
                                @click="activeTab = 'points'"
                                :class="['flex-1 py-3.5 text-[10px] uppercase tracking-widest font-bold transition-colors border-b-2', activeTab === 'points' ? 'text-zinc-900 border-zinc-900' : 'text-zinc-400 border-transparent hover:text-zinc-700']"
                            >Điểm thưởng</button>
                        </div>

                        <!-- Body -->
                        <div class="flex-grow overflow-y-auto p-8">

                            <!-- TAB INFO -->
                            <div v-if="activeTab === 'info'" class="space-y-6">
                                <!-- Readonly meta -->
                                <div class="grid grid-cols-2 gap-4 p-4 bg-zinc-50 border border-zinc-100 text-xs">
                                    <div>
                                        <p class="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Loại tài khoản</p>
                                        <p class="font-bold text-zinc-700 uppercase">{{ editForm.account_type }}</p>
                                    </div>
                                    <div>
                                        <p class="text-[9px] uppercase tracking-widest text-zinc-400 mb-1">Ngày tham gia</p>
                                        <p class="font-bold text-zinc-700">{{ formatDate(editForm.created_at) }}</p>
                                    </div>
                                </div>

                                <!-- Họ tên -->
                                <div class="space-y-1.5">
                                    <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Họ và tên <span class="text-red-400">*</span></label>
                                    <input v-model="editForm.full_name" type="text" class="w-full border-b border-zinc-200 py-2.5 focus:border-zinc-900 outline-none text-sm transition-colors" placeholder="Nhập họ và tên..." />
                                </div>

                                <!-- SĐT -->
                                <div class="space-y-1.5">
                                    <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Số điện thoại</label>
                                    <input v-model="editForm.phone" type="tel" class="w-full border-b border-zinc-200 py-2.5 focus:border-zinc-900 outline-none text-sm transition-colors" placeholder="Nhập số điện thoại..." />
                                </div>

                                <!-- Vai trò -->
                                <div class="space-y-2">
                                    <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Vai trò</label>
                                    <div class="grid grid-cols-3 gap-2">
                                        <button
                                            v-for="r in ['customer', 'staff', 'admin']"
                                            :key="r"
                                            @click="editForm.role = r"
                                            :disabled="r === 'admin' && authStore.user?.role !== 'admin'"
                                            :class="['py-2.5 text-[10px] uppercase tracking-widest font-bold border transition-all disabled:opacity-30 disabled:cursor-not-allowed', editForm.role === r ? 'bg-zinc-900 text-white border-zinc-900' : 'border-zinc-200 text-zinc-500 hover:border-zinc-900 hover:text-zinc-900']"
                                        >{{ roleLabel[r] }}</button>
                                    </div>
                                    <p v-if="authStore.user?.role !== 'admin'" class="text-[9px] text-zinc-400 italic">* Chỉ Admin mới có thể cấp quyền Admin</p>
                                </div>

                                <!-- Trạng thái -->
                                <div class="space-y-1.5">
                                    <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Trạng thái tài khoản</label>
                                    <div
                                        @click="!isCurrentUser && (editForm.is_active = !editForm.is_active)"
                                        :class="['flex items-center justify-between p-4 border transition-all select-none', editForm.is_active ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50', isCurrentUser ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:opacity-80']"
                                    >
                                        <div class="flex items-center gap-3">
                                            <span :class="['material-symbols-outlined text-[20px]', editForm.is_active ? 'text-green-600' : 'text-red-500']">
                                                {{ editForm.is_active ? 'check_circle' : 'block' }}
                                            </span>
                                            <div>
                                                <p :class="['text-xs font-bold uppercase tracking-widest', editForm.is_active ? 'text-green-700' : 'text-red-600']">
                                                    {{ editForm.is_active ? 'Đang hoạt động' : 'Đã bị khóa' }}
                                                </p>
                                                <p class="text-[9px] text-zinc-400 mt-0.5">
                                                    {{ isCurrentUser ? 'Không thể khóa tài khoản của chính mình' : 'Click để ' + (editForm.is_active ? 'khóa' : 'mở khóa') }}
                                                </p>
                                            </div>
                                        </div>
                                        <div :class="['w-10 h-5 rounded-full transition-colors relative shrink-0', editForm.is_active ? 'bg-green-500' : 'bg-zinc-300']">
                                            <div :class="['absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform', editForm.is_active ? 'translate-x-5' : 'translate-x-0.5']"></div>
                                        </div>
                                    </div>
                                </div>

                                <div v-if="saveError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 text-xs">
                                    <span class="material-symbols-outlined text-[16px]">error</span>
                                    {{ saveError }}
                                </div>
                            </div>

                            <!-- TAB POINTS -->
                            <div v-if="activeTab === 'points'" class="space-y-6">
                                <div class="p-6 bg-zinc-900 text-white text-center">
                                    <p class="text-[9px] uppercase tracking-[0.3em] text-zinc-400 mb-2">Điểm thưởng hiện tại</p>
                                    <p class="text-4xl font-black">{{ editForm.total_points.toLocaleString('vi-VN') }}</p>
                                    <p class="text-[10px] text-zinc-500 mt-1 uppercase tracking-widest">điểm</p>
                                </div>

                                <div class="space-y-4">
                                    <div class="space-y-1.5">
                                        <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">
                                            Số điểm điều chỉnh
                                            <span class="text-zinc-300 normal-case tracking-normal ml-1">(dương = cộng, âm = trừ)</span>
                                        </label>
                                        <div class="flex gap-2">
                                            <button
                                                @click="pointsForm.points_delta = -Math.abs(Number(pointsForm.points_delta))"
                                                :class="['px-3 py-2.5 border text-[10px] font-bold transition-colors', Number(pointsForm.points_delta) < 0 ? 'bg-red-500 text-white border-red-500' : 'border-zinc-200 text-zinc-500 hover:border-red-400 hover:text-red-500']"
                                            ><span class="material-symbols-outlined text-[16px]">remove</span></button>
                                            <input
                                                v-model.number="pointsForm.points_delta"
                                                type="number"
                                                class="flex-grow border-b border-zinc-200 py-2.5 px-2 focus:border-zinc-900 outline-none text-sm text-center font-bold transition-colors"
                                                placeholder="0"
                                            />
                                            <button
                                                @click="pointsForm.points_delta = Math.abs(Number(pointsForm.points_delta))"
                                                :class="['px-3 py-2.5 border text-[10px] font-bold transition-colors', Number(pointsForm.points_delta) > 0 ? 'bg-green-500 text-white border-green-500' : 'border-zinc-200 text-zinc-500 hover:border-green-400 hover:text-green-500']"
                                            ><span class="material-symbols-outlined text-[16px]">add</span></button>
                                        </div>
                                        <p v-if="pointsForm.points_delta !== 0" :class="['text-[10px] font-bold', Number(pointsForm.points_delta) > 0 ? 'text-green-600' : 'text-red-500']">
                                            Sau điều chỉnh: {{ (editForm.total_points + Number(pointsForm.points_delta)).toLocaleString('vi-VN') }} điểm
                                        </p>
                                    </div>

                                    <div class="space-y-1.5">
                                        <label class="text-[9px] uppercase tracking-widest font-bold text-zinc-400">Lý do <span class="text-red-400">*</span></label>
                                        <input v-model="pointsForm.reason" type="text" class="w-full border-b border-zinc-200 py-2.5 focus:border-zinc-900 outline-none text-sm transition-colors" placeholder="VD: Bù điểm do lỗi hệ thống..." />
                                    </div>

                                    <div v-if="pointsError" class="flex items-center gap-2 p-3 bg-red-50 border border-red-200 text-red-600 text-xs">
                                        <span class="material-symbols-outlined text-[16px]">error</span>{{ pointsError }}
                                    </div>
                                    <div v-if="pointsSuccess" class="flex items-center gap-2 p-3 bg-green-50 border border-green-200 text-green-700 text-xs">
                                        <span class="material-symbols-outlined text-[16px]">check_circle</span>{{ pointsSuccess }}
                                    </div>

                                    <button
                                        @click="handleAdjustPoints"
                                        :disabled="isAdjustingPoints || !pointsForm.points_delta || !pointsForm.reason.trim()"
                                        class="w-full bg-zinc-900 text-white py-3.5 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        <span v-if="isAdjustingPoints" class="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                                        {{ isAdjustingPoints ? 'Đang xử lý...' : 'Xác nhận điều chỉnh' }}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <!-- Footer (chỉ tab info) -->
                        <div v-if="activeTab === 'info'" class="px-8 py-5 border-t border-zinc-100 bg-zinc-50 flex justify-end gap-3 shrink-0">
                            <button @click="closeDrawer" class="px-6 py-2.5 text-[10px] uppercase tracking-widest font-bold text-zinc-400 hover:text-zinc-900 transition-colors">Hủy</button>
                            <button
                                @click="handleSave"
                                :disabled="isSaving || !editForm.full_name.trim()"
                                class="bg-zinc-900 text-white px-8 py-2.5 text-[10px] uppercase tracking-widest font-bold hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <span v-if="isSaving" class="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
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
.serif-text { font-family: 'Playfair Display', serif; }

.drawer-enter-active, .drawer-leave-active { transition: opacity 0.3s ease; }
.drawer-enter-active .relative, .drawer-leave-active .relative { transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1); }
.drawer-enter-from { opacity: 0; }
.drawer-leave-to   { opacity: 0; }
.drawer-enter-from .relative { transform: translateX(100%); }
.drawer-leave-to   .relative { transform: translateX(100%); }
</style>
