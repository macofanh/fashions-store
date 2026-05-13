/// <reference types="vite/client" />

declare module '*.vue' {
    import { DefineComponent } from 'vue'
    const component: DefineComponent<{}, {}, any>
    export default component
}

// Khai báo biến môi trường Vite
interface ImportMetaEnv {
    readonly VITE_API_BASE_URL: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}

// Khai báo Google Identity Services — mở rộng trực tiếp interface Window
// (không dùng declare global vì file này là ambient script, không phải module)
interface Window {
    google?: {
        accounts: {
            id: {
                initialize: (config: {
                    client_id: string
                    callback: (response: { credential: string }) => void
                    auto_select?: boolean
                    cancel_on_tap_outside?: boolean
                }) => void
                prompt: () => void
                renderButton: (
                    element: HTMLElement,
                    options: Record<string, unknown>
                ) => void
                disableAutoSelect: () => void
            }
        }
    }
}
