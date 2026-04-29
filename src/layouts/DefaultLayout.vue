<script setup lang="ts">
import { RouterView } from 'vue-router'
import HeaderLayout from './components/HeaderLayout.vue'
import FooterLayout from './components/FooterLayout.vue'
</script>

<template>
    <div class="flex flex-col min-h-screen font-display text-fashion-black bg-white antialiased">
        <HeaderLayout />

        <main class="flex-grow">
            <RouterView />
        </main>

        <FooterLayout />
    </div>
</template>
