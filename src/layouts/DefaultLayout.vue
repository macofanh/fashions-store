<script setup lang="ts">
import { RouterView } from 'vue-router'
import HeaderLayout from './components/HeaderLayout.vue'
import FooterLayout from './components/FooterLayout.vue'
</script>

<template>
    <div class="container-xxl bg-white p-0">
        <HeaderLayout />

        <main>
            <RouterView />
        </main>

        <FooterLayout />

        <a href="#" class="btn btn-lg btn-primary btn-lg-square back-to-top">
            <i class="bi bi-arrow-up"></i>
        </a>
    </div>
</template>

<style scoped></style>
