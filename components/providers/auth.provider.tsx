/* eslint-disable react-hooks/set-state-in-effect */
"use client";
// NOTE : Temporary auth provider until NextAuth is fully integrated
import React, { createContext, useState, useEffect } from "react";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { UserType, USER_TYPES } from "@/constants/application";
import {
  getUserType as getSubdomainUserType,
  getTenantId,
} from "@/utils/functions";
import { logoutUser } from "@/actions/user.actions";
import { LOCAL_STORAGE_KEYS_TO_REMOVE } from "@/constants/auth.constants";
import { toast } from "sonner";

type AuthContextType = {
  user: User | null;
  userType: UserType;
  isSystemUser: boolean;
  signIn: (accessToken: string, refreshToken: string, user: User) => void;
  signOut: () => Promise<void>;
};

const initialState: AuthContextType = {
  user: null,
  userType: USER_TYPES.TENANT,
  isSystemUser: false,
  signIn: () => {},
  signOut: async () => {},
};

interface PrivilegeAction {
  create?: boolean;
  get?: boolean;
  update?: boolean;
  delete?: boolean;
  approve?: boolean;
  export?: boolean;
  query?: boolean;
  escalate?: boolean;
}

export type User = {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  phone: string;
  role_id: string;
  role_name: string;
  role?: string;
  status: string;
  risk_level: string;
  user_type?: UserType; // 'system' or 'tenant'
  profile_image?: string;
  privileges?: Array<{
    resource: string;
    actions: PrivilegeAction[];
  }>;
};

export const AuthContext = createContext<AuthContextType>(initialState);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userType, setUserType] = useState<UserType>(USER_TYPES.TENANT);
  const router = useRouter();

  useEffect(() => {
    // Determine user type from subdomain on mount
    const subdomainUserType = getSubdomainUserType();
    setUserType(subdomainUserType);

    // Load stored user data
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser) as User;
      setUser(parsedUser);
      // Override with user's actual type from backend if available
      if (parsedUser.user_type) {
        setUserType(parsedUser.user_type);
      }
    }
  }, []);

  const signIn = (
    accessToken: string,
    refreshToken: string,
    userData: User,
  ) => {
    // Determine user type: prefer backend response, fall back to subdomain detection
    const effectiveUserType = userData.user_type || getSubdomainUserType();

    let userWithType: User = {
      ...userData,
      user_type: effectiveUserType,
    };

    if (effectiveUserType === USER_TYPES.TENANT && userData.privileges) {
      userWithType = {
        ...userWithType,
        privileges: userData.privileges.map((privilege) => {
          // Handle both cases: actions could be an array or an object
          const actionsArray = Array.isArray(privilege.actions)
            ? privilege.actions
            : [privilege.actions as PrivilegeAction];

          return {
            resource: privilege.resource,
            actions: actionsArray.map((action: PrivilegeAction) => ({
              // Ensure get is true if not explicitly false
              get: action.get === false ? false : true,
              // Keep all other actions as they are
              create: action.create || false,
              update: action.update || false,
              delete: action.delete || false,
              approve: action.approve || false,
              export: action.export || false,
              query: action.query || false,
              escalate: action.escalate || false,
            })),
          };
        }),
      };
    }

    setUser(userWithType);
    setUserType(effectiveUserType);

    // Set cookies with path to ensure they're accessible across the app
    Cookies.set("accessToken", accessToken, { path: "/" });
    Cookies.set("refreshToken", refreshToken, { path: "/" }); // Server-side auth() reads this
    Cookies.set("X-User-Type", effectiveUserType, { path: "/" });
    Cookies.set("X-User-ID", userData.id, { path: "/" });

    // Set tenant ID cookie for tenant users, remove for system users
    const tenantId = getTenantId() || userData.tenant_id;
    if (effectiveUserType === USER_TYPES.SYSTEM) {
      // Must specify path to match how the cookie was set
      Cookies.remove("X-Tenant-ID", { path: "/" });
    } else if (tenantId) {
      Cookies.set("X-Tenant-ID", tenantId, { path: "/" });
    }

    localStorage.setItem("refreshToken", refreshToken);
    localStorage.setItem("user", JSON.stringify(userWithType));
  };

  const signOut = async () => {
    try {
      const result = await logoutUser();

      if (result.success) {
        LOCAL_STORAGE_KEYS_TO_REMOVE.forEach((item) => {
          localStorage.removeItem(item);
        });

        sessionStorage.clear();
        
        // Clear client-side cookies (in case there are any not cleared by server)
        Cookies.remove("accessToken", { path: "/" });
        Cookies.remove("refreshToken", { path: "/" });
        Cookies.remove("X-User-Type", { path: "/" });
        Cookies.remove("X-Tenant-ID", { path: "/" });
        Cookies.remove("X-User-ID", { path: "/" });
        setUser(null);
        setUserType(getSubdomainUserType());
        
        // Only redirect on success
         window.location.replace("/login");
          toast.success("Logout Successfully.");
      } else {
        // Show specific error message
        toast.error(result.message || "Logout failed. Please try again.");
      

      }
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed");
    }
  };

  const isSystemUser = userType === USER_TYPES.SYSTEM;

  return (
    <AuthContext.Provider
      value={{ user, userType, isSystemUser, signIn, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
