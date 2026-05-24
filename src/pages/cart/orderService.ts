import axiosClient from '@/lib/axiosClient'
import { apiEndpoints } from '@/lib/endPoints'

export interface OrderCreateData {
    payment_method: string
    cart_item_ids?: number[]
    address_snapshot: {
        recipient_name: string
        phone: string
        province: string
        district: string
        ward: string
        street_address: string
        latitude?: number | null
        longitude?: number | null
    }
    shipping_fee?: number
    voucher_id?: number
    points_used?: number
    note?: string
}

class OrderService {
    public createOrder(data: OrderCreateData) {
        return axiosClient.post(apiEndpoints.orders.createFromCart, data)
    }

    public getMyOrders(params?: any) {
        return axiosClient.get(apiEndpoints.orders.myOrders, { params })
    }

    public getOrderDetail(id: number) {
        return axiosClient.get(apiEndpoints.orders.detail(id))
    }
}

export const orderService = new OrderService()
