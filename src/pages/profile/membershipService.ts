import axiosClient from '@/lib/axiosClient'
import { apiEndpoints } from '@/lib/endPoints'

export interface RewardHistory {
    history_id: number
    user_id: number
    order_id: number | null
    points_delta: number
    reason: string
    created_at: string
}

// API trả về array trực tiếp
export type RewardHistoryResponse = RewardHistory[]

export const MEMBERSHIP_TIERS = [
    {
        key: 'diamond',
        label: 'Kim Cương',
        minPoints: 10000,
        color: 'text-cyan-500',
        bgColor: 'bg-cyan-50',
        borderColor: 'border-cyan-200',
        badgeColor: 'bg-cyan-500',
        icon: 'diamond',
        gradient: 'from-cyan-400 to-blue-500',
    },
    {
        key: 'platinum',
        label: 'Bạch Kim',
        minPoints: 5000,
        color: 'text-slate-500',
        bgColor: 'bg-slate-50',
        borderColor: 'border-slate-200',
        badgeColor: 'bg-slate-400',
        icon: 'workspace_premium',
        gradient: 'from-slate-400 to-slate-600',
    },
    {
        key: 'gold',
        label: 'Vàng',
        minPoints: 2000,
        color: 'text-amber-500',
        bgColor: 'bg-amber-50',
        borderColor: 'border-amber-200',
        badgeColor: 'bg-amber-400',
        icon: 'star',
        gradient: 'from-amber-400 to-yellow-500',
    },
    {
        key: 'silver',
        label: 'Bạc',
        minPoints: 500,
        color: 'text-zinc-400',
        bgColor: 'bg-zinc-50',
        borderColor: 'border-zinc-200',
        badgeColor: 'bg-zinc-400',
        icon: 'military_tech',
        gradient: 'from-zinc-300 to-zinc-500',
    },
    {
        key: 'bronze',
        label: 'Đồng',
        minPoints: 0,
        color: 'text-orange-700',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        badgeColor: 'bg-orange-700',
        icon: 'shield',
        gradient: 'from-orange-600 to-amber-800',
    },
] as const

export type TierKey = (typeof MEMBERSHIP_TIERS)[number]['key']

export function getTierByPoints(points: number) {
    return MEMBERSHIP_TIERS.find(t => points >= t.minPoints) ?? MEMBERSHIP_TIERS[MEMBERSHIP_TIERS.length - 1]
}

/** Điểm cần để lên tier tiếp theo (null nếu đã max) */
export function getNextTier(points: number) {
    const idx = MEMBERSHIP_TIERS.findIndex(t => points >= t.minPoints)
    if (idx <= 0) return null
    return MEMBERSHIP_TIERS[idx - 1]
}

export const membershipService = {
    getRewardHistory: () =>
        axiosClient.get<RewardHistoryResponse>(apiEndpoints.users.rewardHistory),
}
