import axiosClient from '@/lib/axiosClient'
import { apiEndpoints } from '@/lib/endPoints'

export interface Address {
    address_id: number
    recipient_name: string
    phone: string
    province: string
    district: string
    ward: string
    street_address: string
    is_default: boolean
}

class AddressService {
    public getMyAddresses() {
        return axiosClient.get<Address[]>(apiEndpoints.users.addresses)
    }

    public addAddress(data: Omit<Address, 'address_id' | 'is_default'>) {
        return axiosClient.post(apiEndpoints.users.addresses, data)
    }
}

export const addressService = new AddressService()
