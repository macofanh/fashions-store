import { productService } from '@/pages/products/productService'
import { promotionService } from '@/pages/promotions/promotionService'

export const homeServices = {
    /** Lấy sản phẩm nổi bật cho trang chủ */
    getFeaturedProducts(pageSize = 8) {
        return productService.getProducts({ page_size: pageSize })
    },

    /** Lấy danh sách voucher đang hoạt động */
    getActiveVouchers() {
        return promotionService.getVouchers()
    },

    /** Lấy voucher đã lưu của user hiện tại */
    getMyVouchers() {
        return promotionService.getMyVouchers()
    },

    /** Lưu voucher cho user */
    claimVoucher(voucherId: number) {
        return promotionService.claimVoucher(voucherId)
    },
}
