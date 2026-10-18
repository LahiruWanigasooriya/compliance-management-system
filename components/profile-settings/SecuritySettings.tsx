"use client";

import React, { useEffect, useState } from "react";
import {
  Smartphone,
  Mail,
  Lock,
  Trash2,
  ShieldCheck,
  MapPin,
  Eye,
  EyeOff,
} from "lucide-react";
import { LoginSession, TrustedDevice } from "@/types/profile.types";
import {
  changePassword,
  getLoginSessions,
  getMfaMethods,
} from "@/actions/profile.actions";
import {
  getTrustedDevices,
  removeTrustedDevice,
} from "@/actions/security-settings.actions";
import { formatTimestampWithAMPM } from "@/utils/timeFormatterUTC";
import { Tooltip } from "../common/Tooltip";
import Loader from "../ui/loader/Loader";

const truncateText = (text: string, maxLength: number = 30): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + "...";
};

function formatDeviceName(userAgent?: string) {
  if (!userAgent) return "N/A";
  const ua = userAgent.toLowerCase();

  const browser =
    ua.includes("edg") || ua.includes("edge")
      ? "Edge"
      : ua.includes("chrome")
        ? "Chrome"
        : ua.includes("safari")
          ? "Safari"
          : ua.includes("firefox")
            ? "Firefox"
            : ua.includes("postmanruntime")
              ? "Postman"
              : "Unknown";

  const platform = ua.includes("windows")
    ? "Windows"
    : ua.includes("mac os") || ua.includes("macintosh")
      ? "macOS"
      : ua.includes("iphone")
        ? "iPhone"
        : ua.includes("ipad")
          ? "iPad"
          : ua.includes("android")
            ? "Android"
            : ua.includes("linux")
              ? "Linux"
              : "Unknown";

  if (browser === "Unknown" && platform === "Unknown") return "N/A";
  if (platform === "Unknown") return browser;
  if (browser === "Unknown") return platform;
  return `${browser} on ${platform}`;
}

