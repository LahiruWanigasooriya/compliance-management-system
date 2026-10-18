import axios from "axios";
import { APPLICATION, USER_TYPES } from "../constants/application";
import {
  getTenantId,
  isSystemConsole,
  getUserType,
  isLocalhost,
  getSubdomain,
  stripEnvironmentSuffix,
} from "./functions";
import Cookies from "js-cookie";
import { sessionExpiredLogout } from "@/lib/logout-client";
import { getDeviceFingerprint } from "./deviceFingerprint";

const PUBLIC_PATHS = [
  "/login",
  "/register",
  "/mfa-setup",
  "/mfa-verify",
  "/device-verify",
  "/favicon.ico",
  "/public",
  "/kyc-submit",
];

// Auth API paths where system users should NOT send X-Tenant-ID
const AUTH_API_PATHS = [
  "/api/v1/auth/login",
  "/api/v1/auth/register",
  "/api/v1/auth/refresh",
  "/api/v1/auth/mfa",
  "/api/v1/auth/device",
];

//NOTE :  <-- ONLY USE IN CLIENT SIDE CONTEXTS -->
const axiosInstance = axios.create({
  baseURL: APPLICATION.BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token and tenant headers
axiosInstance.interceptors.request.use(
  async (config) => {
    // Detect if we're on the server or client
    const isServer = typeof window === "undefined";

    const userTypeLocal = localStorage.getItem("devUserType");

    if (userTypeLocal) {
      config.headers["X-User-Type"] = userTypeLocal;
    }

    if (isServer) {
      throw new Error(
        "Axios request interceptor must not be called on server side",
      );
    }

    const accessToken = Cookies.get("accessToken");
    const userType = getUserType();
    const isSystem = userType === USER_TYPES.SYSTEM;

    // Check if this is an auth API path
    const isAuthPath = AUTH_API_PATHS.some((path) =>
      config.url?.includes(path),
    );

    // For system users (console.vesant.ai, console-dev.vesant.ai):
    // - Send X-User-Type header
    // - Do NOT send X-Tenant-ID for auth actions (login, register, refresh, etc.)
    // - Send X-Tenant-ID only if a tenant is selected AND it's not an auth path
    if (isSystem) {
      config.headers["X-User-Type"] = USER_TYPES.SYSTEM;

      if (isAuthPath) {
        // Auth actions for system users should never have X-Tenant-ID
        console.log("System user auth action, not sending X-Tenant-ID");
        delete config.headers["X-Tenant-ID"];
        // Also clear the cookie to prevent stale tenant ID from being used
        // Must specify path to match how the cookie was set
        Cookies.remove("X-Tenant-ID", { path: "/" });
      } else {
        // Non-auth actions: check if header is already explicitly set (e.g., "_system" for system settings)
        const explicitTenantId =
          config.headers["X-Tenant-ID"] || config.headers["x-tenant-id"];
        if (explicitTenantId) {
          // Header was explicitly set by the caller, respect it
          console.log("System user with explicit tenant ID:", explicitTenantId);
          config.headers["X-Tenant-ID"] = explicitTenantId;
          // Clean up lowercase version if present
          delete config.headers["x-tenant-id"];
        } else {
          // No explicit header, check cookie for selected tenant
          const selectedTenantId = Cookies.get("X-Tenant-ID");
          if (selectedTenantId) {
            console.log(
              "System user with selected tenant from cookie:",
              selectedTenantId,
            );
            config.headers["X-Tenant-ID"] = selectedTenantId;
          } else {
            console.log(
              "System user without tenant selection (cross-tenant access)",
            );
            delete config.headers["X-Tenant-ID"];
          }
        }
      }
    } else {
      // For tenant users (acme.vesant.ai, casino-a.vesant.ai, etc.):
      // - Send X-Tenant-ID with subdomain value (e.g., "acme", "casino-a")
      // - Backend will lookup actual tenant ID using this subdomain/slug
      // - APPLICATION.TENANT_ID is only used for localhost development
      const tenantIdFromUrl = getTenantId();
      const tenantId =
        tenantIdFromUrl || (isLocalhost() ? APPLICATION.TENANT_ID : "");

      if (tenantId) {
        console.log("Tenant user detected, sending X-Tenant-ID:", tenantId);
        config.headers["X-Tenant-ID"] = tenantId;
      } else {
        console.warn("No tenant ID available for tenant user");
      }
    }

    // Add authorization header if token exists
    if (accessToken) {
      config.headers["Authorization"] = `Bearer ${accessToken}`;
    }

    // Add device fingerprint header for device identification
    const deviceFingerprint = getDeviceFingerprint();
    if (deviceFingerprint) {
      config.headers["X-Device-Fingerprint"] = deviceFingerprint;
    }

    const excludedKeywords = [
      "/login",
      "/register",
      "/mfa-setup",
      "/mfa-verify",
      "/device-verify",
      "/forgot-password",
      "/setup-password",
    ];

    const isExcluded = excludedKeywords.some((keyword) =>
      config.url?.includes(keyword),
    );

    if (isExcluded) {
      delete config.headers["X-Tenant-ID"];
      delete config.headers["X-Tenant-Id"];
      delete config.headers["x-tenant-Id"];
    }

    // Add user ID from cookie if available
    const userId = Cookies.get("X-User-ID");
    if (userId) {
      config.headers["X-User-ID"] = userId;
    }

    // Add user privileges from localStorage if available
    try {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        const userData = JSON.parse(userStr);
        if (userData.privileges && Array.isArray(userData.privileges)) {
          config.headers["X-User-Privileges"] = JSON.stringify(
            userData.privileges,
          );
        }
      }
    } catch (error) {
      console.error("[CLIENT AXIOS] Failed to fetch privileges:", error);
    }

    // console.log("---------- Request Headers ----------", config.headers);
    // console.table(config.headers);
    // console.log("-------------------------------------");

    if (userTypeLocal !== "system") {
      const subdomain = getSubdomain();
      if (!subdomain) {
        console.warn("No subdomain found for tenant user");
        return config;
      }

      const baseSubdomain = stripEnvironmentSuffix(subdomain);
      config.headers["X-Tenant-ID"] = baseSubdomain;
    }

    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor to handle 401 and token refresh
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Check if error is 401 and we haven't retried yet
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      localStorage.getItem("refreshToken")
    ) {
      originalRequest._retry = true;

      console.log("Received 401, attempting token refresh...");

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        // Build headers based on user type
        // Note: Token refresh is an auth action, so system users should NOT send X-Tenant-ID
        const refreshHeaders: Record<string, string> = {
          "Content-Type": "application/json",
        };

        if (isSystemConsole()) {
          // System users: send X-User-Type only, NO X-Tenant-ID for auth actions
          refreshHeaders["X-User-Type"] = USER_TYPES.SYSTEM;
          console.log("System user token refresh, not sending X-Tenant-ID");
        } else {
          // Tenant users: send X-Tenant-ID from subdomain or localhost fallback
          const tenantIdFromUrl = getTenantId();
          const tenantId =
            tenantIdFromUrl || (isLocalhost() ? APPLICATION.TENANT_ID : "");
          if (tenantId) {
            refreshHeaders["X-Tenant-ID"] = tenantId;
          }
        }

        const refreshResponse = await axios.post(
          `${APPLICATION.BASE_URL}/api/v1/auth/refresh`,
          { refresh_token: refreshToken },
          { headers: refreshHeaders },
        );

        const session = refreshResponse.data;

        if (!session?.access_token) {
          console.log("No valid token after refresh, redirecting to login...");
          handleLogout();
          return Promise.reject(error);
        }

        // Store new tokens
        Cookies.set("accessToken", session.access_token);
        if (session.refresh_token) {
          localStorage.setItem("refreshToken", session.refresh_token);
        }

        // Retry original request with new token
        console.log("Retrying request with refreshed token...");
        originalRequest.headers["Authorization"] =
          `Bearer ${session.access_token}`;

        // Re-add privileges header after token refresh
        try {
          const userStr = localStorage.getItem("user");
          if (userStr) {
            const userData = JSON.parse(userStr);
            if (userData.privileges && Array.isArray(userData.privileges)) {
              originalRequest.headers["X-User-Privileges"] = JSON.stringify(
                userData.privileges,
              );
            }
          }
        } catch (error) {
          console.error("[CLIENT AXIOS] Failed to re-add privileges:", error);
        }

        return axiosInstance(originalRequest);
      } catch (refreshError) {
        console.log("Token refresh failed, redirecting to login...");
        handleLogout();
        return Promise.reject(refreshError);
      }
    }

    // Handle 403 Forbidden
    if (error.response?.status === 403) {
      console.log("Received 403 Forbidden:", error.response?.data?.error);
    }

    return Promise.reject(error);
  },
);

/**
 * Handles user logout by clearing tokens and redirecting to login
 */
function handleLogout() {
  const currentLocation = window.location.pathname;
  if (!PUBLIC_PATHS.includes(currentLocation)) {
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    // Must specify path to match how cookies were set
    Cookies.remove("accessToken", { path: "/" });
    Cookies.remove("refreshToken", { path: "/" });
    Cookies.remove("X-User-Type", { path: "/" });
    Cookies.remove("X-Tenant-ID", { path: "/" });
    Cookies.remove("X-User-ID", { path: "/" });
    sessionExpiredLogout();
    window.location.href = `/login?from=${encodeURIComponent(currentLocation)}`;
  }
}

export default axiosInstance;

// Export utility for checking if current context is system console
export { isSystemConsole, getUserType } from "./functions";
