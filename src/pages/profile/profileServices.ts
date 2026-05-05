import { orderService } from '@/pages/cart/orderService'
import { addressService } from './addressService'
import axios from 'axios'

const PROVINCE_API = 'https://provinces.open-api.vn/api'

export const profileServices = {
    getMyOrders:    () => orderService.getMyOrders(),
    getMyAddresses: () => addressService.getMyAddresses(),
    addAddress:     (data: any) => addressService.addAddress(data),

    getProvinces:   () => axios.get(`${PROVINCE_API}/p/`),
    getDistricts:   (code: number) => axios.get(`${PROVINCE_API}/p/${code}?depth=2`),
    getWards:       (code: number) => axios.get(`${PROVINCE_API}/d/${code}?depth=2`),
}
