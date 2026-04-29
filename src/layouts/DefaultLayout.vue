<script setup lang="ts">
import { RouterView } from 'vue-router'
import Navbar from './components/Navbar.vue'
import FooterLayout from './components/FooterLayout.vue'
</script>

<template>
    <div class="flex flex-col min-h-screen font-body text-[#0e191b] bg-white antialiased">
        <Navbar />
        
        <main class="flex-grow">
            <RouterView />
        </main>

        <FooterLayout />
    </div>
</template>

<style scoped></style>
