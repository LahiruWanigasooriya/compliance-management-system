// Privilege action types
export interface PrivilegeActions {
  get: boolean;
  create: boolean;
  delete: boolean;
  update: boolean;
}

// Individual privilege definition
export interface Privilege {
  name_of_manage: string;
  actions: PrivilegeActions[];
}

// Role information
export interface Role {
  id: string;
  tenantId: string;
  roleName: string;
  privileges: string; // JSON string of Privilege[]
  createdAt: string;
  updatedAt: string;
}

// Parsed privileges (for convenience when working with the data)
export interface ParsedRole extends Omit<Role, "privileges"> {
  privileges: Privilege[];
}

// Main profile API response
export interface ProfileApiResponse {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  phone: string;
  image: string;
  roleId: string;
  role: Role;
  status: "active" | "pending" | "inactive";
  riskLevel: "low" | "medium" | "high";
  createdAt: string;
  updatedAt: string;
}

// Legacy - This matches the structure of your USER_PROFILE constant
export interface BackendUserProfile {
  image: string | null;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  phone: string;
  status: "active" | "pending" | "inactive";
}

// This is the state interface for our Form
export interface UserProfileState {
  userId: string; // generated or static
  username: string; // derived or static
  firstName: string;
  lastName: string;
  email: string;
  contactNumber: string;
  status: string;
  role: string;
  profileImage: string | null;
}

export interface LoginSession {
  id: string;
  userId: string;
  username: string;
  ipAddress: string;
  userAgent: string;
  loginTime: string;
  statusCode: number;
  success: boolean;
  location?: string;
}

export interface LoginSessionsApiResponse {
  count: number;
  sessions: LoginSession[];
}

export interface UserPreferences {
  id?: string;
  userId?: string;
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MfaMethod {
  id: string;
  methodType: string;
  identifier?: string;
  isVerified: boolean;
  isPrimary: boolean;
  createdAt: string;
}

export interface MfaMethodsResponse {
  methods: MfaMethod[];
}

export interface TrustedDevice {
  id: string;
  deviceName: string;
  ipAddress: string;
  lastIpAddress: string;
  location: string;
  lastLocation: string;
  isTrusted: boolean;
  lastUsedAt: string;
  loginCount: number;
  createdAt: string;
}

export interface NotificationChannel {
  id: string;
  label: string;
  enabled: boolean;
}

export interface NotificationFrequency {
  id: string;
  label: string;
  description: string;
}

export interface NotificationPreferences {
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  notificationFrequency: string;
}

export interface NotificationPreferencesApiResponse {
  availableChannels: NotificationChannel[];
  availableFrequencies: NotificationFrequency[];
  currentFrequency: string;
  preferences: NotificationPreferences;
}

export interface UpdateProfileData {
  phone: string;
}

export interface UpdatePreferencesData {
  language: string;
  timezone: string;
  dateFormat: string;
  numberFormat?: string;
}

export interface ChangePasswordData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UpdateNotificationPreferencesData {
  emailNotifications: boolean;
  smsNotifications: boolean;
  inAppNotifications: boolean;
  notificationFrequency: string;
}
