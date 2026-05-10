import './assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'
import App from './App.vue'
import router from './router'
import { useAuthStore } from './stores/useAuthStore'
// import VueApexCharts from 'vue3-apexcharts'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
const authStore = useAuthStore(pinia)

const redirectUrl = new URL(window.location.href)
const accessTokenFromUrl = redirectUrl.searchParams.get('access_token')
const refreshTokenFromUrl = redirectUrl.searchParams.get('refresh_token')

if (accessTokenFromUrl) {
	authStore.hydrateTokens(accessTokenFromUrl, refreshTokenFromUrl ?? undefined)
	redirectUrl.searchParams.delete('access_token')
	redirectUrl.searchParams.delete('refresh_token')
	window.history.replaceState({}, document.title, `${redirectUrl.pathname}${redirectUrl.search}${redirectUrl.hash}`)
}

await authStore.bootstrapAuth()

app.use(router)
// app.use(VueApexCharts)
app.mount('#app')