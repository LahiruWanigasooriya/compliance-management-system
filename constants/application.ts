export const APPLICATION = {
  BASE_URL: process.env.NEXT_PUBLIC_BASE_URL || '',
  TENANT_ID: process.env.NEXT_PUBLIC_TENANT_ID || '',
};

// Environment suffixes for multi-environment deployments
export const ENV_SUFFIXES = ['-dev', '-qa', '-staging', '-uat', '-prod'] as const;

// System console subdomain prefix
export const SYSTEM_SUBDOMAIN = 'console';

// User types
export const USER_TYPES = {
  SYSTEM: 'system',
  TENANT: 'tenant',
} as const;

export type UserType = typeof USER_TYPES[keyof typeof USER_TYPES];
