import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { goongService } from '@/lib/goongService'

export interface ShippingConfig {
    store_address: string
    price_per_km: number
    free_shipping_threshold: number
    base_fee: number
    max_distance_km: number
    estimated_days: string
    phone_support: string
    note: string
}

const STORAGE_KEY = 'shipping_config'
const COORDS_KEY  = 'shipping_store_coords'

const defaultConfig: ShippingConfig = {
    store_address: 'Km10, Đường Nguyễn Trãi, Hà Đông, Hà Nội',
    price_per_km: 5000,
    free_shipping_threshold: 500000,
    base_fee: 15000,
    max_distance_km: 50,
    estimated_days: '1-3 ngày',
    phone_support: '1900 xxxx',
    note: '',
}

export const useShippingConfigStore = defineStore('shippingConfig', () => {
    const saved = localStorage.getItem(STORAGE_KEY)
    const config = ref<ShippingConfig>(saved ? { ...defaultConfig, ...JSON.parse(saved) } : { ...defaultConfig })

    // Cache tọa độ cửa hàng để không geocode lại mỗi lần
    const savedCoords = localStorage.getItem(COORDS_KEY)
    const storeCoords = ref<{ lat: number; lng: number } | null>(
        savedCoords ? JSON.parse(savedCoords) : null
    )
    const isFetchingCoords = ref(false)

    watch(config, (val) => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(val))
        // Khi địa chỉ thay đổi → xóa cache tọa độ cũ
        storeCoords.value = null
        localStorage.removeItem(COORDS_KEY)
    }, { deep: true })

    const save = (newConfig: ShippingConfig) => {
        config.value = { ...newConfig }
    }

    const reset = () => {
        config.value = { ...defaultConfig }
    }

    /**
     * Lấy tọa độ GPS của địa chỉ cửa hàng qua Goong API.
     * Kết quả được cache trong localStorage.
     */
    const fetchStoreCoords = async (): Promise<{ lat: number; lng: number } | null> => {
        if (storeCoords.value) return storeCoords.value
        if (isFetchingCoords.value) return null

        isFetchingCoords.value = true
        try {
            const suggestRes = await goongService.searchSuggestions(config.value.store_address, 1)
            const suggestions = suggestRes.data
            if (!suggestions.length) return null

            const first = suggestions[0]
            if (!first?.place_id) return null

            const detailRes = await goongService.getDetail(first.place_id)
            const { latitude, longitude } = detailRes.data
            const coords = { lat: latitude, lng: longitude }

            storeCoords.value = coords
            localStorage.setItem(COORDS_KEY, JSON.stringify(coords))
            return coords
        } catch (e) {
            console.error('Lỗi geocode địa chỉ cửa hàng:', e)
            return null
        } finally {
            isFetchingCoords.value = false
        }
    }

    return { config, storeCoords, isFetchingCoords, save, reset, fetchStoreCoords }
})
