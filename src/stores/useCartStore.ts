import { defineStore } from 'pinia'
import { cartService } from '@/api/cartService'

export interface CartItem {
    cart_item_id: number
    variant_id: number
    product_name: string
    variant_info: string
    image_url: string
    unit_price: number
    quantity: number
}

export const useCartStore = defineStore('cart', {
    state: () => ({
        items: [] as CartItem[],
        isLoading: false
    }),

    getters: {
        totalQuantity: (state) => state.items.reduce((total, item) => total + item.quantity, 0),
        totalPrice: (state) => state.items.reduce((total, item) => total + (item.unit_price * item.quantity), 0)
    },

    actions: {
        async fetchCart() {
            this.isLoading = true
            try {
                const response = await cartService.getCart()
                this.items = response.data.items || []
            } catch (error) {
                console.error('Lỗi lấy giỏ hàng:', error)
            } finally {
                this.isLoading = false
            }
        },

        async updateQty(itemId: number, quantity: number) {
            if (quantity < 1) return
            try {
                await cartService.updateCartItem(itemId, quantity)
                const item = this.items.find(i => i.cart_item_id === itemId)
                if (item) item.quantity = quantity
            } catch (error) {
                console.error('Lỗi cập nhật số lượng:', error)
            }
        },

        async removeItem(itemId: number) {
            try {
                await cartService.deleteCartItem(itemId)
                this.items = this.items.filter(i => i.cart_item_id !== itemId)
            } catch (error) {
                console.error('Lỗi xóa sản phẩm:', error)
            }
        }
    }
})
