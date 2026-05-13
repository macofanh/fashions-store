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
    latitude?: number | null
    longitude?: number | null
    is_default: boolean
}

export type AddressPayload = Omit<Address, 'address_id' | 'latitude' | 'longitude'>

class AddressService {
    public getMyAddresses() {
        return axiosClient.get<Address[]>(apiEndpoints.users.addresses)
    }

    public addAddress(data: Omit<AddressPayload, 'is_default'> & { is_default?: boolean }) {
        return axiosClient.post<Address>(apiEndpoints.users.addresses, data)
    }

    public updateAddress(id: number, data: Partial<AddressPayload>) {
        return axiosClient.put<Address>(`${apiEndpoints.users.addresses}/${id}`, data)
    }

    public deleteAddress(id: number) {
        return axiosClient.delete(`${apiEndpoints.users.addresses}/${id}`)
    }

    public setDefault(id: number) {
        return axiosClient.put<Address>(`${apiEndpoints.users.addresses}/${id}/default`)
    }
}

export const addressService = new AddressService()
