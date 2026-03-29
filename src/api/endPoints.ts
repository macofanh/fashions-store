const basePrefix = '/api/v1'

export const apiEndpoints = {
    auth: {
        register: `${basePrefix}/auth/register`,
        createStaff: `${basePrefix}/auth/admin/create-staff`,
        login: `${basePrefix}/auth/login`,
        refresh: `${basePrefix}/auth/refresh`,
        google: `${basePrefix}/auth/google`,
        me: `${basePrefix}/auth/me`,
    },
    // Sau này bạn thêm products, cart, orders vào đây...
} as const