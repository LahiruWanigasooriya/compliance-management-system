import { useAuth } from "@/components/providers/auth.provider";

type Resource =
  | "user_management"
  | "case_management"
  | "rbac_management"
  | "kyc_verification"
  | "geolocation_compliance"
  | "watchlist_screening"
  | "dashboard"
  | "tenant_settings"
  | "alerts_&_notification"
  | "organization_&_tenant"
  | "monitoring_&_audit"
  | "security_settings"
  | "customer_risk_monitoring";

type Action =
  | "get"
  | "create"
  | "read"
  | "update"
  | "delete"
  | "export"
  | "escalate";

interface Privilege {
  resource: string;
  actions: any[] | Record<string, boolean>;
}

interface User {
  privileges?: Privilege[];
}

export const usePermissions = () => {
  const { user } = useAuth();

  const hasPermission = (resource: Resource, action: Action): boolean => {
    if (!user) return false;
    if (!user.privileges || user.privileges.length === 0) return true;

    const privilege = user.privileges.find(
      (priv: Privilege) => priv.resource === resource,
    );

    if (!privilege || !privilege.actions) {
      return false;
    }

    const actions = privilege.actions;

    // Handle both array and object cases
    if (Array.isArray(actions)) {
      return actions.some(
        (actionObj: any) => actionObj && actionObj[action] === true,
      );
    } else {
      return actions[action] === true;
    }
  };

  // User Management Permissions
  const canCreateUser = hasPermission("user_management", "create");
  const canUpdateUser = hasPermission("user_management", "update");

  // Case Management Permissions
  const canCreateCase = hasPermission("case_management", "create");
  const canExportCase = hasPermission("case_management", "export");
  const canEditCase = hasPermission("case_management", "update");
  const canEscalateCase = hasPermission("case_management", "escalate");

  // RBAC Permissions
  const canCreateRBAC = hasPermission("rbac_management", "create");
  const canUpdateRBAC = hasPermission("rbac_management", "update");
  const canDeleteRBAC = hasPermission("rbac_management", "delete");

  // Geolocation Permissions
  const canEditGEO = hasPermission("geolocation_compliance", "update");
  const canExportGEO = hasPermission("geolocation_compliance", "export");

  // Watchlist Screening Permissions
  const canUpdateWatchlist = hasPermission("watchlist_screening", "update");
  const canExportWatchlist = hasPermission("watchlist_screening", "export");

  // Dashboard Permissions
  const canExportDasboard = hasPermission("dashboard", "export");

  // Customer Risk Profile Permissions
  const canUpdateCRPC = hasPermission("customer_risk_monitoring", "update");
  const canExportCRPC = hasPermission("customer_risk_monitoring", "export");

  // KYC Verification

  const canUpdateKYC = hasPermission("kyc_verification", "update");

  // Security Permissions
  const canGetSecurity = hasPermission("security_settings", "get");

  return {
    // Generic permission checker
    hasPermission,

    // User Management
    canCreateUser,
    canUpdateUser,

    // Case Management
    canCreateCase,
    canExportCase,
    canEditCase,
    canEscalateCase,

    // RBAC
    canCreateRBAC,
    canUpdateRBAC,
    canDeleteRBAC,

    // Geolocation
    canEditGEO,
    canExportGEO,

    // Watchlist Screening
    canUpdateWatchlist,
    canExportWatchlist,

    //Dashboard
    canExportDasboard,

    //Customer Risk Profile
    canUpdateCRPC,
    canExportCRPC,

    // KYC
    canUpdateKYC,

    //Security Settings
    canGetSecurity,
  };
};
