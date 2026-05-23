<script setup lang="ts">
import { RouterView } from 'vue-router'
import HeaderLayout from './components/HeaderLayout.vue'
import FooterLayout from './components/FooterLayout.vue'
import ChatAIWidget from '@/pages/chat-ai/ChatAIWidget.vue'
import CustomerChatWidget from '@/pages/chat/CustomerChatWidget.vue'
</script>

<template>
    <div class="flex flex-col min-h-screen font-display text-fashion-black bg-background-light antialiased">
        <HeaderLayout />

        <main class="flex-grow">
            <RouterView />
        </main>

        <FooterLayout />

        <CustomerChatWidget />
        <ChatAIWidget />
    </div>
</template>
