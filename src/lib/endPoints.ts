const basePrefix = '/api/v1'

export const apiEndpoints = {
    auth: {
        register: `${basePrefix}/auth/register`,
        createStaff: `${basePrefix}/auth/admin/create-staff`,
        login: `${basePrefix}/auth/login`,
        refresh: `${basePrefix}/auth/refresh`,
        google: `${basePrefix}/auth/google`,
        googleLogin: `${basePrefix}/auth/google/login`,
        googleCallback: `${basePrefix}/auth/google/callback`,
        me: `${basePrefix}/auth/me`,
    },
    products: {
        list: `${basePrefix}/products`,
        detail: (id: number) => `${basePrefix}/products/${id}`,
        slug: (slug: string) => `${basePrefix}/products/slug/${slug}`,
        colors: `${basePrefix}/products/colors`,
        sizes: `${basePrefix}/products/sizes`,
        reviews: (id: number) => `${basePrefix}/products/${id}/reviews`,
    },
    categories: {
        list: `${basePrefix}/categories`,
    },
    orders: {
        cart: `${basePrefix}/orders/cart`,
        addCartItem: `${basePrefix}/orders/cart/items`,
        updateCartItem: (id: number) => `${basePrefix}/orders/cart/items/${id}`,
        deleteCartItem: (id: number) => `${basePrefix}/orders/cart/items/${id}`,
        createFromCart: `${basePrefix}/orders/from-cart`,
        myOrders: `${basePrefix}/orders/my`,
        detail: (id: number) => `${basePrefix}/orders/${id}`,
    },
    users: {
        me: `${basePrefix}/users/me`,
        addresses: `${basePrefix}/users/me/addresses`,
        wishlist: `${basePrefix}/users/me/wishlist`,
        rewardHistory: `${basePrefix}/users/me/reward-history`,
    },
    addresses: {
        goongSuggestions: `${basePrefix}/addresses/goong/suggestions`,
        goongDetail: (placeId: string) => `${basePrefix}/addresses/goong/places/${placeId}`,
    },
    promotions: {
        vouchers: `${basePrefix}/promotions/vouchers`,
        voucherDetail: (id: number) => `${basePrefix}/promotions/vouchers/${id}`,
        claim: (id: number) => `${basePrefix}/promotions/vouchers/${id}/claim`,
        myVouchers: `${basePrefix}/promotions/my-vouchers`,
    },
    notifications: {
        create: `${basePrefix}/notifications`,
        my: `${basePrefix}/notifications/my`,
        unreadCount: `${basePrefix}/notifications/my/unread-count`,
        markAsRead: (id: number) => `${basePrefix}/notifications/${id}/read`,
        markAllAsRead: `${basePrefix}/notifications/my/read-all`,
    },
} as const
