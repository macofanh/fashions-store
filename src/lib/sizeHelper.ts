export interface SizeRecord {
    name: string
    heightMin: number
    heightMax: number
    weightMin: number
    weightMax: number
    topLength?: number
    topWidth?: number // chest/bust
    shoulder?: number
    sleeve?: number
    bottomLength?: number
    bottomWidth?: number // waist
    hip?: number
    legOpening?: number
}

export const SIZE_TABLES: Record<string, SizeRecord[]> = {
    top_male: [
        { name: 'M', heightMin: 150, heightMax: 165, weightMin: 42, weightMax: 55, topLength: 68.0, topWidth: 51.0, shoulder: 41.0, sleeve: 47.0 },
        { name: 'L', heightMin: 155, heightMax: 170, weightMin: 56, weightMax: 62, topLength: 70.0, topWidth: 53.0, shoulder: 42.0, sleeve: 49.0 },
        { name: 'XL', heightMin: 160, heightMax: 175, weightMin: 63, weightMax: 70, topLength: 72.0, topWidth: 55.0, shoulder: 43.0, sleeve: 51.0 },
        { name: '2XL', heightMin: 165, heightMax: 180, weightMin: 71, weightMax: 80, topLength: 74.0, topWidth: 57.0, shoulder: 44.0, sleeve: 53.0 },
        { name: '3XL', heightMin: 170, heightMax: 185, weightMin: 81, weightMax: 92, topLength: 76.0, topWidth: 59.0, shoulder: 45.0, sleeve: 55.0 }
    ],
    bottom_male: [
        { name: '28', heightMin: 158, heightMax: 166, weightMin: 50, weightMax: 56, bottomWidth: 76.0, hip: 96.0, legOpening: 17.5 },
        { name: '29', heightMin: 162, heightMax: 170, weightMin: 55, weightMax: 61, bottomWidth: 78.0, hip: 98.0, legOpening: 18.0 },
        { name: '30', heightMin: 165, heightMax: 173, weightMin: 60, weightMax: 67, bottomWidth: 80.0, hip: 100.0, legOpening: 18.5 },
        { name: '31', heightMin: 170, heightMax: 178, weightMin: 66, weightMax: 73, bottomWidth: 82.0, hip: 102.0, legOpening: 19.0 },
        { name: '32', heightMin: 174, heightMax: 182, weightMin: 72, weightMax: 79, bottomWidth: 85.0, hip: 104.0, legOpening: 19.5 },
        { name: '33', heightMin: 176, heightMax: 185, weightMin: 78, weightMax: 86, bottomWidth: 88.0, hip: 106.0, legOpening: 20.0 },
        { name: '34', heightMin: 178, heightMax: 188, weightMin: 85, weightMax: 95, bottomWidth: 91.0, hip: 108.0, legOpening: 20.5 }
    ],
    top_female: [
        { name: 'S', heightMin: 150, heightMax: 158, weightMin: 42, weightMax: 50, topLength: 65.5, topWidth: 86.0, sleeve: 62.0 },
        { name: 'M', heightMin: 155, heightMax: 163, weightMin: 47, weightMax: 56, topLength: 67.5, topWidth: 88.5, sleeve: 62.0 },
        { name: 'L', heightMin: 160, heightMax: 168, weightMin: 53, weightMax: 60, topLength: 68.5, topWidth: 92.5, sleeve: 62.0 },
        { name: 'XL', heightMin: 162, heightMax: 170, weightMin: 55, weightMax: 63, topLength: 68.5, topWidth: 97.5, sleeve: 62.0 },
        { name: '2XL', heightMin: 165, heightMax: 172, weightMin: 60, weightMax: 65, topLength: 68.5, topWidth: 102.5, sleeve: 62.0 }
    ],
    bottom_female: [
        { name: '26', heightMin: 150, heightMax: 158, weightMin: 40, weightMax: 46, bottomWidth: 66.0, hip: 92.0, legOpening: 16.0 },
        { name: '27', heightMin: 155, heightMax: 163, weightMin: 47, weightMax: 52, bottomWidth: 69.0, hip: 94.0, legOpening: 16.5 },
        { name: '28', heightMin: 160, heightMax: 168, weightMin: 53, weightMax: 58, bottomWidth: 72.0, hip: 96.0, legOpening: 17.0 },
        { name: '29', heightMin: 165, heightMax: 172, weightMin: 59, weightMax: 65, bottomWidth: 75.0, hip: 98.0, legOpening: 17.5 },
        { name: '30', heightMin: 168, heightMax: 175, weightMin: 64, weightMax: 70, bottomWidth: 78.0, hip: 100.0, legOpening: 18.0 },
        { name: '31', heightMin: 170, heightMax: 178, weightMin: 69, weightMax: 76, bottomWidth: 81.0, hip: 102.0, legOpening: 18.5 },
        { name: '32', heightMin: 172, heightMax: 180, weightMin: 75, weightMax: 84, bottomWidth: 84.0, hip: 104.0, legOpening: 19.0 }
    ]
}

