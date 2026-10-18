// types/user.types.ts

export interface Permission {
  resource: string;
  actions: string[];
}
export interface User {
  id: string;
  name: string; // Mapped from 'full_name'
  email: string;
  role: string; // Mapped from 'role_name'
  status: string; // e.g., "active", "inactive"
  lastLogin: string; // Mapped from 'last_login_at'
  mfaEnabled: boolean; // Mapped from 'is_mfa_enabled'
  permissions: Permission[]; // List of permissions (e.g., ["read", "write"])
  phone?: string; // Optional phone number
}

export interface Role {
  id: string;
  tenantId: string;
  roleName: string;
  description: string;
  privileges: Array<{
    nameOfManage: string;
    actions: Array<{
      create: boolean;
      get: boolean;
      delete: boolean;
      update: boolean;
    }>;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface RolesApiResponse {
  count: number;
  roles: Role[];
}

export type AssignedUser = {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  phone: string | null;
  image: string | null;
  roleId: string;
  role?: Role;
  status: "active" | "inactive";
  riskLevel: "low" | "medium" | "high" | "critical" | string;
  createdAt: string;
  updatedAt: string;
};
