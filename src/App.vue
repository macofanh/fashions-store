<script setup lang="ts">
import { RouterView } from 'vue-router'
import Notification from '@/components/Notification.vue'
import Popup from '@/components/Popup.vue'
</script>

<template>
    <RouterView />
    <Notification />
    <Popup />
</template>
