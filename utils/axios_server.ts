import { APPLICATION, USER_TYPES, UserType } from "@/constants/application";
import axios from "axios";
import { cookies, headers } from "next/headers";
import { refreshTokenAndSetCookies } from "./refreshToken";

// Environment suffixes used across different deployment environments
const ENV_SUFFIXES = ["-dev", "-qa", "-staging", "-uat", "-prod"];
const SYSTEM_SUBDOMAIN = "console";

/**
 * Strips environment suffix from subdomain
 */
function stripEnvironmentSuffix(subdomain: string): string {
  for (const suffix of ENV_SUFFIXES) {
    if (subdomain.endsWith(suffix)) {
      return subdomain.slice(0, -suffix.length);
    }
  }
  return subdomain;
}

/**
 * Extracts subdomain from hostname (server-side)
 */
function getSubdomainFromHost(host: string): string {
  const hostname = host.split(":")[0]; // Remove port
  const parts = hostname.split(".");
  if (parts.length < 3) return "";
  if (parts.length === 3) return parts[0];
  return parts.slice(0, parts.length - 2).join(".");
}

/**
 * Detects user type and tenant ID from request headers (server-side)
 * Returns { userType, tenantId }
 *
 * Supports AWS Amplify + Cloudflare setup:
 * - Cloudflare: preserves host, may set x-forwarded-host
 * - AWS Amplify: sets x-forwarded-host, x-original-host
 * - origin header: contains the full URL origin
 */
async function detectFromHeaders(): Promise<{
  userType: UserType;
  tenantId: string;
}> {
  try {
    const headersList = await headers();

    // Try multiple headers in order of preference
    // AWS Amplify/Cloudflare may use different headers
    const xForwardedHost = headersList.get("x-forwarded-host");
    const xOriginalHost = headersList.get("x-original-host");
    const host = headersList.get("host");
    const origin = headersList.get("origin");

    // Extract hostname from origin (e.g., "https://console-dev.vesant.ai" -> "console-dev.vesant.ai")
    let originHost = "";
    if (origin) {
      try {
        originHost = new URL(origin).hostname;
      } catch {
        // Invalid origin URL
      }
    }

    // Priority: x-forwarded-host > x-original-host > origin hostname > host
    const effectiveHost =
      xForwardedHost || xOriginalHost || originHost || host || "";

    console.log("🔍 [SERVER] Header detection:", {
      "x-forwarded-host": xForwardedHost,
      "x-original-host": xOriginalHost,
      host: host,
      origin: origin,
      originHost: originHost,
      effectiveHost: effectiveHost,
    });

    const subdomain = getSubdomainFromHost(effectiveHost);
    const baseSubdomain = stripEnvironmentSuffix(subdomain);

    console.log("🔍 [SERVER] Subdomain detection:", {
      subdomain,
      baseSubdomain,
      isConsole: baseSubdomain === SYSTEM_SUBDOMAIN,
    });

    // Check if system console
    if (baseSubdomain === SYSTEM_SUBDOMAIN) {
      return { userType: USER_TYPES.SYSTEM, tenantId: "" };
    }

    // For tenant users, the subdomain IS the tenant identifier
    // Backend will look up the actual tenant ID using this subdomain
    return { userType: USER_TYPES.TENANT, tenantId: baseSubdomain };
  } catch (error) {
    console.error("🔍 [SERVER] Header detection error:", error);
    return { userType: USER_TYPES.TENANT, tenantId: "" };
  }
}

//Get user privileges from cookies (stored after login)
async function getUserPrivileges(): Promise<any[] | null> {
  try {
    const allCookies = await cookies();
    const userCookie = allCookies.get("user");

    if (!userCookie?.value) {
      return null;
    }

    const userData = JSON.parse(userCookie.value);
    if (userData.privileges && Array.isArray(userData.privileges)) {
      return userData.privileges;
    }
  } catch (error) {
    console.error(
      "🔍 [SERVER] Failed to parse user privileges from cookie:",
      error,
    );
  }

  return null;
}

/**
 * returns access token and refresh token from the server
 * simply interprets as nextauth auth function
 */
