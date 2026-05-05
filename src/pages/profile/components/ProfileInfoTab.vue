<script setup lang="ts">
defineProps<{
    user: {
        full_name?: string
        email?: string
        role?: string
    } | null
}>()
</script>

<template>
    <div>
        <div class="mb-8">
            <h2 class="text-2xl md:text-3xl font-serif italic text-fashion-black mb-2">Thông tin cá nhân</h2>
            <p class="text-text-muted text-sm font-display">Quản lý thông tin tài khoản của bạn.</p>
        </div>

        <div class="bg-white border border-border-light rounded-xl p-8 max-w-lg shadow-sm">
            <div class="space-y-6">
                <div v-for="field in [
                    { label: 'Họ và tên',  value: user?.full_name,              icon: 'person'    },
                    { label: 'Email',       value: user?.email,                  icon: 'mail'      },
                    { label: 'Vai trò',     value: user?.role?.toLowerCase(),    icon: 'badge'     },
                ]" :key="field.label" class="flex items-center gap-4 py-4 border-b border-border-light last:border-0">
                    <div class="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center shrink-0">
                        <span class="material-symbols-outlined text-primary text-[18px]">{{ field.icon }}</span>
                    </div>
                    <div>
                        <p class="text-[10px] uppercase tracking-widest font-bold text-text-muted mb-0.5 font-display">{{ field.label }}</p>
                        <p class="text-sm font-medium text-fashion-black capitalize font-display">{{ field.value || '—' }}</p>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>
