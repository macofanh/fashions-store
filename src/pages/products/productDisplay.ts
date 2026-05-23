import type { Product } from '@/pages/products/productService'

export interface ProductColor {
    color_id: number
    name?: string
    hex_code?: string
}

export const formatPrice = (price: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price)

export const getPrimaryImage = (product: Product) => {
    if (!product.images?.length) return null
    return product.images.find(img => img.is_primary) || product.images[0]
}

export const isNewProduct = (product: Product): boolean => {
    if (!product.created_at) return false
    const created = new Date(product.created_at)
    const diffDays = (Date.now() - created.getTime()) / (1000 * 60 * 60 * 24)
    return diffDays <= 30
}

export const getUniqueColors = (product: Product): ProductColor[] => {
    if (!product.variants?.length) return []

    const colors = product.variants
        .map(variant => variant.color)
        .filter(Boolean) as ProductColor[]

    return Array.from(new Map(colors.map(color => [color.color_id, color])).values())
}
