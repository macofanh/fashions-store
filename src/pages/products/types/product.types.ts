// Re-export từ service để dùng trong pages
export type { Product } from '@/pages/products/productService'

export interface ProductFilters {
    search: string
    category_id: number | null
    gender: string
    min_price: number | null
    max_price: number | null
    sort_by: string
    sort_order: string
}

export interface PriceRange {
    min: string
    max: string
}
