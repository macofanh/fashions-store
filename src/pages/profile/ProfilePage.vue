<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/useAuthStore'
import { profileHandler } from './profileHandler'
import { getTierByPoints } from './membershipService'

import ProfileBanner  from './components/ProfileBanner.vue'
import OrdersTab      from './components/OrdersTab.vue'
import AddressesTab   from './components/AddressesTab.vue'
import ProfileInfoTab from './components/ProfileInfoTab.vue'
import AddressModal   from './components/AddressModal.vue'
import MembershipCard from './components/MembershipCard.vue'
import OrderDetailDrawer from './components/OrderDetailDrawer.vue'

const authStore = useAuthStore()

const {
    activeTab, orders, addresses, isLoading,
    isOrderDetailLoading, isOrderDetailOpen,
    selectedOrder, orderQrSession, orderQrStatusMessage,
    isAddressModalOpen, modalMode, isSubmitting,
    isProfileSaving, isAvatarUploading,
    profileForm, avatarPreviewUrl,
    totalPoints, isMembershipLoading,
    provinces, districts, wards,
    selectedProvinceCode, selectedDistrictCode,
    addressForm,
    init,
    openOrderDetail, closeOrderDetail,
    openAddressModal, openEditModal,
    handleSaveProfile, handleAvatarChange,
    handleAddAddress, handleDeleteAddress, handleSetDefault,
    handleLogout,
    formatPrice, formatDate, getStatus,
} = profileHandler()

const currentTier = computed(() => getTierByPoints(totalPoints.value))

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
                :membership-label="currentTier.label"
                :membership-color="currentTier.color"
                :role="authStore.user?.role?.toLowerCase() || 'customer'"
                :avatar-url="authStore.user?.avatar_url || ''"
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
                    @open-detail="openOrderDetail"
                />

                <div v-if="activeTab === 'membership'">
                    <h2 class="text-[10px] uppercase tracking-[0.3em] font-bold text-fashion-black mb-6 border-b border-border-light pb-4 font-display">Hạng thành viên</h2>
                    <div class="max-w-2xl">
                        <MembershipCard :total-points="totalPoints" :is-loading="isMembershipLoading" />
                    </div>
                </div>

                <AddressesTab
                    v-if="activeTab === 'addresses'"
                    :addresses="addresses"
                    :is-loading="isLoading"
                    @open-modal="openAddressModal"
                    @open-edit="openEditModal"
                    @delete-address="handleDeleteAddress"
                    @set-default="handleSetDefault"
                />

                <ProfileInfoTab
                    v-if="activeTab === 'profile'"
                    :user="authStore.user"
                    :full-name="profileForm.full_name"
                    :phone="profileForm.phone"
                    :avatar-url="avatarPreviewUrl || authStore.user?.avatar_url || ''"
                    :is-profile-saving="isProfileSaving"
                    :is-avatar-uploading="isAvatarUploading"
                    @update:full-name="profileForm.full_name = $event"
                    @update:phone="profileForm.phone = $event"
                    @save-profile="handleSaveProfile"
                    @change-avatar="handleAvatarChange"
                />
            </section>
        </div>

        <!-- ── ADDRESS MODAL ──────────────────────────────────── -->
        <AddressModal
            v-if="isAddressModalOpen"
            :mode="modalMode"
            :form="addressForm"
            :provinces="provinces"
            :districts="districts"
            :wards="wards"
            :selected-province-code="selectedProvinceCode"
            :selected-district-code="selectedDistrictCode"
            :is-submitting="isSubmitting"
            @close="isAddressModalOpen = false"
            @submit="handleAddAddress"
            @update:selected-province-code="selectedProvinceCode = $event"
            @update:selected-district-code="selectedDistrictCode = $event"
        />

        <OrderDetailDrawer
            :is-open="isOrderDetailOpen"
            :is-loading="isOrderDetailLoading"
            :order="selectedOrder"
            :qr-session="orderQrSession"
            :qr-status-message="orderQrStatusMessage"
            :format-price="formatPrice"
            :format-date="formatDate"
            :get-status="getStatus"
            @close="closeOrderDetail"
        />
    </div>
</template>
