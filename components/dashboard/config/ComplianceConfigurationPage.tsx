// components/ComplianceConfigurationPage.tsx
"use client";

import React, { useState } from "react";
import ComplianceRulesSection from "../../configuration-settings/rules/ComplianceRulesSection";
import SystemSettingsSection from "../../configuration-settings/rules/SystemSettingsSection";
import { Settings, ShieldCheck, Cog } from "lucide-react";

type TabType = "rules" | "system";

const ComplianceConfigurationPage = () => {
  const [activeTab, setActiveTab] = useState<TabType>("rules");

  return (
    <div className="min-h-screen  p-6 font-sans text-foreground">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3 text-foreground">
          <Settings className="w-8 h-8 text-blue-500" />
          Compliance & Policy Configuration
        </h1>
        <p className="text-muted-foreground mt-2 ml-11">
          Manage compliance rules, system settings, and data retention policies.
        </p>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border mb-6 ml-1">
        <button
          onClick={() => setActiveTab("rules")}
          className={`flex items-center gap-2 pb-3 px-4 font-medium transition-colors border-b-2 ${
            activeTab === "rules"
              ? "border-blue-500 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          Compliance Rules
        </button>
        <button
          onClick={() => setActiveTab("system")}
          className={`flex items-center gap-2 pb-3 px-4 font-medium transition-colors border-b-2 ${
            activeTab === "system"
              ? "border-blue-500 text-foreground"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Cog className="w-4 h-4" />
          System Settings
        </button>
      </div>

      {/* Content Area */}
      <div className="bg-card rounded-xl shadow-sm border border-border">
        {activeTab === "rules" && <ComplianceRulesSection />}
        {activeTab === "system" && <SystemSettingsSection />}
      </div>
    </div>
  );
};

export default ComplianceConfigurationPage;
