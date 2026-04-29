import axiosClient from '@/api/axiosClient'
import { apiEndpoints } from '@/api/endPoints'

class CartService {
    public getCart() {
        return axiosClient.get(apiEndpoints.orders.cart)
    }

    public addToCart(variant_id: number, quantity: number) {
        return axiosClient.post(apiEndpoints.orders.addCartItem, { variant_id, quantity })
    }

    public updateCartItem(cart_item_id: number, quantity: number) {
        return axiosClient.put(apiEndpoints.orders.updateCartItem(cart_item_id), { quantity })
    }

    public deleteCartItem(cart_item_id: number) {
        return axiosClient.delete(apiEndpoints.orders.deleteCartItem(cart_item_id))
    }
}

export const cartService = new CartService()
