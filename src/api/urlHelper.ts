export const getImageUrl = (url: string | null | undefined): string => {
    if (!url) return ''
    if (url.startsWith('http')) return url

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000'
    return `${baseUrl}${url}`
}
