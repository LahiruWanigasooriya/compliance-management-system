import { RolesApiResponse } from "@/types/user.types";
import axiosInstance from "@/utils/axios";
import { convertObjectKeysToCamelCase } from "@/utils/convertObjectKeysToCamelCase";
import type { Response } from "@/types/response.types";
import { getDeviceFingerprint } from "@/utils/deviceFingerprint";

// Registration - Create new user via unified users endpoint
// Note: X-Tenant-ID or X-User-Type headers are handled by the axios interceptor
export const registerUser = async (
  email: string,
  full_name: string,
  phone: string,
  role_id: string
) => {
  const response = await axiosInstance.post(
    "api/v1/users",
    { email, full_name, phone, role_id }
  );
  return response.data;
};

// Login - Single endpoint handles both system and tenant users
// The axios interceptor sets X-User-Type header for system users
// The gateway middleware allows system users through without tenant ID
export const loginUser = async (
  email: string,
  password: string
) => {
  try {
    // Get the device fingerprint to uniquely identify this device
    const device_fingerprint = getDeviceFingerprint();

    const response = await axiosInstance.post(
      "api/v1/auth/login",
      { email, password, device_fingerprint }
    );
    return { success: true, data: response };
  } catch (error) {
    // Re-throw the error so it can be caught in the component
    throw error;
  }
};

// MFA Setup - Initiate
export const initiateMfaSetup = async (mfa_setup_token: string) => {
  const response = await axiosInstance.post("api/v1/mfa/setup/initiate", {
    mfa_setup_token,
  });
  return response.data;
};

// MFA Setup - Get Methods
export const getMfaSetupMethods = async () => {
  const response = await axiosInstance.get("api/v1/mfa/setup/methods");
  return response.data;
};

// MFA Setup - Email
export const setupMfaEmail = async (session_token: string, email: string) => {
  const response = await axiosInstance.post("api/v1/mfa/setup/email", {
    session_token,
    email,
  });
  return response.data;
};

// MFA Setup - TOTP
export const setupMfaTotp = async (session_token: string) => {
  const response = await axiosInstance.post("api/v1/mfa/setup/totp", {
    session_token
  });
  return response.data;
};

// MFA Setup - Verify
export const verifyMfaSetup = async (
  session_token: string,
  method_id: string,
  code: string
) => {
  const response = await axiosInstance.post("api/v1/mfa/setup/verify", {
    session_token,
    method_id,
    code,
  });
  return response.data;
};

// MFA Setup - Complete
export const completeMfaSetup = async (session_token: string) => {
  const response = await axiosInstance.post("api/v1/mfa/setup/complete", {
    session_token,
  });
  return response.data;
};

// MFA - Send Code
export const sendMfaCode = async (
  mfa_session_token: string,
  method_id?: string
) => {
  const response = await axiosInstance.post("api/v1/mfa/send-code", {
    mfa_session_token,
    method_id,
  });
  return response.data;
};

// MFA - Verify Login
export const verifyMfaLogin = async (
  mfa_session_token: string,
  code: string,
  use_backup_code: boolean = false
) => {
  const response = await axiosInstance.post("api/v1/mfa/verify-login", {
    mfa_session_token,
    code,
    use_backup_code,
  });
  return response.data;
};

// Device Verification - Verify device during login flow
export const verifyDevice = async (
  otp: string,
  verification_token: string,
  trust_device: boolean = true
) => {
  // Include device fingerprint so backend can associate verification with this device
  const device_fingerprint = getDeviceFingerprint();

  const response = await axiosInstance.post("api/v1/auth/device/verify", {
    otp,
    verification_token,
    trust_device,
    device_fingerprint,
  });
  return response.data;
};

// forget password
// Note: X-Tenant-ID or X-User-Type headers are handled by the axios interceptor
export const forgetPassword = async (email: string) => {
  const response = await axiosInstance.post(
    "api/v1/auth/password/forgot",
    { email }
  );
  return response.data;
};

export const verifyOtp = async (email: string, otp: string) => {
  const response = await axiosInstance.post(
    "api/v1/auth/password/verify-otp",
    { email, otp }
  );
  return response.data;
};


export const resetPassword = async (
  email: string,
  reset_token: string,
  new_password: string,
  confirm_password: string
) => {
  const response = await axiosInstance.post(
    "api/v1/auth/password/reset",
    { email, reset_token, new_password, confirm_password }
  );
  return response.data;
};


export const setupPassword = async (token: string, new_password: string) => {
  const response = await axiosInstance.post(
    "api/v1/auth/setup-password",
    { token, new_password }
  );
  return response.data;
};



/**
 * Server action to get all roles
 */
export async function getRoles(): Promise<Response<RolesApiResponse | null>> {
  try {
    const response = await axiosInstance.get("/api/v1/roles");

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data
    );

    return {
      success: true,
      data: (camelCasedData as RolesApiResponse) ?? null,
      message: "Roles fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching roles:", error);

    return {
      success: false,
      data: null,
      message: error instanceof Error ? error.message : "Failed to fetch roles",
    };
  }
}