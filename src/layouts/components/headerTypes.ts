export interface NavLink {
    label: string
    to: string
    /** Chỉ hiển thị khi điều kiện này đúng (mặc định: luôn hiện) */
    condition?: boolean
    /** Class tuỳ chỉnh thêm vào link */
    extraClass?: string
}

export interface ProfileMenuItem {
    key: string
    label: string
    icon: string
    /** Dùng `to` cho router-link, hoặc `action` cho button */
    to?: string
    action?: () => void
    extraClass?: string
    /** Thêm divider phía trên item này */
    dividerBefore?: boolean
}
