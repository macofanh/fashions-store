import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'

const routes: Array<RouteRecordRaw> = [
    {
        path: '/:pathMatch(.*)*',
        redirect: { name: 'home' },
    },
    {
        name: 'auth-root',
        path: '/auth',
        redirect: { name: 'login' },
        children: [
            {
                name: 'login',
                path: 'login',
                component: () =>
                    import('@/pages/auth/components/LoginPage.vue'),
            },
            {
                name: 'register',
                path: 'register',
                component: () =>
                    import('@/pages/auth/components/RegisterPage.vue'),
            },
        ],
    },
    {
        name: 'root',
        path: '/',
        component: () => import('@/layouts/DefaultLayout.vue'),
        redirect: { name: 'home' },
        children: [
            {
                name: 'home',
                path: '',
                component: () => import('@/pages/home/HomePage.vue'),
            },
            // Sau này bạn sẽ thêm /products, /cart ở đây...
        ],
    },

    // 3. ADMIN - QUẢN TRỊ VIÊN
    // {
    //     name: 'admin',
    //     path: '/admin',
    //     component: () => import('@/pages/admin/layouts/AdminLayout.vue'),
    //     redirect: { name: 'admin-overview' },
    //     // Chỉ admin và staff (nhân viên) mới được vào khu vực này
    //     meta: { requiresAuth: true, roles: ['admin', 'staff'] },
    //     children: [
    //         {
    //             name: 'admin-overview',
    //             path: 'overview',
    //             component: () =>
    //                 import('@/pages/admin/overview/OverviewAdmin.vue'),
    //         },
    //     ],
    // },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
})

// ==========================================
// BẢO VỆ ROUTE (NAVIGATION GUARDS)
// ==========================================
router.beforeEach((to, from, next) => {
    const isAuthenticated = !!localStorage.getItem('access_token')
    let userRole = 'customer' // Mặc định là khách hàng (chữ thường theo BE)

    // Đọc thông tin user từ localStorage
    const userInfoStr = localStorage.getItem('user_info')
    if (userInfoStr) {
        try {
            const userInfo = JSON.parse(userInfoStr)
            userRole = userInfo.role ? userInfo.role.toLowerCase() : 'customer'
        } catch (e) {
            console.error('Lỗi đọc dữ liệu người dùng')
        }
    }

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'login' })
    } else if (to.path.startsWith('/auth') && isAuthenticated) {
        next({ name: 'home' })
    } else if (to.meta.roles && Array.isArray(to.meta.roles)) {
        if (!to.meta.roles.includes(userRole)) {
            alert('Bạn không có quyền truy cập trang quản trị này!')
            next({ name: 'home' })
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router
