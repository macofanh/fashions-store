<script setup lang="ts">
import HeroSection from './components/HeroSection.vue'
import FeaturedProducts from './components/FeaturedProducts.vue'
import EditorialSection from './components/EditorialSection.vue'
import NewsletterSection from './components/NewsletterSection.vue'
</script>

<template>
    <main class="flex-grow w-full">
        <HeroSection />
        <FeaturedProducts />
        <EditorialSection />
        <NewsletterSection />
    </main>
</template>