export async function auth() {
  const allCookies = await cookies();

  const accessToken = allCookies.get("accessToken");
  const refreshToken = allCookies.get("refreshToken");
  const tenant_id_cookie = allCookies.get("X-Tenant-ID");
  const user_type_cookie = allCookies.get("X-User-Type");
  const user_id_cookie = allCookies.get("X-User-ID");

  // Detect user type and tenant from request headers (subdomain)
  const detected = await detectFromHeaders();

  // Determine effective user type: cookie > headers detection > fallback to tenant
  const effectiveUserType =
    (user_type_cookie?.value as UserType) || detected.userType;
  const isSystemUser = effectiveUserType === USER_TYPES.SYSTEM;

  // Determine effective tenant ID:
  // - System users: use cookie (selected tenant from dropdown) or empty
  // - Tenant users: use subdomain detection, fallback to cookie, then APPLICATION.TENANT_ID for localhost
  let effectiveTenantId: string;
  if (isSystemUser) {
    // System users get tenant from cookie (tenant selector) or empty for cross-tenant
    effectiveTenantId = tenant_id_cookie?.value || "";
  } else {
    // Tenant users get tenant from subdomain, cookie, or localhost fallback
    effectiveTenantId =
      detected.tenantId || (tenant_id_cookie?.value as string);
  }

  // Get user privileges
  const privileges = await getUserPrivileges();

  console.log("🔍 [SERVER AUTH] Auth context:", {
    hasAccessToken: !!accessToken?.value,
    hasRefreshToken: !!refreshToken?.value,
    userType: effectiveUserType,
    tenantId: effectiveTenantId,
    detectedFromHeaders: detected,
    hasUserId: !!user_id_cookie?.value,
    hasPrivileges: !!privileges && privileges.length > 0,
    privilegeCount: privileges?.length || 0,
  });

  return {
    accessToken: accessToken?.value || null,
    refreshToken: refreshToken?.value || null,
    user: {
      id: user_id_cookie?.value || null,
      tenant_id: effectiveTenantId,
      user_type: effectiveUserType,
      privileges: privileges || [],
    },
  };
}

