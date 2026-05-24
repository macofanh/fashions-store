// Re-export từ service để dùng trong pages

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

export interface Product {
    product_id: number
    category_id: number
    category?: {
        category_id: number
        name: string
    }
    name: string
    slug: string
    description?: string
    brand?: string
    gender?: string
    base_price: number
    is_active: boolean
    avg_rating: number
    total_sold: number
    created_at?: string
    deleted_at?: string | null
    images: {
        image_id: number
        image_url: string
        is_primary: boolean
    }[]
    variants?: any[]
}

export interface ProductListResponse {
    items: Product[]
    total: number
    page: number
    page_size: number
    total_pages: number
}
