<script setup lang="ts">
import { onMounted } from 'vue'
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

        <!-- Address Modal -->
        <AddressModal
            v-if="isAddressModalOpen"
            :form="addressForm"
            :provinces="provinces"
            :districts="districts"
            :wards="wards"
            :selected-province-code="selectedProvinceCode"
            :selected-district-code="selectedDistrictCode"
            @close="isAddressModalOpen = false"
            @submit="handleAddAddress"
            @update:selected-province-code="selectedProvinceCode = $event"
            @update:selected-district-code="selectedDistrictCode = $event"
        />
    </div>
</template>
