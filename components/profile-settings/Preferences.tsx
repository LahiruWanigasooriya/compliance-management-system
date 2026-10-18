"use client";

import React, { useEffect, useState } from "react";
import {
  Bell,
  Moon,
  Sun,
  Monitor,
  Globe,
  Clock,
  Calendar,
  Hash,
  Mail,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  getPreferences,
  updatePreferences,
  getNotificationPreferences,
  updateNotificationPreferences,
} from "@/actions/profile.actions";
import type {
  UserPreferences,
  NotificationPreferencesApiResponse,
} from "@/types/profile.types";
import Loader from "../ui/loader/Loader";

export default function Preferences() {
  const { theme, setTheme } = useTheme();
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isNotificationSaving, setIsNotificationSaving] = useState(false);

  const [notificationData, setNotificationData] =
    useState<NotificationPreferencesApiResponse>({
      availableChannels: [],
      availableFrequencies: [],
      currentFrequency: "immediate",
      preferences: {
        emailNotifications: true,
        smsNotifications: false,
        inAppNotifications: true,
        notificationFrequency: "immediate",
      },
    });

  const [preferences, setPreferences] = useState<UserPreferences>({
    language: "",
    timezone: "",
    dateFormat: "",
    numberFormat: "",
  });

  useEffect(() => {
    const fetchPreferences = async () => {
      setIsLoading(true);
      setErrorMsg("");
      try {
        const result = await getPreferences();
        if (result.success && result.data) {
          setPreferences({
            language: result.data.language || "",
            timezone: result.data.timezone || "",
            dateFormat: result.data.dateFormat || "",
            numberFormat: result.data.numberFormat || "",
          });
        } else {
          setErrorMsg(result.message || "Failed to load preferences.");
        }
      } catch (error) {
        setErrorMsg("Failed to load preferences.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchPreferences();
    fetchNotificationPreferences();
  }, []);

  const fetchNotificationPreferences = async () => {
    setErrorMsg("");
    try {
      const result = await getNotificationPreferences();
      if (result.success && result.data) {
        // Disable SMS channel
        const disabledSmsData = {
          ...result.data,
          availableChannels: result.data.availableChannels.map((channel) =>
            channel.id === "sms" ? { ...channel, enabled: false } : channel
          ),
        };
        setNotificationData(disabledSmsData);
      } else {
        setErrorMsg(
          result.message || "Failed to load notification preferences."
        );
      }
    } catch (error) {
      setErrorMsg("Failed to load notification preferences.");
    }
  };

  const handleNotificationChannelToggle = (channelId: string) => {
    // Convert channel ID to camelCase preference key
    const preferenceKey =
      channelId === "in_app"
        ? "inAppNotifications"
        : `${channelId}Notifications`;

    setNotificationData((prev) => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        [preferenceKey]:
          !prev.preferences[preferenceKey as keyof typeof prev.preferences],
      },
    }));
  };

  const handleFrequencyChange = (frequencyId: string) => {
    setNotificationData((prev) => ({
      ...prev,
      currentFrequency: frequencyId,
      preferences: {
        ...prev.preferences,
        notificationFrequency: frequencyId,
      },
    }));
  };

  const handleNotificationSave = async () => {
    setIsNotificationSaving(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const result = await updateNotificationPreferences({
        emailNotifications: notificationData.preferences.emailNotifications,
        smsNotifications: notificationData.preferences.smsNotifications,
        inAppNotifications: notificationData.preferences.inAppNotifications,
        notificationFrequency:
          notificationData.preferences.notificationFrequency,
      });

      if (result.success) {
        setSuccessMsg(
          result.message || "Notification settings updated successfully"
        );
      } else {
        setErrorMsg(result.message || "Failed to update notification settings");
      }
    } catch (error) {
      setErrorMsg("Failed to update notification settings");
    } finally {
      setIsNotificationSaving(false);
      setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 3000);
    }
  };

  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setIsSaving(true);

    try {
      const result = await updatePreferences({
        language: preferences.language,
        timezone: preferences.timezone,
        dateFormat: preferences.dateFormat,
        numberFormat: preferences.numberFormat,
      });

      if (result.success) {
        setSuccessMsg(result.message || "Preferences updated successfully");
      } else {
        setErrorMsg(result.message || "Failed to update preferences.");
      }
    } catch (error) {
      setErrorMsg("Failed to update preferences.");
    } finally {
      setIsSaving(false);
      setTimeout(() => {
        setSuccessMsg("");
        setErrorMsg("");
      }, 3000);
    }
  };

  const getChannelIcon = (channelId: string) => {
    switch (channelId) {
      case "email":
        return <Mail className="w-4 h-4" />;
      case "sms":
        return <Smartphone className="w-4 h-4" />;
      case "in_app":
        return <MessageSquare className="w-4 h-4" />;
      default:
        return <Bell className="w-4 h-4" />;
    }
  };

  const getPreferenceKey = (
    channelId: string
  ): keyof typeof notificationData.preferences => {
    if (channelId === "in_app") return "inAppNotifications";
    if (channelId === "email") return "emailNotifications";
    if (channelId === "sms") return "smsNotifications";
    return "inAppNotifications";
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="fixed top-6 right-5 z-50">
        {successMsg && (
          <div className="bg-gray-800 text-white px-4 py-2 sm:px-6 sm:py-3 rounded shadow-lg text-xs sm:text-sm mb-2">
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="bg-red-50 text-red-700 px-4 py-2 sm:px-6 sm:py-3 rounded shadow-lg text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}
      </div>

      {/* 1. Notifications */}
      <section className="bg-card p-4 sm:p-6 rounded-xl border border-panel-border shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 flex items-center">
          <Bell className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-muted-foreground" />
          Notification Settings
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
             <Loader size="28" stroke="4" speed="3.5" />
          </div>
        ) : (
          <>
            {/* Notification Channels */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-foreground mb-3">
                Notification Channels
              </h4>
              <div className="space-y-3">
                {notificationData.availableChannels.map((channel) => (
                  <div
                    key={channel.id}
                    className={`flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-panel-border ${
                      !channel.enabled ? "opacity-50" : ""
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-muted-foreground">
                        {getChannelIcon(channel.id)}
                      </div>
                      <span className="text-sm text-foreground font-medium">
                        {channel.label}
                      </span>
                    </div>
                    <label
                      className={`relative inline-flex items-center ${
                        !channel.enabled ? "cursor-not-allowed" : "cursor-pointer"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={
                          notificationData.preferences[
                            getPreferenceKey(channel.id)
                          ] as boolean
                        }
                        onChange={() =>
                          handleNotificationChannelToggle(channel.id)
                        }
                        className="sr-only peer"
                        disabled={!channel.enabled}
                      />
                      <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600 peer-disabled:opacity-50 peer-disabled:cursor-not-allowed"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Notification Frequency */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-foreground mb-3">
                Notification Frequency
              </h4>
              <div className="space-y-2">
                {notificationData.availableFrequencies.map((frequency) => (
                  <label
                    key={frequency.id}
                    className={`flex items-start p-3 rounded-lg border cursor-pointer transition-all ${
                      notificationData.currentFrequency === frequency.id
                        ? "bg-blue-50 dark:bg-blue-900/20 border-blue-500"
                        : "bg-gray-50 dark:bg-gray-800 border-panel-border hover:border-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="notification_frequency"
                      value={frequency.id}
                      checked={
                        notificationData.currentFrequency === frequency.id
                      }
                      onChange={() => handleFrequencyChange(frequency.id)}
                      className="mt-1 w-4 h-4 text-blue-600"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-foreground">
                        {frequency.label}
                      </div>
                      <div className="text-xs text-muted-foreground mt-0.5">
                        {frequency.description}
                      </div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleNotificationSave}
                disabled={isNotificationSaving}
                className="px-4 py-2 text-white text-sm font-medium rounded-lg bg-secondary hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isNotificationSaving ? "Saving..." : "Save Preferences"}
              </button>
            </div>
          </>
        )}
      </section>

      {/* 2. Interface Theme */}
      <section className="bg-card p-4 sm:p-6 rounded-xl border border-panel-border shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4">
          Interface Theme
        </h3>
        <div className="grid grid-cols-3 gap-3 sm:gap-4">
          <ThemeOption
            label="System"
            icon={<Monitor className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />}
            active={theme === "system"}
            onClick={() => setTheme("system")}
          />
          <ThemeOption
            label="Light Mode"
            icon={<Sun className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />}
            active={theme === "light"}
            onClick={() => setTheme("light")}
          />
          <ThemeOption
            label="Dark Mode"
            icon={<Moon className="w-5 h-5 sm:w-6 sm:h-6 mb-2" />}
            active={theme === "dark"}
            onClick={() => setTheme("dark")}
          />
        </div>
      </section>

      {/* 3. Language & Region */}
      <section className="bg-card p-4 sm:p-6 rounded-xl border border-panel-border shadow-sm">
        <h3 className="text-base sm:text-lg font-semibold text-foreground mb-4 sm:mb-6">
          Language & Region
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 sm:gap-6">
          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase flex items-center">
              <Globe className="w-3 h-3 mr-1" /> Language
            </label>
            <select
              value={preferences.language}
              onChange={(e) =>
                setPreferences({ ...preferences, language: e.target.value })
              }
              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-panel-border rounded text-sm text-foreground outline-none focus:border-secondary cursor-pointer"
            >
              <option value="">Select language</option>
              <option value="en">English (US)</option>
              <option value="en-GB">English (UK)</option>
              <option value="de">German</option>
              <option value="fr">French</option>
              {!["", "en", "en-GB", "de", "fr"].includes(
                preferences.language
              ) && (
                <option value={preferences.language}>
                  {preferences.language}
                </option>
              )}
            </select>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase flex items-center">
              <Clock className="w-3 h-3 mr-1" /> Time Zone
            </label>
            <select
              value={preferences.timezone}
              onChange={(e) =>
                setPreferences({ ...preferences, timezone: e.target.value })
              }
              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-panel-border rounded text-sm text-foreground outline-none focus:border-secondary cursor-pointer"
            >
              <option value="">Select timezone</option>
              <option value="UTC">UTC</option>
              <option value="Europe/Berlin">Europe/Berlin</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Asia/Colombo">Asia/Colombo</option>
              {![
                "",
                "UTC",
                "Europe/Berlin",
                "America/New_York",
                "Asia/Colombo",
              ].includes(preferences.timezone) && (
                <option value={preferences.timezone}>
                  {preferences.timezone}
                </option>
              )}
            </select>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase flex items-center">
              <Calendar className="w-3 h-3 mr-1" /> Date Format
            </label>
            <select
              value={preferences.dateFormat}
              onChange={(e) =>
                setPreferences({ ...preferences, dateFormat: e.target.value })
              }
              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-panel-border rounded text-sm text-foreground outline-none focus:border-secondary cursor-pointer"
            >
              <option value="">Select date format</option>
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              <option value="DD.MM.YYYY">DD.MM.YYYY</option>
              {![
                "",
                "MM/DD/YYYY",
                "DD/MM/YYYY",
                "YYYY-MM-DD",
                "DD.MM.YYYY",
              ].includes(preferences.dateFormat) && (
                <option value={preferences.dateFormat}>
                  {preferences.dateFormat}
                </option>
              )}
            </select>
          </div>

          <div className="space-y-1 sm:space-y-2">
            <label className="text-[10px] sm:text-xs font-semibold text-muted-foreground uppercase flex items-center">
              <Hash className="w-3 h-3 mr-1" /> Number Format
            </label>
            <select
              value={preferences.numberFormat}
              onChange={(e) =>
                setPreferences({ ...preferences, numberFormat: e.target.value })
              }
              className="w-full p-2 bg-gray-50 dark:bg-gray-800 border border-panel-border rounded text-sm text-foreground outline-none focus:border-secondary cursor-pointer"
            >
              <option value="">Select number format</option>
              <option value="en-US"> (en-US)</option>
              <option value="de-DE"> (de-DE)</option>
              <option value="fr-FR"> (fr-FR)</option>
              {!["", "en-US", "de-DE", "fr-FR"].includes(
                preferences.numberFormat
              ) && (
                <option value={preferences.numberFormat}>
                  {preferences.numberFormat}
                </option>
              )}
            </select>
          </div>
        </div>
        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isSaving || isLoading}
            className="w-full sm:w-auto px-4 py-2 text-white text-sm font-medium rounded-lg bg-secondary hover:bg-gray-400 dark:hover:bg-gray-600 cursor-pointer transition-all duration-250 flex justify-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSaving
              ? "Saving..."
              : isLoading
              ? "Loading..."
              : "Save Settings"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ThemeOption({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: any;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center p-3 sm:p-4 border rounded-xl transition-all cursor-pointer ${
        active
          ? "bg-green-50 dark:bg-gray-600 border-secondary text-primary shadow-sm"
          : "bg-card border-panel-border text-muted-foreground hover:bg-gray-50 dark:hover:bg-gray-800"
      }`}
    >
      {icon}
      <span className="text-xs sm:text-sm font-medium whitespace-nowrap">
        {label}
      </span>
    </button>
  );
}
