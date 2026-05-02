import axiosClient from '@/lib/axiosClient'
import { apiEndpoints } from '@/lib/endPoints'

export interface Voucher {
    voucher_id: number
    code: string
    name: string
    subtitle?: string
    discount_type: 'PERCENT' | 'FIXED_AMOUNT' | 'FREE_SHIP'
    discount_value: number
    max_discount?: number
    min_order_value: number
    usage_limit?: number
    used_count: number
    start_date: string
    end_date: string
    is_active: boolean
    bg_color?: string
    banner_image?: string
    sort_order: number
}

export interface UserVoucher {
    id: number
    user_id: number
    voucher_id: number
    used_count: number
    last_used_at?: string
    voucher: Voucher
}

class PromotionService {
    public getVouchers(params?: { include_inactive?: boolean }) {
        return axiosClient.get<Voucher[]>(apiEndpoints.promotions.vouchers, { params })
    }

    public getMyVouchers() {
        return axiosClient.get<UserVoucher[]>(apiEndpoints.promotions.myVouchers)
    }

    public claimVoucher(voucherId: number) {
        return axiosClient.post<UserVoucher>(apiEndpoints.promotions.claim(voucherId))
    }

    public createVoucher(data: any) {
        return axiosClient.post<Voucher>(apiEndpoints.promotions.vouchers, data)
    }

    public updateVoucher(id: number, data: any) {
        return axiosClient.put<Voucher>(apiEndpoints.promotions.voucherDetail(id), data)
    }

    public deleteVoucher(id: number) {
        return axiosClient.delete(apiEndpoints.promotions.voucherDetail(id))
    }
}

export const promotionService = new PromotionService()
