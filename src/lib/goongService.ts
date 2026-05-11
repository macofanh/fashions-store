import axiosClient from '@/lib/axiosClient'

export interface GoongAddressSuggestion {
    place_id: string
    description: string
    main_text?: string | null
    secondary_text?: string | null
}

export interface GoongAddressDetail {
    place_id: string
    name?: string | null
    formatted_address?: string | null
    latitude: number
    longitude: number
    map_url: string
    static_map_url?: string | null
    raw?: unknown
}

class GoongService {
    private resolvedBasePath: string | null = null

    private getCandidateBasePaths() {
        return [
            this.resolvedBasePath,
            '/api/v1/addresses',
            '/api/v1/users/addresses',
            '/api/v1/profile/addresses',
        ].filter((value): value is string => Boolean(value))
    }

    private async requestWithFallback<T>(buildPath: (basePath: string) => string, params?: Record<string, unknown>) {
        let lastError: unknown = null

        for (const basePath of this.getCandidateBasePaths()) {
            try {
                const response = await axiosClient.get<T>(buildPath(basePath), {
                    params,
                })

                if (!this.resolvedBasePath) {
                    this.resolvedBasePath = basePath
                }

                return response
            } catch (error: any) {
                lastError = error
                if (error?.response?.status !== 404) {
                    throw error
                }
            }
        }

        throw lastError
    }

    public searchSuggestions(query: string, limit = 5) {
        return this.requestWithFallback<GoongAddressSuggestion[]>(
            (basePath) => `${basePath}/goong/suggestions`,
            { q: query, limit },
        )
    }

    public getDetail(placeId: string) {
        return this.requestWithFallback<GoongAddressDetail>(
            (basePath) => `${basePath}/goong/places/${placeId}`,
        )
    }
}

export const goongService = new GoongService()