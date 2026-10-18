export const PASSWORD_REQUIREMENTS = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 12,
  REQUIRE_UPPERCASE: "(?=.*[A-Z])",
  REQUIRE_LOWERCASE: "(?=.*[a-z])",
  REQUIRE_NUMBERS: String.raw`(?=.*\d)`,
  SPECIAL_CHARS: String.raw`(?=.*[!@#$%^&*()_+\-=[\]{}|;:,.<>?])`,
  NO_SPACES: String.raw`(?!.*\s)`,
} as const;

export const PASSWORD_REGEX = new RegExp(
  `^${PASSWORD_REQUIREMENTS.REQUIRE_UPPERCASE}` +
    `${PASSWORD_REQUIREMENTS.REQUIRE_LOWERCASE}` +
    `${PASSWORD_REQUIREMENTS.REQUIRE_NUMBERS}` +
    `${PASSWORD_REQUIREMENTS.SPECIAL_CHARS}` +
    `${PASSWORD_REQUIREMENTS.NO_SPACES}` +
    String.raw`\S{${PASSWORD_REQUIREMENTS.MIN_LENGTH},${PASSWORD_REQUIREMENTS.MAX_LENGTH}}$`
);

export const LOCAL_STORAGE_KEYS_TO_REMOVE = [
  "refreshToken",
  "user",
  "mfa_verify_timer_end",
  "mfa_verify_current_step",
  "IsDoneMfaVerifyTimer",
  "reset_password_otp_timer_end",
  "mfa_setup_current_step",
  "forgot_password_current_step",
  "device_fingerprint",
  "IsDonePasswordResetTimer",
  "IsDoneMfaSetupTimer",
  "user_timezone"
] as const;