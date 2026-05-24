import axiosClient from '@/lib/axiosClient'
import type { AdjustStockForm, InventoryLog, VariantStock } from './inventory.types'

interface ProductVariantResponse {
    variant_id: number
    sku: string
    stock_qty: number
    price: number
    low_stock_threshold?: number
    image_url?: string
    product?: {
        name?: string
        images?: Array<{ image_url?: string }>
    }
    color?: { name?: string }
    size?: { name?: string }
}

interface InventoryLogsResponse {
    items: InventoryLog[]
}

interface PaginatedResponse<T> {
    items: T[]
}

function getResponseItems<T>(data: T[] | PaginatedResponse<T>): T[] {
    if (Array.isArray(data)) return data
    return Array.isArray(data.items) ? data.items : []
}

function mapVariantStock(variant: ProductVariantResponse): VariantStock {
    return {
        variant_id: variant.variant_id,
        product_name: variant.product?.name || 'N/A',
        sku: variant.sku,
        color_name: variant.color?.name || 'N/A',
        size_name: variant.size?.name || 'N/A',
        stock_qty: variant.stock_qty,
        base_price: variant.price,
        low_stock_threshold: variant.low_stock_threshold || 5,
        image_url: variant.image_url || variant.product?.images?.[0]?.image_url,
    }
}

export const inventoryService = {
    async getVariantStocks() {
        const response = await axiosClient.get<ProductVariantResponse[] | PaginatedResponse<ProductVariantResponse>>(
            '/api/v1/products/variants',
            { params: { page_size: 1000 } },
        )
        return getResponseItems(response.data).map(mapVariantStock)
    },

    async getInventoryLogs(pageSize = 50) {
        const response = await axiosClient.get<InventoryLog[] | InventoryLogsResponse>('/api/v1/inventory/inventory-logs', {
            params: { page_size: pageSize },
        })

        return getResponseItems(response.data)
    },

    async adjustStock(form: AdjustStockForm) {
        return axiosClient.post('/api/v1/inventory/inventory-logs', {
            variant_id: Number(form.variant_id),
            change_type: form.change_type,
            quantity: form.change_type === 'OUT'
                ? -Math.abs(form.quantity)
                : Math.abs(form.quantity),
            note: form.note,
        })
    },
}
