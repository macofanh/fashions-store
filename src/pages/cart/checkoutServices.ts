import { cartService } from './cartService'
import { orderService, type OrderCreateData } from './orderService'
import { promotionService } from '@/pages/promotions/promotionService'
import axios from 'axios'

const PROVINCE_API = 'https://provinces.open-api.vn/api'

export const checkoutServices = {
    getCart:       () => cartService.getCart(),
    getMyVouchers: () => promotionService.getMyVouchers(),
    createOrder:   (data: OrderCreateData) => orderService.createOrder(data),

    getProvinces:  () => axios.get(`${PROVINCE_API}/p/`),
    getDistricts:  (code: number) => axios.get(`${PROVINCE_API}/p/${code}?depth=2`),
    getWards:      (code: number) => axios.get(`${PROVINCE_API}/d/${code}?depth=2`),
}
