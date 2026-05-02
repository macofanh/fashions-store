export type { CartItem } from '@/stores/useCartStore'

export interface GuestCartItem {
    variant_id: number
    product_name: string
    variant_info: string
    image_url: string
    unit_price: number
    quantity: number
    slug: string
}
