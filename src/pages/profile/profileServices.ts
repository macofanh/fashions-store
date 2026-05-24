import { orderService } from '@/pages/cart/orderService'
import { addressService } from './addressService'
import axiosClient from '@/lib/axiosClient'
import axios from 'axios'
import { apiEndpoints } from '@/lib/endPoints'

export interface UpdateMyProfilePayload {
    full_name: string
    phone?: string | null
}

const PROVINCE_API = 'https://provinces.open-api.vn/api'

export const profileServices = {
    getMyOrders:    (params?: any) => orderService.getMyOrders(params),
    getMyAddresses: () => addressService.getMyAddresses(),
    addAddress:     (data: any) => addressService.addAddress(data),
    updateMyProfile: (data: UpdateMyProfilePayload) => axiosClient.put(apiEndpoints.users.me, data),
    updateMyAvatar: (file: File) => {
        const formData = new FormData()
        formData.append('file', file)

        return axiosClient.put(`${apiEndpoints.users.me}/avatar`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        })
    },

    getProvinces:   () => axios.get(`${PROVINCE_API}/p/`),
    getDistricts:   (code: number) => axios.get(`${PROVINCE_API}/p/${code}?depth=2`),
    getWards:       (code: number) => axios.get(`${PROVINCE_API}/d/${code}?depth=2`),
}