/**
 * Detects the gender of the product.
 * Returns 'male', 'female', 'unisex', or null.
 */
export function detectProductGender(product: any): 'male' | 'female' | 'unisex' | null {
    if (!product) return null

    // 1. Dựa trên trường product.gender
    if (product.gender) {
        const g = product.gender.toLowerCase()
        if (g === 'male' || g === 'men' || g === 'man') return 'male'
        if (g === 'female' || g === 'women' || g === 'woman') return 'female'
        if (g === 'unisex') return 'unisex'
    }

    // 2. Dựa trên tên danh mục (category.name)
    const categoryName = product.category?.name?.toLowerCase() || ''
    if (categoryName.includes('nam')) return 'male'
    if (categoryName.includes('nữ') || categoryName.includes('nu')) return 'female'

    // 3. Dựa trên tags của sản phẩm (nếu có)
    if (Array.isArray(product.tags)) {
        for (const tag of product.tags) {
            const t = String(tag).toLowerCase()
            if (t.includes('nam')) return 'male'
            if (t.includes('nữ') || t.includes('nu')) return 'female'
        }
    }

    return null
}

/**
 * Safely parses the size type: 'top' or 'bottom'
 */
export function detectProductSizeType(product: any): 'top' | 'bottom' | null {
    if (!product) return null

    // 1. Dựa trên product.category.size_type
    if (product.category?.size_type) {
        const type = product.category.size_type.toLowerCase()
        if (type === 'top' || type === 'bottom') return type
    }

    // 2. Dựa trên tên danh mục hoặc tags
    const categoryName = product.category?.name?.toLowerCase() || ''
    if (categoryName.includes('áo') || categoryName.includes('khoác') || categoryName.includes('t-shirt') || categoryName.includes('sơ mi') || categoryName.includes('top')) {
        return 'top'
    }
    if (categoryName.includes('quần') || categoryName.includes('jean') || categoryName.includes('kaki') || categoryName.includes('bottom') || categoryName.includes('skirt') || categoryName.includes('chân váy')) {
        return 'bottom'
    }

    return null
}

/**
 * Core sizing algorithm based on height and weight.
 * Prioritizes weight, picks larger size on boundary overlaps.
 * Takes the maximum size index of height-based and weight-based sizes.
 */
export function getSuggestedSize(
    heightCm: number,
    weightKg: number,
    sizeType: 'top' | 'bottom',
    gender: 'male' | 'female'
): string | null {
    const tableKey = `${sizeType}_${gender}`
    const table = SIZE_TABLES[tableKey]
    if (!table || table.length === 0) return null

    // 1. Tìm tất cả các size khớp với cân nặng (S_W)
    let matchedWeights: { size: SizeRecord; index: number }[] = []
    table.forEach((item, index) => {
        if (weightKg >= item.weightMin && weightKg <= item.weightMax) {
            matchedWeights.push({ size: item, index })
        }
    })

    let baseIndex = -1
    if (matchedWeights.length > 0) {
        // Chọn size lớn nhất trong các size khớp cân nặng (khi rơi vào biên giới)
        matchedWeights.sort((a, b) => b.index - a.index)
        baseIndex = matchedWeights[0]?.index ?? -1
    } else {
        // Cân nặng nằm ngoài khoảng bảng size
        const firstMin = table[0]?.weightMin ?? 0
        if (weightKg < firstMin) {
            baseIndex = 0 // size nhỏ nhất
        } else {
            baseIndex = table.length - 1 // size lớn nhất
        }
    }

    if (baseIndex === -1) return null

    // 2. Kiểm tra xem chiều cao có vượt quá khoảng của size cân nặng không
    let finalIndex = baseIndex
    const currentSizeRecord = table[baseIndex]
    
    if (currentSizeRecord && heightCm > currentSizeRecord.heightMax) {
        // Tăng dần size cho đến khi chiều cao khớp (heightCm <= heightMax)
        for (let i = baseIndex + 1; i < table.length; i++) {
            const nextSize = table[i]
            if (nextSize && heightCm <= nextSize.heightMax) {
                finalIndex = i
                break
            }
            // Nếu vẫn vượt quá, tạm thời chọn size lớn nhất
            finalIndex = i
        }
    }

    return table[finalIndex]?.name ?? null
}

/**
 * Convenience function to suggest a size for a product and user profile
 */
export function getSuggestedSizeForProduct(product: any, user: any): string | null {
    if (!product || !user) return null

    const height = user.height_cm
    const weight = user.weight_kg
    if (!height || !weight) return null

    const sizeType = detectProductSizeType(product)
    let gender = detectProductGender(product)

    if (!sizeType) return null

    // Nếu là unisex hoặc không phát hiện được giới tính sản phẩm, mặc định theo giới tính người dùng hoặc male
    if (!gender || gender === 'unisex') {
        gender = 'male' 
    }

    return getSuggestedSize(Number(height), Number(weight), sizeType, gender)
}