export default function SecuritySettings() {
  // Password State
  const [passwords, setPasswords] = useState({
    current: "",
    new: "",
    confirm: "",
  });
  const [passError, setPassError] = useState("");
  const [passSuccess, setPassSuccess] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });

  // MFA State (Simulating Tenant Enabled)
  const [isTenantMfaEnabled, setIsTenantMfaEnabled] = useState(false);
  const [mfaMethods, setMfaMethods] = useState({
    app: false,
    email: false,
    sms: false,
    faceId: false,
  });
  const [mfaAvailable, setMfaAvailable] = useState({
    app: false,
    email: false,
    sms: false,
    faceId: false,
  });
  const [mfaError, setMfaError] = useState("");

  // Data Lists
  const [loginSessions, setLoginSessions] = useState<LoginSession[]>([]);
  const [isFetchingSessions, setIsFetchingSessions] = useState(false);
  const [sessionsError, setSessionsError] = useState("");
  const [trustedDevices, setTrustedDevices] = useState<TrustedDevice[]>([]);
  const [isLoadingDevices, setIsLoadingDevices] = useState(true);
  const [devicesError, setDevicesError] = useState("");
  const [removingDeviceId, setRemovingDeviceId] = useState<string | null>(null);
  const [removeSuccess, setRemoveSuccess] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  // Fetch trusted devices on mount
  useEffect(() => {
    const fetchTrustedDevices = async () => {
      setIsLoadingDevices(true);
      setDevicesError("");

      try {
        const result = await getTrustedDevices();

        if (result.success && result.data) {
          // Ensure data is an array
          const devices = Array.isArray(result.data) ? result.data : [];
          setTrustedDevices(devices);
        } else {
          setDevicesError(result.message || "Failed to load trusted devices");
          setTrustedDevices([]);
        }
      } catch (error) {
        console.error("Error fetching trusted devices:", error);
        setDevicesError("An unexpected error occurred while loading devices");
        setTrustedDevices([]);
      } finally {
        setIsLoadingDevices(false);
      }
    };

    fetchTrustedDevices();
  }, []);
  const [isFetchingMfa, setIsFetchingMfa] = useState(false);

  useEffect(() => {
    const fetchMfaMethods = async () => {
      setIsFetchingMfa(true);
      setMfaError("");
      try {
        const result = await getMfaMethods();
        if (
          result.success &&
          result.data &&
          Array.isArray(result.data.methods)
        ) {
          const availability = {
            app: false,
            email: false,
            sms: false,
            faceId: false,
          };
          const active = {
            app: false,
            email: false,
            sms: false,
            faceId: false,
          };

          result.data.methods.forEach((method) => {
            const type = (method.methodType || "").toLowerCase();
            if (type === "totp") {
              availability.app = true;
              active.app = method.isVerified;
            } else if (type === "email") {
              availability.email = true;
              active.email = method.isVerified;
            } else if (type === "sms") {
              availability.sms = true;
              active.sms = method.isVerified;
            } else if (type === "faceid" || type === "face_id") {
              availability.faceId = true;
              active.faceId = method.isVerified;
            }
          });

          setMfaAvailable(availability);
          setMfaMethods(active);
          setIsTenantMfaEnabled(result.data.methods.length > 0);
        } else {
          setMfaError(result.message || "Failed to load MFA methods.");
        }
      } catch (error) {
        setMfaError("Failed to load MFA methods.");
      } finally {
        setIsFetchingMfa(false);
      }
    };

    const fetchLoginSessions = async () => {
      setIsFetchingSessions(true);
      setSessionsError("");

      try {
        const result = await getLoginSessions();

        if (result.success && result.data) {
          const sessions = Array.isArray(result.data.sessions)
            ? result.data.sessions
            : [];

          const sortedSessions = [...sessions].sort(
            (a, b) =>
              (new Date(b.loginTime || "").getTime() || 0) -
              (new Date(a.loginTime || "").getTime() || 0),
          );

          setLoginSessions(sortedSessions);
        } else {
          setSessionsError(result.message || "Failed to fetch login activity.");
        }
      } catch (error) {
        setSessionsError("Failed to fetch login activity.");
      } finally {
        setIsFetchingSessions(false);
      }
    };

    fetchLoginSessions();
    fetchMfaMethods();
  }, []);

  // --- Handlers ---

  const handlePasswordChange = async () => {
    setPassError("");
    setPassSuccess("");

    // Client-side validation
    if (!passwords.current || !passwords.new || !passwords.confirm) {
      setPassError("All fields are required");
      return;
    }

    // Policy Validation: Min 12, 1 Cap, 1 Special
    const policy = /^(?=.*[A-Z])(?=.*[!@#$&*])(?=.*[0-9].*).{12,}$/;
    if (!policy.test(passwords.new)) {
      setPassError(
        "Password must be 12+ chars, include 1 Capital letter & 1 Special character.",
      );
      return;
    }

    if (passwords.new !== passwords.confirm) {
      setPassError("New passwords do not match.");
      return;
    }

    setIsChangingPassword(true);

    try {
      const result = await changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
        confirmPassword: passwords.confirm,
      });

      if (result.success) {
        setPassSuccess(result.message || "Password changed successfully");
        setPasswords({ current: "", new: "", confirm: "" });
      } else {
        setPassError(result.message || "Failed to change password");
      }
    } catch (error) {
      setPassError("An unexpected error occurred. Please try again.");
    } finally {
      setIsChangingPassword(false);
    }
  };

  const removeDevice = async (id: string) => {
    setRemoveError("");
    setRemoveSuccess("");
    setRemovingDeviceId(id);

    try {
      const result = await removeTrustedDevice(id);

      if (result.success) {
        setRemoveSuccess(result.message || "Device removed successfully");
        // Remove device from local state
        setTrustedDevices(trustedDevices.filter((d) => d.id !== id));
        // Clear success message after 3 seconds
        setTimeout(() => setRemoveSuccess(""), 3000);
      } else {
        setRemoveError(result.message || "Failed to remove device");
      }
    } catch (error) {
      console.error("Error removing device:", error);
      setRemoveError("An unexpected error occurred while removing the device");
    } finally {
      setRemovingDeviceId(null);
    }
  };

  // Helper function to render trusted devices content
  const renderTrustedDevicesContent = () => {
    if (isLoadingDevices) {
      return (
        <div className="flex justify-center items-center py-8">
          <div className="text-sm text-muted-foreground">
            Loading trusted devices...
          </div>
        </div>
      );
    }

    if (trustedDevices.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Smartphone className="w-12 h-12 text-muted-foreground mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">
            No trusted devices found
          </p>
        </div>
      );
    }

    return (
      <div className="space-y-3">
        {trustedDevices.map((device) => {
          const isRemoving = removingDeviceId === device.id;
          return (
            <div
              key={device.id}
              className="flex items-center justify-between p-3 border border-panel-border rounded-lg bg-gray-50 dark:bg-gray-800"
            >
              <div className="flex items-center overflow-hidden">
                <Smartphone className="w-8 h-8 p-1.5 bg-card border border-panel-border rounded-full text-muted-foreground mr-3 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {device.deviceName}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Last used: {new Date(device.lastUsedAt).toLocaleString()} (UTC)
                  </p>
                </div>
              </div>
              <button
                onClick={() => setConfirmDeleteId(device.id)}
                disabled={isRemoving}
                className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 p-2 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-full transition-colors cursor-pointer flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
                title={isRemoving ? "Removing..." : "Remove Device"}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* 1. Change Password Section */}
      <section className="bg-card p-4 sm:p-6 rounded-xl border border-panel-border shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center">
          <Lock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-muted-foreground" />{" "}
          Change Password
        </h3>

        {passSuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-xs sm:text-sm">
            {passSuccess}
          </div>
        )}
        {passError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-xs sm:text-sm">
            {passError}
          </div>
        )}

        {/* Mobile: 1 Column, Desktop: 3 Columns */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Current Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.current ? "text" : "password"}
                placeholder="Current Password"
                value={passwords.current}
                onChange={(e) =>
                  setPasswords({ ...passwords, current: e.target.value })
                }
                className="p-2 pr-10 text-sm sm:text-base border border-panel-border rounded focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none w-full bg-card text-foreground placeholder:text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    current: !prev.current,
                  }))
                }
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={
                  showPasswords.current ? "Hide password" : "Show password"
                }
              >
                {showPasswords.current ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              New Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.new ? "text" : "password"}
                placeholder="New Password "
                value={passwords.new}
                onChange={(e) =>
                  setPasswords({ ...passwords, new: e.target.value })
                }
                className="p-2 pr-10 text-sm sm:text-base border border-panel-border rounded focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none w-full bg-card text-foreground placeholder:text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    new: !prev.new,
                  }))
                }
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={showPasswords.new ? "Hide password" : "Show password"}
              >
                {showPasswords.new ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <input
                type={showPasswords.confirm ? "text" : "password"}
                placeholder="Confirm Password"
                value={passwords.confirm}
                onChange={(e) =>
                  setPasswords({ ...passwords, confirm: e.target.value })
                }
                className="p-2 pr-10 text-sm sm:text-base border border-panel-border rounded focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none w-full bg-card text-foreground placeholder:text-sm"
              />
              <button
                type="button"
                onClick={() =>
                  setShowPasswords((prev) => ({
                    ...prev,
                    confirm: !prev.confirm,
                  }))
                }
                className="absolute inset-y-0 right-2 flex items-center text-muted-foreground hover:text-foreground"
                aria-label={
                  showPasswords.confirm ? "Hide password" : "Show password"
                }
              >
                {showPasswords.confirm ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        </div>
        <div className="mt-4 flex flex-col sm:flex-row justify-end">
          <button
            onClick={handlePasswordChange}
            disabled={isChangingPassword}
            className="w-full sm:w-auto text-white px-4 py-2 rounded-lg text-sm bg-secondary hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer transition-all duration-250 flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isChangingPassword ? "Changing..." : "Change Password"}
          </button>
        </div>
      </section>

      {/* 2. MFA Section */}
      <section className="bg-card p-4 sm:p-6 rounded-xl border border-panel-border shadow-sm">
        <div className="flex flex-col sm:flex-row justify-between items-start mb-4 gap-2 sm:gap-0">
          <div>
            <h3 className="text-base sm:text-lg font-semibold text-foreground flex items-center">
              <ShieldCheck className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-muted-foreground" />
              Two-Factor Authentication
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {isTenantMfaEnabled
                ? "Manage your preferred additional security methods."
                : "MFA is currently disabled for your organization tenant."}
            </p>
          </div>
          {isTenantMfaEnabled && (
            <span className="self-start sm:self-auto text-[10px] sm:text-xs bg-green-100 text-green-700 px-2 py-1 rounded whitespace-nowrap">
              Enabled
            </span>
          )}
        </div>

        {!isFetchingMfa && mfaError && (
          <div className="mt-3 p-3 bg-red-50 text-red-700 rounded text-xs sm:text-sm">
            {mfaError}
          </div>
        )}

        {isFetchingMfa && (
          <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
            Loading MFA methods...
          </div>
        )}

        {isTenantMfaEnabled && !isFetchingMfa && !mfaError && (
          // Mobile: 1 Column, Desktop: 2 Columns
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mt-4 sm:mt-6">
            <MfaToggle
              label="Authenticator App"
              icon={<Smartphone className="w-4 h-4" />}
              active={mfaMethods.app}
              disabled={!mfaAvailable.app}
              onChange={() =>
                setMfaMethods({ ...mfaMethods, app: !mfaMethods.app })
              }
            />
            <MfaToggle
              label="Email OTP"
              icon={<Mail className="w-4 h-4" />}
              active={mfaMethods.email}
              disabled={!mfaAvailable.email}
              onChange={() =>
                setMfaMethods({ ...mfaMethods, email: !mfaMethods.email })
              }
            />
            <MfaToggle
              label="SMS Code"
              icon={<Smartphone className="w-4 h-4" />}
              active={mfaMethods.sms}
              disabled={!mfaAvailable.sms}
              onChange={() =>
                setMfaMethods({ ...mfaMethods, sms: !mfaMethods.sms })
              }
            />
            <MfaToggle
              label="Face ID"
              icon={<UserIcon />}
              active={mfaMethods.faceId}
              disabled={!mfaAvailable.faceId}
              onChange={() =>
                setMfaMethods({ ...mfaMethods, faceId: !mfaMethods.faceId })
              }
            />
          </div>
        )}
      </section>

      {/* 3. Login Activity */}
      <section className="bg-card p-4 sm:p-6 rounded-xl border border-panel-border shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Login Activity
        </h3>
        <div className="overflow-x-auto">
          <div className="max-h-80 overflow-y-auto rounded-lg border border-panel-border">
            {/* Minimum width ensures table doesn't squash on mobile */}
            <table className="w-full text-xs sm:text-sm text-left min-w-[500px]">
              <thead className="bg-gray-50 dark:bg-gray-800 text-muted-foreground uppercase font-medium">
                <tr>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Timestamp (UTC)</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Device</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">IP Address</th>
                  <th className="px-3 py-2 sm:px-4 sm:py-3">Location</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {isFetchingSessions && (
                  <tr>
                    <td colSpan={4} className="px-3 py-4 sm:px-4 sm:py-5 text-center">
                      <div className="flex justify-center items-center">
                        <Loader size="28" stroke="4" speed="3.5" />
                      </div>
                    </td>
                  </tr>
                )}
                {!isFetchingSessions && sessionsError && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 sm:px-4 sm:py-5 text-red-600 dark:text-red-400 text-center"
                    >
                      {sessionsError}
                    </td>
                  </tr>
                )}
                {!isFetchingSessions &&
                  !sessionsError &&
                  loginSessions.length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-4 sm:px-4 sm:py-5 text-muted-foreground text-center"
                      >
                        No login activity found.
                      </td>
                    </tr>
                  )}
                {!isFetchingSessions &&
                  !sessionsError &&
                  loginSessions.map((session) => {
                    // const timestamp = session.loginTime
                    //   ? new Date(session.loginTime).toLocaleString()
                    //   : "N/A";
                    const timestamp = formatTimestampWithAMPM(session.loginTime);
                    const device = formatDeviceName(session.userAgent);
                    const ipAddress = session.ipAddress || "N/A";
                    const location = session.location || "N/A";

                   

                    return (
                      <tr
                        key={session.id}
                        className="hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-foreground whitespace-nowrap">
                          {timestamp}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 text-foreground whitespace-nowrap">
                          {device}
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 font-mono text-muted-foreground">
                          <Tooltip
                            text={ipAddress || "N/A"}
                            position="top"
                            maxLength={20}
                          >
                            <span className="inline-block max-w-xs truncate">
                              {truncateText(ipAddress || "N/A", 20)}
                            </span>
                          </Tooltip>
                        </td>
                        <td className="px-3 py-2 sm:px-4 sm:py-3 flex items-center text-muted-foreground whitespace-nowrap">
                          <MapPin className="w-3 h-3 mr-1" />
                          <Tooltip
                            text={location || "N/A"}
                            position="top"
                            maxLength={20}
                          >
                            <span className="inline-block max-w-xs truncate">
                              {truncateText(location || "N/A", 20)}
                            </span>
                          </Tooltip>
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 4. Trusted Devices */}
      <section className="bg-card p-4 sm:p-6  rounded-xl border border-panel-border shadow-sm ">
        
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Trusted Devices
        </h3>
       <div className=" max-h-[40vh] overflow-auto">
        {devicesError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-xs sm:text-sm">
            {devicesError}
          </div>
        )}

        {removeSuccess && (
          <div className="mb-4 p-3 bg-green-50 text-green-700 rounded text-xs sm:text-sm">
            {removeSuccess}
          </div>
        )}

        {removeError && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-xs sm:text-sm">
            {removeError}
          </div>
        )}

        {renderTrustedDevicesContent()}
        </div>
      </section>

      {/* Confirmation Dialog for Deleting Trusted Device */}
      {confirmDeleteId && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-card rounded-lg shadow-2xl max-w-md w-full p-6 border border-panel-border">
            <div className="flex items-center gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-foreground">
                  Confirm Delete
                </h3>
                <p className="text-sm text-muted-foreground">
                  Are you sure you want to remove this trusted device? This
                  action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setConfirmDeleteId(null)}
                className="flex-1 px-4 py-2 text-sm font-medium text-foreground bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeDevice(confirmDeleteId);
                  setConfirmDeleteId(null);
                }}
                className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Simple Sub-component for MFA Toggles
function MfaToggle({
  label,
  icon,
  active,
  disabled,
  onChange,
}: {
  label: string;
  icon: any;
  active: boolean;
  disabled?: boolean;
  onChange: () => void;
}) {
  const handleClick = () => {
    if (disabled) return;
    onChange();
  };

  return (
    <div
      className={`flex items-center justify-between p-3 border border-panel-border rounded-lg transition-colors ${
        disabled
          ? "opacity-60 cursor-not-allowed"
          : "hover:border-blue-200 dark:hover:border-blue-800 cursor-pointer active:scale-[0.98] duration-150"
      }`}
      onClick={handleClick}
    >
      <div className="flex items-center space-x-3">
        <div className="text-muted-foreground">{icon}</div>
        <span className="text-sm font-medium text-foreground">{label}</span>
      </div>
      <div
        className={`w-10 h-5 flex items-center rounded-full p-1 duration-300 ${
          active ? "bg-blue-600" : "bg-gray-300"
        }`}
      >
        <div
          className={`bg-white w-3 h-3 rounded-full shadow-md transform duration-300 ${
            active ? "translate-x-5" : ""
          }`}
        ></div>
      </div>
    </div>
  );
}

function UserIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="w-4 h-4"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
