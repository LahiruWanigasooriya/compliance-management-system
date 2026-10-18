'use server';

import axios from 'axios';
import { cookies } from 'next/headers';
import type { Response } from '@/types/response.types';
import type { TrustedDevice } from '@/types/profile.types';
import { convertObjectKeysToCamelCase } from '@/utils/convertObjectKeysToCamelCase';
import { auth, createServerAxios } from '@/utils/axios_server';
import { APPLICATION } from '@/constants/application';

export interface VerifyDevicePayload {
  otp: string;
  verificationToken: string;
  trust_device: boolean;
}

interface VerifyDeviceApiResponse {
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}

/**
 * Verify device OTP and optionally trust the device
 * Note: This is part of the login flow and happens BEFORE the user has a session,
 * so we make a direct API call without requiring authentication
 */
export async function handleVerifyDevice(
  payload: VerifyDevicePayload
): Promise<Response<VerifyDeviceApiResponse | null>> {
  try {
    // Get tenant ID from cookies (set during login) or use fallback for localhost
    const allCookies = await cookies();
    const tenantIdCookie = allCookies.get('X-Tenant-ID');
    const tenantId = tenantIdCookie?.value ;

    const response = await axios.post(
      `${APPLICATION.BASE_URL}/api/v1/auth/device/verify`,
      {
        otp: payload.otp,
        verification_token: payload.verificationToken,
        trust_device: payload.trust_device,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-ID': tenantId,
        },
      }
    );

    const camelCasedData = convertObjectKeysToCamelCase(
      response.data.data ?? response.data
    );

    return {
      success: true,
      data: camelCasedData as VerifyDeviceApiResponse,
      message: 'Device verified successfully',
    };
  } catch (error) {
    console.error('Error verifying device:', error);

    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Failed to verify device',
    };
  }
}

/**
 * Get list of trusted devices
 */
export async function getTrustedDevices(): Promise<
  Response<TrustedDevice[] | null>
> {
  try {
      const session = await auth()

    console.log("Session in getSupportedFiltersAndCountries:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get('/api/v1/auth/device/list');

    // Extract the data from the response
    const rawData = response.data.data ?? response.data;

    // Handle if rawData is already an array
    if (Array.isArray(rawData)) {
      const camelCasedData = rawData.map((item) =>
        convertObjectKeysToCamelCase(item)
      );
      return {
        success: true,
        data: camelCasedData as TrustedDevice[],
        message: 'Trusted devices fetched successfully',
      };
    }

    // Handle if rawData is an object containing an array
    const camelCasedData = convertObjectKeysToCamelCase(rawData);

    // Try to extract array from common response patterns
    const devices = camelCasedData?.devices ??
      camelCasedData?.trustedDevices ??
      camelCasedData?.data ??
      [];

    return {
      success: true,
      data: Array.isArray(devices) ? devices : [],
      message: 'Trusted devices fetched successfully',
    };
  } catch (error) {
    console.error('Error fetching trusted devices:', error);

    return {
      success: false,
      data: null,
      message:
        error instanceof Error
          ? error.message
          : 'Failed to fetch trusted devices',
    };
  }
}

/**
 * Remove a trusted device
 */
export async function removeTrustedDevice(
  deviceId: string
): Promise<Response<null>> {
  try {
      const session = await auth()

    console.log("Session in getSupportedFiltersAndCountries:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.post('/api/v1/auth/device/remove', {
      device_id: deviceId,
    });

    return {
      success: true,
      data: null,
      message: response.data.message || 'Device removed successfully',
    };
  } catch (error) {
    console.error('Error removing trusted device:', error);

    return {
      success: false,
      data: null,
      message:
        error instanceof Error ? error.message : 'Failed to remove device',
    };
  }
}