export function createServerAxios(
  accessToken: string,
  tenantId: string,
  userType: UserType = USER_TYPES.TENANT,
  userId?: string,
) {
  const isSystemUser = userType === USER_TYPES.SYSTEM;
  const effectiveTenantId = tenantId;

  console.log("[SERVER AXIOS] Creating instance:", {
    hasToken: !!accessToken,
    tokenLength: accessToken?.length,
    tenantId,
    effectiveTenantId,
    userType,
    isSystemUser,
    hasUserId: !!userId,
  });

  // Build headers based on user type
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${accessToken}`,
  };

  if (userId) {
    headers["X-User-ID"] = userId;
  }

  if (isSystemUser) {
    // System users: set X-User-Type and X-Tenant-ID if selected
    headers["X-User-Type"] = USER_TYPES.SYSTEM;
    if (effectiveTenantId) {
      headers["X-Tenant-ID"] = effectiveTenantId;
    }
  } else {
    // Tenant users: set X-Tenant-ID
    if (effectiveTenantId) {
      headers["X-Tenant-ID"] = effectiveTenantId;
    }
  }
  // headers["X-Tenant-ID"] = 'tnt_test_1769005832';

  const instance = axios.create({
    baseURL: APPLICATION.BASE_URL,
    headers,
  });

  // Add request interceptor to automatically fetch and add privileges from cookies
  instance.interceptors.request.use(async (config) => {
    try {
      // Fetch privileges from cookie for each request
      const allCookies = await cookies();
      const userCookie = allCookies.get("user");

      if (userCookie?.value) {
        const userData = JSON.parse(userCookie.value);
        if (userData.privileges && Array.isArray(userData.privileges)) {
          config.headers["X-User-Privileges"] = JSON.stringify(
            userData.privileges,
          );
        }
      }
    } catch (error) {
      console.error("[SERVER AXIOS] Failed to fetch privileges:", error);
    }

    return config;
  });

  // Add response interceptor for token refresh
  instance.interceptors.response.use(
    (response) => {
      console.log(
        " [SERVER RESPONSE SUCCESS]",
        response.status,
        response.config.url,
      );
      return response;
    },
    async (error) => {
      const originalRequest = error.config;

      console.log(" [SERVER ERROR]", {
        url: originalRequest?.url,
        status: error.response?.status,
        message: error.message,
      });

      // Handle 401 errors (expired tokens)
      if (error.response?.status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        // console.log(' [SERVER] 401 detected, attempting token refresh...');

        try {
          // Get fresh auth to get refresh token from cookies
          const allCookies = await cookies();
          const refreshToken = allCookies.get("refreshToken")?.value;

          // console.log(' [SERVER] Refresh token from cookies:', {
          //   exists: !!refreshToken,
          //   length: refreshToken?.length
          // });

          if (!refreshToken) {
            console.log(" [SERVER] No refresh token in cookies");
            throw new Error("SESSION_EXPIRED::LOGOUT_NOW");
          }

          // Call refresh endpoint with appropriate headers based on user type
          // Note: Token refresh is an auth action, so system users should NOT send X-Tenant-ID
          // console.log(' [SERVER] Calling /api/v1/auth/refresh...');
          const refreshHeaders: Record<string, string> = {
            "Content-Type": "application/json",
          };
          if (isSystemUser) {
            // System users: send X-User-Type only, NO X-Tenant-ID for auth actions
            refreshHeaders["X-User-Type"] = USER_TYPES.SYSTEM;
            console.log(
              " [SERVER] System user token refresh, not sending X-Tenant-ID",
            );
          } else if (effectiveTenantId) {
            // Tenant users: send X-Tenant-ID
            refreshHeaders["X-Tenant-ID"] = effectiveTenantId;
          }

          // const refreshResponse = await axios.post(
          //   `${APPLICATION.BASE_URL}/api/v1/auth/refresh`,
          //   { refresh_token: refreshToken },
          //   { headers: refreshHeaders }
          // );

          // console.log(' [SERVER] Refresh response:', {
          //   status: refreshResponse.status,
          //   hasData: !!refreshResponse.data
          // });

          // const newAccessToken = refreshResponse.data?.access_token ||
          //                       refreshResponse.data?.accessToken;

          //   if (newAccessToken) {
          //     console.log(' [SERVER] Got new access token, length:', newAccessToken.length);

          //     // Update the request with new token
          //     originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          //     // Retry the original request
          //     console.log(' [SERVER] Retrying original request...');
          //     return instance(originalRequest);
          //   } else {
          //     console.log(' [SERVER] No access token in refresh response');
          //     throw new Error('Refresh failed - no access token');
          //   }
          // } catch (refreshError: any) {
          //   console.log(' [SERVER] Refresh failed:', {
          //     message: refreshError.message,
          //     status: refreshError.response?.status
          //   });

          // Call the refresh token function to get a new access token
          console.log(" [SERVER] Calling refreshTokenAndSetCookies...");
          const newAccessToken = await refreshTokenAndSetCookies(
            refreshToken,
            tenantId,
          );

          console.log(" [SERVER] New access token received:", {
            tokenLength: newAccessToken.length,
            first50Chars: newAccessToken.substring(0, 50) + "...",
          });

          // Update the request with the new token
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

          // Check if refresh token is also expired (401 from refresh endpoint)
          // if (refreshError.response?.status === 401) {
          //   console.log(' [SERVER] Refresh token expired, triggering client-side redirect');
          //   // We can't redirect on server-side, but we can throw a specific error
          //   const redirectError = new Error('Session expired, please login again');
          //   redirectError.name = 'SESSION_EXPIRED';
          //   throw redirectError;
          // }

          // throw refreshError;

          // Debug: Log the updated header
          console.log(
            " [SERVER] Updated Authorization header:",
            originalRequest.headers.Authorization?.substring(0, 50) + "...",
          );

          // Retry the original request with the new access token
          console.log(" [SERVER] Retrying original request...");
          return instance(originalRequest);
        } catch (refreshError: any) {
          console.log(" [SERVER] Refresh failed:", refreshError.message);

          // Check if it's a session expired error
          if (
            refreshError.name === "SESSION_EXPIRED" ||
            refreshError.message.includes("SESSION_EXPIRED")
          ) {
            console.log(" [SERVER] Session expired, triggering logout");
            const redirectError = new Error("SESSION_EXPIRED::LOGOUT_NOW");
            redirectError.name = "SESSION_EXPIRED";
            throw redirectError;
          }
          throw refreshError;
        }
      }

      return Promise.reject(error);
    },
  );

  return instance;
}

// Helper to check if token was refreshed
export function wasTokenRefreshed(response: any): boolean {
  return response?.config?._retry === true;
}
