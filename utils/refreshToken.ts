import { APPLICATION } from "@/constants/application";
import axios from "axios";
import { cookies } from "next/headers";

/**
 * Refresh token and update cookie
 * Returns the new access token string
 */
export async function refreshTokenAndSetCookies(
  refreshToken: string,
  tenantId: string
): Promise<string> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("[REFRESH] Function invoked");
  console.log("[REFRESH] Inputs:", {
    hasRefreshToken: !!refreshToken,
    refreshTokenLength: refreshToken?.length,
    tenantId,
    timestamp: new Date().toISOString(),
  });

  try {
    console.log("[REFRESH] Preparing refresh request");
    console.log("[REFRESH] Endpoint:", `${APPLICATION.BASE_URL}/api/v1/auth/refresh`);

    const refreshResponse = await axios.post(
      `${APPLICATION.BASE_URL}/api/v1/auth/refresh`,
      { refresh_token: refreshToken },
      {
        headers: {
          "Content-Type": "application/json",
          "X-Tenant-ID": tenantId,
        },
      }
    );

    console.log("[REFRESH] HTTP request completed");
    console.log("[REFRESH] Response status:", refreshResponse.status);
    console.log("[REFRESH] Response keys:", Object.keys(refreshResponse.data || {}));

    const newAccessToken =
      refreshResponse.data?.access_token ||
      refreshResponse.data?.accessToken;

    console.log("[REFRESH] Extracted access token:", {
      exists: !!newAccessToken,
      length: newAccessToken?.length,
    });

    if (!newAccessToken) {
      console.error("[REFRESH] ❌ Access token missing in response");
      throw new Error("Refresh failed - no access token");
    }

    // Cookie update attempt
    try {
      console.log("[REFRESH] Attempting to set accessToken cookie");

      const cookieStore = await cookies();
      cookieStore.set({
        name: "accessToken",
        value: newAccessToken,
        path: "/",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 60 * 60,
      });

      console.log("[REFRESH]  Cookie set successfully");
    } catch (cookieError: any) {
      console.warn("[REFRESH]  Cookie write failed (non-fatal)", {
        message: cookieError?.message,
      });
    }

    console.log("[REFRESH] Returning new access token");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

    return newAccessToken;
  } catch (refreshError: any) {
    console.error("[REFRESH] ❌ Refresh flow failed", {
      message: refreshError?.message,
      status: refreshError?.response?.status,
      data: refreshError?.response?.data,
    });

    // Explicit session-expiry signal
    if (refreshError?.response?.status === 401) {
      console.error("[REFRESH] Refresh token expired → forcing logout");
      const sessionError = new Error("SESSION_EXPIRED::LOGOUT_NOW");
      sessionError.name = "SESSION_EXPIRED";
      throw sessionError;
    }

    throw refreshError;
  }
}
