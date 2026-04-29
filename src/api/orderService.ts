import axiosClient from '@/api/axiosClient'
import { apiEndpoints } from '@/api/endPoints'

export interface OrderCreateData {
    payment_method: string
    address_snapshot: {
        recipient_name: string
        phone: string
        province: string
        district: string
        ward: string
        street_address: string
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

    public getMyOrders() {
        return axiosClient.get(apiEndpoints.orders.myOrders)
    }

    public getOrderDetail(id: number) {
        return axiosClient.get(apiEndpoints.orders.detail(id))
    }
}

export const orderService = new OrderService()
