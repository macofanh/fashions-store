import { cartService } from '@/pages/cart/cartService'
import { orderService, type OrderCreateData } from '@/pages/cart/orderService'
import { promotionService } from '@/pages/promotions/promotionService'
import { addressService } from '@/pages/profile/addressService'
import axios from 'axios'

const PROVINCE_API = 'https://provinces.open-api.vn/api'

export const checkoutServices = {
    getCart:         () => cartService.getCart(),
    getMyVouchers:   () => promotionService.getMyVouchers(),
    getMyAddresses:  () => addressService.getMyAddresses(),
    createOrder:     (data: OrderCreateData) => orderService.createOrder(data),
    getOrderDetail:  (id: number) => orderService.getOrderDetail(id),

    getProvinces:  () => axios.get(`${PROVINCE_API}/p/`),
    getDistricts:  (code: number) => axios.get(`${PROVINCE_API}/p/${code}?depth=2`),
    getWards:      (code: number) => axios.get(`${PROVINCE_API}/d/${code}?depth=2`),
}
