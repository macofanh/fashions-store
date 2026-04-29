import axiosClient from '@/api/axiosClient'
import { apiEndpoints } from '@/api/endPoints'

export interface Product {
    product_id: number
    category_id: number
    name: string
    slug: string
    description?: string
    brand?: string
    gender?: string
    base_price: number
    is_active: boolean
    avg_rating: number
    total_sold: number
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

class ProductService {
    public getProducts(params?: any) {
        return axiosClient.get<ProductListResponse>(apiEndpoints.products.list, { params })
    }

    public getProductBySlug(slug: string) {
        return axiosClient.get(apiEndpoints.products.slug(slug))
    }

    public getCategories() {
        return axiosClient.get(apiEndpoints.categories.list)
    }

    public getReviews(productId: number) {
        return axiosClient.get(apiEndpoints.products.reviews(productId))
    }

    public addReview(productId: number, data: FormData) {
        return axiosClient.post(apiEndpoints.products.reviews(productId), data, {
            headers: { 'Content-Type': 'multipart/form-data' }
        })
    }
}

export const productService = new ProductService()
