"use client";

import React, { useState, useEffect } from "react";
import {
  Save,
  AlertCircle,
  Clock,
  Moon,
  Sun,
  CheckCircle2,
} from "lucide-react";
import {
  AlertSettingsState,
  ChannelType,
  NotificationFrequency,
} from "../../../types/sysconfig.types";
import {
  DEFAULT_SETTINGS,
  CHANNEL_META,
  FREQUENCY_OPTIONS,
} from "../../../constants/sysconfig.constants";

// --- UI Components ---

const ToggleSwitch = ({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (val: boolean) => void;
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
      checked ? "bg-indigo-600" : "bg-border"
    }`}
  >
    <span
      className={`inline-block h-4 w-4 transform rounded-full bg-background transition-transform ${
        checked ? "translate-x-6" : "translate-x-1"
      }`}
    />
  </button>
);

const TimeInput = ({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
}) => (
  <input
    type="time"
    value={value}
    disabled={disabled}
    onChange={(e) => onChange(e.target.value)}
    className="block w-full rounded-md border-border shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 bg-card text-foreground disabled:bg-card/60 disabled:text-muted-foreground"
  />
);

// --- Main Page Component ---

export default function AlertsSettingsPage() {
  const [settings, setSettings] =
    useState<AlertSettingsState>(DEFAULT_SETTINGS);
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  // Auto-save Simulation logic
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSaving(true);
      setTimeout(() => {
        setIsSaving(false);
        setLastSaved(new Date());
      }, 800);
    }, 1000);

    return () => clearTimeout(timer);
  }, [settings]);

  // Handlers
  const handleChannelToggle = (channel: ChannelType, enabled: boolean) => {
    setSettings((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: { ...prev.channels[channel], enabled },
      },
    }));
  };

  const handleFrequencyChange = (
    channel: ChannelType,
    frequency: NotificationFrequency,
  ) => {
    setSettings((prev) => ({
      ...prev,
      channels: {
        ...prev.channels,
        [channel]: { ...prev.channels[channel], frequency },
      },
    }));
  };

  const handleTimeChange = (
    type: "activeHours" | "quietHours",
    field: "start" | "end",
    value: string,
  ) => {
    setSettings((prev) => ({
      ...prev,
      [type]: { ...prev[type], [field]: value },
    }));
  };

  return (
    <div className="min-h-screen  py-8 px-4 sm:px-6 lg:px-8 text-foreground">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Alerts & Notifications
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage how and when you receive system alerts.
            </p>
          </div>
          <div className="flex items-center text-sm h-6">
            {isSaving ? (
              <span className="text-green-700 flex items-center gap-1 animate-pulse">
                <Save size={14} /> Saving...
              </span>
            ) : lastSaved ? (
              <span className="text-secondary flex items-center gap-1">
                <CheckCircle2 size={14} /> Saved{" "}
                {lastSaved.toLocaleTimeString()}
              </span>
            ) : null}
          </div>
        </div>

        {/* Section 1: Notification Preferences */}
        <section className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-card/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                  <AlertCircle size={20} className="text-white" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-foreground">
                    Notification Channels
                  </h2>
                  <p className="text-xs text-prime-foreground">
                    Configure where alerts are sent and how often.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="divide-y divide-border">
            {(Object.keys(settings.channels) as ChannelType[]).map((key) => {
              const channel = settings.channels[key];
              const meta = CHANNEL_META[key];
              const Icon = meta.icon;

              return (
                <div
                  key={key}
                  className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  {/* Left: Icon & Description */}
                  <div className="flex items-start gap-4 flex-1">
                    <div
                      className={`p-2 rounded-lg flex-shrink-0 ${channel.enabled ? "bg-card text-muted-foreground" : "bg-card text-muted-foreground"}`}
                    >
                      <Icon size={19} />
                    </div>
                    <div>
                      <h3 className="font-medium text-foreground">
                        {channel.label}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        {meta.description}
                      </p>
                    </div>
                  </div>

                  {/* Right: Controls */}
                  <div className="flex items-center justify-between sm:justify-end gap-6 w-full sm:w-auto mt-2 sm:mt-0">
                    {
                      <div
                        className={`flex flex-col items-end ${channel.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
                      >
                        <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          Frequency
                        </label>
                        <select
                          value={channel.frequency}
                          onChange={(e) =>
                            handleFrequencyChange(
                              key,
                              e.target.value as NotificationFrequency,
                            )
                          }
                          disabled={!channel.enabled}
                          className="block w-36 rounded-md border-border py-1.5 text-sm text-foreground focus:border-indigo-500 focus:outline-none focus:ring-indigo-500 border bg-card pl-2"
                        >
                          {FREQUENCY_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                              {opt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    }

                    <div className="flex items-center h-full pt-4 sm:pt-0">
                      <ToggleSwitch
                        checked={channel.enabled}
                        onChange={(val) => handleChannelToggle(key, val)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Section 2: Alert Active & Disabled Hours */}
        <section className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
          <div className="p-4 border-b border-border bg-card/50">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
                <Clock size={20} className="text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">
                  Timing Configuration
                </h2>
                <p className="text-xs text-prime-foreground">
                  Control when alerts are active or suppressed.
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Active Hours Column */}
            <div className="space-y-4">
              <div
                className={`flex items-center gap-2 mb-2 bg-card text-muted-foreground`}
              >
                <Sun size={19} />
                <h3 className="font-medium text-foreground">Active Hours</h3>
              </div>
              <p className="text-sm text-muted-foreground mb-4 h-10">
                Alerts will only be generated during this window.
              </p>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Start Time
                  </label>
                  <TimeInput
                    value={settings.activeHours.start}
                    onChange={(val) =>
                      handleTimeChange("activeHours", "start", val)
                    }
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    End Time
                  </label>
                  <TimeInput
                    value={settings.activeHours.end}
                    onChange={(val) =>
                      handleTimeChange("activeHours", "end", val)
                    }
                  />
                </div>
              </div>
            </div>

            {/* Disabled Hours Column */}
            <div className="space-y-4 border-t md:border-t-0 md:border-l border-border md:pl-8 pt-6 md:pt-0">
              <div className="flex items-center justify-between mb-2">
                <div
                  className={`flex items-center gap-2 mb-2 bg-card text-muted-foreground`}
                >
                  <Moon size={18} />
                  <h3 className="font-medium text-foreground">
                    Disabled Hours
                  </h3>
                </div>
                <ToggleSwitch
                  checked={settings.quietHours.enabled}
                  onChange={(val) =>
                    setSettings((prev) => ({
                      ...prev,
                      quietHours: { ...prev.quietHours, enabled: val },
                    }))
                  }
                />
              </div>
              <p className="text-sm text-muted-foreground mb-4 h-10">
                Notifications are suppressed during these hours, even if active.
              </p>

              <div
                className={`grid grid-cols-2 gap-4 transition-opacity duration-200 ${settings.quietHours.enabled ? "opacity-100" : "opacity-40 pointer-events-none"}`}
              >
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    Start Quiet
                  </label>
                  <TimeInput
                    value={settings.quietHours.start}
                    onChange={(val) =>
                      handleTimeChange("quietHours", "start", val)
                    }
                    disabled={!settings.quietHours.enabled}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-foreground mb-1">
                    End Quiet
                  </label>
                  <TimeInput
                    value={settings.quietHours.end}
                    onChange={(val) =>
                      handleTimeChange("quietHours", "end", val)
                    }
                    disabled={!settings.quietHours.enabled}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
