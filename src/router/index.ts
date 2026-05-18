import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/useAuthStore'
import { useUIStore } from '@/stores/useUIStore'

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
                name: 'google-callback',
                path: 'google/callback',
                component: () =>
                    import('@/pages/auth/components/GoogleCallbackPage.vue'),
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
        // DefaultLayout đã chứa sẵn Header và Footer bên trong nó rồi
        component: () => import('@/layouts/DefaultLayout.vue'),
        redirect: { name: 'home' },
        children: [
            {
                name: 'home',
                path: '',
                // HomePage chứa nội dung chính ở giữa
                component: () => import('@/pages/home/HomePage.vue'),
            },
            {
                name: 'products',
                path: 'products',
                component: () => import('@/pages/products/ProductList.vue'),
            },
            {
                name: 'product-detail',
                path: 'products/:slug',
                component: () => import('@/pages/products/ProductDetail.vue'),
            },
            {
                name: 'cart',
                path: 'cart',
                component: () => import('@/pages/cart/CartPage.vue'),
                // Không yêu cầu auth — guest có thể xem giỏ hàng
            },
            {
                name: 'checkout',
                path: 'checkout',
                component: () => import('@/pages/cart/CheckoutPage.vue'),
                meta: { requiresAuth: true }
            },
            {
                name: 'profile',
                path: 'profile',
                component: () => import('@/pages/profile/ProfilePage.vue'),
                meta: { requiresAuth: true }
            },
            {
                name: 'vouchers',
                path: 'vouchers',
                component: () => import('@/pages/promotions/VoucherCenter.vue'),
            },
        ],
    },

    // 3. ADMIN - QUẢN TRỊ VIÊN
    {
        name: 'admin',
        path: '/admin',
        component: () => import('@/layouts/AdminLayout.vue'),
        redirect: { name: 'admin-overview' },
        meta: { requiresAuth: true, roles: ['admin', 'staff'] },
        children: [
            {
                name: 'admin-overview',
                path: 'overview',
                component: () => import('@/pages/admin/overview/OverviewAdmin.vue'),
                meta: { requiresAuth: true, roles: ['admin'] }, // Chỉ admin
            },
            {
                name: 'admin-products',
                path: 'products',
                component: () => import('@/pages/admin/products/ProductManagement.vue'),
            },
            {
                name: 'admin-orders',
                path: 'orders',
                component: () => import('@/pages/admin/orders/OrderManagement.vue'),
            },
            {
                name: 'admin-chat',
                path: 'chat',
                component: () => import('@/pages/admin/chat/ChatManagement.vue'),
            },
            {
                name: 'admin-inventory',
                path: 'inventory',
                component: () => import('@/pages/admin/inventory/InventoryManagement.vue'),
            },
            {
                name: 'admin-users',
                path: 'users',
                component: () => import('@/pages/admin/users/UserManagement.vue'),
            },
            {
                name: 'admin-vouchers',
                path: 'vouchers',
                component: () => import('@/pages/admin/promotions/VoucherManagement.vue'),
            },
            {
                name: 'admin-shipping',
                path: 'shipping',
                component: () => import('@/pages/admin/shipping/ShippingConfig.vue'),
                meta: { requiresAuth: true, roles: ['admin'] }, // Chỉ admin
            },
        ],
    },
]

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    // Thêm scrollBehavior để chuyển trang web tự cuộn lên mượt mà
    scrollBehavior() {
        return { top: 0, behavior: 'smooth' }
    },
    routes,
})

// ==========================================
// BẢO VỆ ROUTE (NAVIGATION GUARDS)
// ==========================================
router.beforeEach((to, from, next) => {
    const authStore = useAuthStore()
    const isAuthenticated = authStore.isAuthenticated
    const userRole = authStore.user?.role ? authStore.user.role.toLowerCase() : 'customer'

    if (to.meta.requiresAuth && !isAuthenticated) {
        next({ name: 'login' })
    } else if (to.path.startsWith('/auth') && isAuthenticated) {
        next({ name: 'home' })
    } else if (to.meta.roles && Array.isArray(to.meta.roles)) {
        if (!to.meta.roles.includes(userRole)) {
            const uiStore = useUIStore()
            uiStore.error('Bạn không có quyền truy cập trang này!')
            // Staff bị chặn khỏi trang admin-only → redirect về trang đầu tiên có quyền
            next({ name: 'admin-products' })
        } else {
            next()
        }
    } else {
        next()
    }
})

export default router
