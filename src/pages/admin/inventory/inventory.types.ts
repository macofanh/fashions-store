export type InventoryTab = 'stock' | 'logs'
export type StockFilter = 'all' | 'low' | 'out'
export type InventoryChangeType = 'IN' | 'OUT' | 'RETURN' | 'ADJUST'

export interface VariantStock {
    variant_id: number
    product_name: string
    sku: string
    color_name: string
    size_name: string
    stock_qty: number
    base_price: number
    image_url?: string
    low_stock_threshold: number
}

export interface InventoryLog {
    log_id: number
    variant_id: number
    change_type: InventoryChangeType
    quantity: number
    stock_before: number
    stock_after: number
    note?: string
    created_at: string
}

export interface AdjustStockForm {
    variant_id: string
    change_type: InventoryChangeType
    quantity: number
    note: string
}

export interface StockStats {
    total: number
    low: number
    out: number
}

export interface ChangeTypeDisplay {
    label: string
    bg: string
    text: string
}
