"use client";

import React, { useState } from "react";
import { Activity, ShieldCheck, LayoutDashboard } from "lucide-react";
import { SystemHealthDashboard } from "../../configuration-settings/monitoring/SystemHealthDashboard";
import { AuditLogManager } from "../../configuration-settings/monitoring/AuditLogManager";

type ActiveTab = "monitoring" | "audit";

export default function MonitoringAuditPage() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("audit");

  return (
    <div className="min-h-screen  font-sans text-foreground">
      {/* Page Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">
            System Administration
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Monitor system performance, AI model health, and audit user
            activities.
          </p>
        </div>

        {/* {permissions.canCreateUser && (
                  <button
                    onClick={handleAddClick}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#164e87] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d] cursor-pointer"
                  >
                    <Plus size={18} /> Add User
                  </button>
                )} */}
      </div>

      {/* Navigation Tabs */}
      <div className="flex space-x-1 bg-card p-1 rounded-lg w-fit mb-8 border border-border">
        <button
          onClick={() => setActiveTab("monitoring")}
          className={`
            cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200
            ${
              activeTab === "monitoring"
                ? "bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/80"
            }
          `}
        >
          <Activity size={18} />
          Monitoring & Health
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          className={`
            cursor-pointer flex items-center gap-2 px-5 py-2.5 rounded-md text-sm font-medium transition-all duration-200
            ${
              activeTab === "audit"
                ? "bg-muted text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground hover:bg-card/80"
            }
          `}
        >
          <ShieldCheck size={18} />
          Audit Logs
        </button>
      </div>

      {/* Content Area */}
      <main className="animate-in fade-in duration-300">
        {activeTab === "monitoring" ? (
          <section>
            {/* <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                System Health Dashboard
              </h2>
              <span className="text-xs font-mono text-muted-foreground bg-card px-2 py-1 rounded border border-border">
                Live Data
              </span>
            </div> */}
            <SystemHealthDashboard />
          </section>
        ) : (
          <section>
            {/* <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                Audit Log Management
              </h2>
              <span className="text-xs text-muted-foreground">
                Retention: 90 Days
              </span>
            </div> */}
            <AuditLogManager />
          </section>
        )}
      </main>
    </div>
  );
}
