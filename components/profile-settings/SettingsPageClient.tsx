"use client";

import React, { useState, useTransition } from "react";
import PersonalInfo from "@/components/profile-settings/PersonalInfo";
import SecuritySettings from "@/components/profile-settings/SecuritySettings";
import Preferences from "@/components/profile-settings/Preferences";
import { User, Shield, Sliders } from "lucide-react";
import { ProfileApiResponse } from "@/types/profile.types";
import LoadingOverlay from "@/components/layout/LoadingOverlay";

interface SettingsPageClientProps {
  profileData: ProfileApiResponse;
}

export default function SettingsPageClient({
  profileData,
}: SettingsPageClientProps) {
  const [activeTab, setActiveTab] = useState("personal");
  const [isPending, startTransition] = useTransition();

  const tabs = [
    { id: "personal", label: "Personal Information", icon: User },
    { id: "security", label: "Security & Login", icon: Shield },
    { id: "preferences", label: "Preferences", icon: Sliders },
  ];

  return (
    <div className="min-h-screen p-0 md:p-6 font-sans">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-foreground mb-8">
          Profile Settings
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  if (activeTab === tab.id) return;
                  startTransition(() => setActiveTab(tab.id));
                }}
                className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? "bg-secondary text-white shadow-md"
                    : "bg-white text-gray-600 hover:bg-gray-100"
                }`}
              >
                <tab.icon className="w-5 h-5 mr-3" />
                {tab.label}
              </button>
            ))}
          </nav>

          {/* Main Content Area */}
          <main className="lg:col-span-3 space-y-6 relative">
            {activeTab === "personal" && (
              <PersonalInfo profileData={profileData} />
            )}
            {activeTab === "security" && <SecuritySettings />}
            {activeTab === "preferences" && <Preferences />}
          </main>
        </div>
      </div>
    </div>
  );
}
