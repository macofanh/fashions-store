import axiosClient from '@/lib/axiosClient'
import { apiEndpoints } from '@/lib/endPoints'

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

    public addReview(productId: number, payload: {
        variant_id: number
        rating: number
        title?: string
        content?: string
        files?: File[]
    }) {
        const hasFiles = payload.files && payload.files.length > 0

        if (hasFiles) {
            // Gửi multipart/form-data khi có ảnh
            const formData = new FormData()
            formData.append('variant_id', String(payload.variant_id))
            formData.append('rating',     String(payload.rating))
            if (payload.title)   formData.append('title',   payload.title)
            if (payload.content) formData.append('content', payload.content)
            payload.files!.forEach(f => formData.append('files', f))
            return axiosClient.post(apiEndpoints.products.reviews(productId), formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            })
        }

        // Không có ảnh → gửi JSON body
        return axiosClient.post(apiEndpoints.products.reviews(productId), {
            variant_id: payload.variant_id,
            rating:     payload.rating,
            title:      payload.title   ?? null,
            content:    payload.content ?? null,
        })
    }
}

export const productService = new ProductService()
