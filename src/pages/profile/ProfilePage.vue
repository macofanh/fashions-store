<script setup lang="ts">
<<<<<<< HEAD
import { onMounted } from 'vue'
=======
import { ref, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { orderService } from '@/pages/cart/orderService'
import { addressService, type Address } from '@/pages/profile/addressService'
import GoongAddressInput from '@/components/GoongAddressInput.vue'
>>>>>>> feature/auth
import { useAuthStore } from '@/stores/useAuthStore'
import { profileHandler } from './profileHandler'

import ProfileBanner  from './components/ProfileBanner.vue'
import OrdersTab      from './components/OrdersTab.vue'
import AddressesTab   from './components/AddressesTab.vue'
import ProfileInfoTab from './components/ProfileInfoTab.vue'
import AddressModal   from './components/AddressModal.vue'

const authStore = useAuthStore()

const {
    activeTab, orders, addresses, isLoading,
    isAddressModalOpen,
    provinces, districts, wards,
    selectedProvinceCode, selectedDistrictCode,
    addressForm,
    init, openAddressModal, handleAddAddress, handleLogout,
    formatPrice, formatDate, getStatus,
} = profileHandler()

onMounted(init)
</script>

<template>
    <div class="bg-background-light min-h-screen pb-24">
        <div class="max-w-[1400px] mx-auto px-6 md:px-12 py-10 flex flex-col md:flex-row gap-8">

            <!-- Sidebar bên trái -->
            <ProfileBanner
                :user-name="authStore.userName"
                :email="authStore.user?.email || ''"
                :order-count="orders.length"
                :address-count="addresses.length"
                :role="authStore.user?.role?.toLowerCase() || 'customer'"
                :active-tab="activeTab"
                @update:active-tab="activeTab = $event"
                @logout="handleLogout"
            />

            <!-- Content bên phải -->
            <section class="flex-1 min-w-0">
                <OrdersTab
                    v-if="activeTab === 'orders'"
                    :orders="orders"
                    :is-loading="isLoading"
                    :format-price="formatPrice"
                    :format-date="formatDate"
                    :get-status="getStatus"
                />

                <AddressesTab
                    v-if="activeTab === 'addresses'"
                    :addresses="addresses"
                    :is-loading="isLoading"
                    @open-modal="openAddressModal"
                />

                <ProfileInfoTab
                    v-if="activeTab === 'profile'"
                    :user="authStore.user"
                />
            </section>
        </div>

        <!-- ── ADDRESS MODAL ──────────────────────────────────── -->
        <div v-if="isAddressModalOpen" class="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-fashion-black/60 backdrop-blur-sm">
            <div class="bg-white w-full max-w-xl shadow-2xl p-10 space-y-8">
                <header class="flex justify-between items-center">
                    <h2 class="text-2xl font-serif italic text-fashion-black">Thêm địa chỉ mới</h2>
                    <button @click="isAddressModalOpen = false" class="material-symbols-outlined text-text-muted hover:text-fashion-black">close</button>
                </header>

                <form @submit.prevent="handleAddAddress" class="space-y-6">
                    <div class="grid grid-cols-2 gap-4">
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Tên người nhận</label>
                            <input v-model="addressForm.recipient_name" required type="text" class="input-underline" />
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Số điện thoại</label>
                            <input v-model="addressForm.phone" required type="tel" class="input-underline" />
                        </div>
                    </div>

                    <div class="space-y-4">
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Tỉnh / Thành phố</label>
                            <select v-model="selectedProvinceCode" required class="input-underline bg-transparent">
                                <option value="" disabled>Chọn Tỉnh / Thành phố</option>
                                <option v-for="p in provinces" :key="p.code" :value="p.code">{{ p.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Quận / Huyện</label>
                            <select v-model="selectedDistrictCode" :disabled="selectedProvinceCode === ''" required class="input-underline bg-transparent disabled:opacity-30">
                                <option value="" disabled>Chọn Quận / Huyện</option>
                                <option v-for="d in districts" :key="d.code" :value="d.code">{{ d.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <label class="text-[9px] uppercase font-bold text-text-muted">Phường / Xã</label>
                            <select v-model="addressForm.ward" :disabled="selectedDistrictCode === ''" required class="input-underline bg-transparent disabled:opacity-30">
                                <option value="" disabled>Chọn Phường / Xã</option>
                                <option v-for="w in wards" :key="w.code" :value="w.name">{{ w.name }}</option>
                            </select>
                        </div>
                        <div class="space-y-1">
                            <GoongAddressInput v-model="addressForm.street_address" />
                        </div>
                    </div>

                    <button type="submit" class="btn-dark w-full py-4">Lưu địa chỉ</button>
                </form>
            </div>
        </div>
    </div>
</template>
