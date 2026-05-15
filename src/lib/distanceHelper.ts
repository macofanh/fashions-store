/**
 * Tính khoảng cách giữa 2 tọa độ GPS bằng công thức Haversine.
 * Trả về khoảng cách tính bằng km.
 */
export function haversineDistance(
    lat1: number, lon1: number,
    lat2: number, lon2: number,
): number {
    const R = 6371 // bán kính Trái Đất (km)
    const dLat = toRad(lat2 - lat1)
    const dLon = toRad(lon2 - lon1)
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function toRad(deg: number) {
    return (deg * Math.PI) / 180
}

/**
 * Tính phí ship dựa trên khoảng cách và config.
 * - Nếu subtotal >= free_shipping_threshold → 0đ
 * - Nếu distance <= 1km → base_fee
 * - Nếu distance > max_distance_km → null (không hỗ trợ giao)
 * - Còn lại → base_fee + (distance - 1) * price_per_km
 */
export function calcShippingFee(params: {
    distanceKm: number
    subtotal: number
    baseFee: number
    pricePerKm: number
    freeThreshold: number
    maxDistanceKm: number
}): { fee: number; isFree: boolean; outOfRange: boolean } {
    const { distanceKm, subtotal, baseFee, pricePerKm, freeThreshold, maxDistanceKm } = params

    if (subtotal >= freeThreshold) {
        return { fee: 0, isFree: true, outOfRange: false }
    }

    if (distanceKm > maxDistanceKm) {
        return { fee: 0, isFree: false, outOfRange: true }
    }

    const extraKm = Math.max(0, distanceKm - 1)
    const fee = Math.round(baseFee + extraKm * pricePerKm)
    return { fee, isFree: false, outOfRange: false }
}
