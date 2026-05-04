<script setup lang="ts">
import { onMounted } from 'vue'
import { homeHandler } from './homeHandler'

import HeroSection      from './components/HeroSection.vue'
import VoucherTicker    from './components/VoucherTicker.vue'
import FeaturedProducts from './components/FeaturedProducts.vue'
import QuoteSection     from './components/QuoteSection.vue'

const {
    products,
    isLoadingProducts,
    vouchers,
    claimedIds,
    claimingId,
    initHomePage,
    claimVoucher,
} = homeHandler()

onMounted(initHomePage)
</script>

<template>
    <div class="bg-white">

        <!-- Hero + Ticker liền nhau, ticker nằm trong slot của HeroSection -->
        <HeroSection>
            <template #ticker>
                <VoucherTicker
                    v-if="vouchers.length > 0"
                    :vouchers="vouchers"
                    :claimed-ids="claimedIds"
                    :claiming-id="claimingId"
                    @claim="claimVoucher"
                />
            </template>
        </HeroSection>

        <FeaturedProducts
            :products="products"
            :is-loading="isLoadingProducts"
        />

        <QuoteSection />

    </div>
</template>
