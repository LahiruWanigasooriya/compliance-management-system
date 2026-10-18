export type UserType = {
    id : string
    tenant_id: string
    email: string
    full_name: string
    phone: string
    role: string
    status: string
    risk_level: number
}
const PERMISSIONS = {
    FRAUD_ALERTS: 'FRAUD_ALERTS',
    INVESTIGATE_FLAGGED_TRANSACTIONS: 'INVESTIGATE_FLAGGED_TRANSACTIONS',
    SAR: 'SAR',
    CTR: 'CTR',
    ESCALATE: 'ESCALATE',

}

const ROLES = {
    USER: [PERMISSIONS.FRAUD_ALERTS, PERMISSIONS.INVESTIGATE_FLAGGED_TRANSACTIONS, PERMISSIONS.SAR, PERMISSIONS.CTR, PERMISSIONS.ESCALATE],
}

export function hasPermission(user: UserType, permission: keyof typeof PERMISSIONS): boolean {
    if (!user) return false;
    return ROLES[user.role.toUpperCase() as keyof typeof ROLES].includes(permission.toUpperCase());
}




