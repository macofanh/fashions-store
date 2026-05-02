import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { cartService } from '@/pages/cart/cartService'

export interface CartItem {
    cart_item_id: number
    variant_id: number
    product_name: string
    variant_info: string
    image_url: string
    unit_price: number
    quantity: number
}

// LocalStorage key cho guest cart
const GUEST_CART_KEY = 'azure_guest_cart'

export const useCartStore = defineStore('cart', () => {
    const items = ref<CartItem[]>([])
    const isLoading = ref(false)

    const totalQuantity = computed(() =>
        items.value.reduce((total, item) => total + item.quantity, 0)
    )
    const totalPrice = computed(() =>
        items.value.reduce((total, item) => total + item.unit_price * item.quantity, 0)
    )

    // ── Guest cart (LocalStorage) ──────────────────────────────
    function loadGuestCart() {
        try {
            const raw = localStorage.getItem(GUEST_CART_KEY)
            if (raw) items.value = JSON.parse(raw)
        } catch {
            items.value = []
        }
    }

    function saveGuestCart() {
        localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items.value))
    }

    function clearGuestCart() {
        localStorage.removeItem(GUEST_CART_KEY)
    }

    /**
     * Thêm sản phẩm vào guest cart (chưa đăng nhập).
     * Nếu variant đã có → tăng số lượng.
     */
    function addGuestItem(item: Omit<CartItem, 'cart_item_id'>) {
        const existing = items.value.find(i => i.variant_id === item.variant_id)
        if (existing) {
            existing.quantity += item.quantity
        } else {
            items.value.push({ ...item, cart_item_id: Date.now() })
        }
        saveGuestCart()
    }

    function updateGuestQty(variantId: number, quantity: number) {
        const item = items.value.find(i => i.variant_id === variantId)
        if (item) {
            item.quantity = quantity
            saveGuestCart()
        }
    }

    function removeGuestItem(variantId: number) {
        items.value = items.value.filter(i => i.variant_id !== variantId)
        saveGuestCart()
    }

    // ── Authenticated cart (API) ───────────────────────────────
    async function fetchCart() {
        isLoading.value = true
        try {
            const response = await cartService.getCart()
            items.value = response.data.items || []
        } catch (error) {
            console.error('Lỗi lấy giỏ hàng:', error)
        } finally {
            isLoading.value = false
        }
    }

    async function updateQty(itemId: number, quantity: number) {
        if (quantity < 1) return
        try {
            await cartService.updateCartItem(itemId, quantity)
            const item = items.value.find(i => i.cart_item_id === itemId)
            if (item) item.quantity = quantity
        } catch (error) {
            console.error('Lỗi cập nhật số lượng:', error)
        }
    }

    async function removeItem(itemId: number) {
        try {
            await cartService.deleteCartItem(itemId)
            items.value = items.value.filter(i => i.cart_item_id !== itemId)
        } catch (error) {
            console.error('Lỗi xóa sản phẩm:', error)
        }
    }

    return {
        items,
        isLoading,
        totalQuantity,
        totalPrice,
        loadGuestCart,
        saveGuestCart,
        clearGuestCart,
        addGuestItem,
        updateGuestQty,
        removeGuestItem,
        fetchCart,
        updateQty,
        removeItem,
    }
})
