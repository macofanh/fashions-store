<script setup lang="ts">
import { ref } from 'vue'
import { getImageUrl } from '@/lib/urlHelper'

defineProps<{
    user: {
        full_name?: string
        email?: string
        role?: string
        avatar_url?: string | null
    } | null
    fullName: string
    phone: string
    avatarUrl: string
    isProfileSaving: boolean
    isAvatarUploading: boolean
}>()

const emit = defineEmits<{
    'update:fullName': [value: string]
    'update:phone': [value: string]
    'save-profile': []
    'change-avatar': [file: File]
}>()

const avatarInput = ref<HTMLInputElement | null>(null)

const handleAvatarClick = () => {
    avatarInput.value?.click()
}

const handleAvatarChange = (event: Event) => {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (!file) return

    emit('change-avatar', file)
    target.value = ''
}
</script>

<template>
    <div>
        <div class="mb-8">
            <h2 class="text-2xl md:text-3xl font-serif italic text-fashion-black mb-2">Thông tin cá nhân</h2>
            <p class="text-text-muted text-sm font-display">Quản lý thông tin tài khoản của bạn.</p>
        </div>

        <div class="bg-white border border-border-light rounded-xl p-8 max-w-2xl shadow-sm space-y-8">
            <div class="flex flex-col sm:flex-row gap-6 sm:items-center">
                <div class="relative shrink-0">
                    <input ref="avatarInput" type="file" class="hidden" accept="image/*" @change="handleAvatarChange" />
                    <button
                        type="button"
                        @click="handleAvatarClick"
                        class="relative w-24 h-24 rounded-full overflow-hidden border-2 border-border-light bg-fashion-gray flex items-center justify-center hover:ring-4 hover:ring-primary/10 transition-all"
                    >
                        <img
                            v-if="avatarUrl"
                            :src="getImageUrl(avatarUrl)"
                            :alt="user?.full_name || 'Avatar'"
                            class="w-full h-full object-cover"
                        />
                        <span v-else class="material-symbols-outlined text-text-muted text-4xl" style="font-variation-settings:'FILL' 1">person</span>

                        <span class="absolute inset-x-0 bottom-0 bg-black/55 text-white text-[10px] font-semibold py-1">{{ isAvatarUploading ? 'Đang tải...' : 'Đổi ảnh' }}</span>
                    </button>
                </div>

                <div class="min-w-0">
                    <h3 class="text-xl font-bold text-fashion-black font-display">{{ user?.full_name || '—' }}</h3>
                    <p class="text-sm text-text-muted font-display">{{ user?.email || '—' }}</p>
                </div>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div class="md:col-span-2 space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-muted font-display">Họ và tên</label>
                    <input
                        :value="fullName"
                        @input="emit('update:fullName', ($event.target as HTMLInputElement).value)"
                        type="text"
                        class="w-full rounded-xl border border-border-light px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        placeholder="Nhập họ và tên"
                    />
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-muted font-display">Số điện thoại</label>
                    <input
                        :value="phone"
                        @input="emit('update:phone', ($event.target as HTMLInputElement).value)"
                        type="tel"
                        class="w-full rounded-xl border border-border-light px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                        placeholder="Nhập số điện thoại"
                    />
                </div>

                <div class="space-y-2">
                    <label class="text-xs font-semibold uppercase tracking-wider text-text-muted font-display">Email</label>
                    <div class="w-full rounded-xl border border-border-light px-4 py-3 text-sm bg-fashion-gray/40 text-fashion-black">
                        {{ user?.email || '—' }}
                    </div>
                </div>
            </div>

            <div class="flex justify-end">
                <button
                    type="button"
                    @click="emit('save-profile')"
                    :disabled="isProfileSaving"
                    class="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:opacity-60"
                >
                    <span v-if="isProfileSaving" class="animate-spin h-4 w-4 rounded-full border-2 border-white border-t-transparent"></span>
                    {{ isProfileSaving ? 'Đang lưu...' : 'Lưu thay đổi' }}
                </button>
            </div>
        </div>
    </div>
</template>
