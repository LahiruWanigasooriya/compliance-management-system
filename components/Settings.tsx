"use client";
import { useMemo, useState, useEffect } from "react";
import { ICONS } from "../constants/constants";
import SummaryCard from "./layout/SummaryCard";
import Security from "./dashboard/config/Security";
import ComplianceRules from "./ComplianceRules";
import AlertsSettingsPage from "./dashboard/config/AlertsSettings";
import MonitoringAuditPage from "./dashboard/config/MonitoringAudit";
import ComplianceConfigurationPage from "./dashboard/config/ComplianceConfigurationPage";
// 1. Import the new UserManagement component
import UserManagement from "@/components/user/UserManagement";
// 2. Import action for the Summary Cards statistics
import { getUsers } from "@/actions/user.actions";

const Settings = () => {
  const [activeTab, setActiveTab] = useState("users");

  // --- Stats State ---
  const [userStats, setUserStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
  });

  // --- Fetch Stats on Mount ---
  // We fetch a larger list here just to calculate the "Total/Active" counts for the top cards.
  // The UserManagement component will handle its own fetching for the actual list/pagination.
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        const response = await getUsers({ page: 1, limit: 1000 });
        if (response.success && response.data) {
          const allUsers = response.data;
          setUserStats({
            totalUsers: allUsers.length,
            activeUsers: allUsers.filter(
              (u) => u.status?.toLowerCase() === "active",
            ).length,
          });
        }
      } catch (error) {
        console.error("Failed to load user stats", error);
      }
    };
    fetchUserStats();
  }, []);

  const apiIntegrations = [
    {
      name: "LexisNexis Risk Solutions",
      status: "Connected",
      apiKey: "lxns_•••••••••••••2x9a",
      lastSync: "2025-10-10 14:50:00",
      requestsToday: 1243,
      rateLimit: "5000/day",
    },
    {
      name: "Dow Jones Watchlist",
      status: "Connected",
      apiKey: "djws_•••••••••••••8k3m",
      lastSync: "2025-10-10 14:45:00",
      requestsToday: 876,
      rateLimit: "3000/day",
    },
    {
      name: "Chainalysis",
      status: "Connected",
      apiKey: "chan_•••••••••••••5p7q",
      lastSync: "2025-10-10 14:40:00",
      requestsToday: 324,
      rateLimit: "2000/day",
    },
    {
      name: "Refinitiv World-Check",
      status: "Error",
      apiKey: "rfnt_•••••••••••••9w2e",
      lastSync: "2025-10-10 12:00:00",
      requestsToday: 0,
      rateLimit: "4000/day",
    },
  ];

  const stats = useMemo(() => {
    return {
      totalUsers: userStats.totalUsers,
      activeUsers: userStats.activeUsers,
      connectedAPIs: apiIntegrations.filter((a) => a.status === "Connected")
        .length,
    };
  }, [userStats, apiIntegrations]);

  const getStatusBadgeClasses = (status: string) => {
    const styles = {
      Active: "bg-green-100 text-green-700 border-green-300",
      Inactive: "bg-gray-100 text-gray-700 border-gray-300",
      Connected: "bg-green-100 text-green-700 border-green-300",
      Error: "bg-red-100 text-red-700 border-red-300",
      Paused: "bg-yellow-100 text-yellow-700 border-yellow-300",
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[status as keyof typeof styles] || "bg-gray-100 text-gray-700"
    }`;
  };

  // const renderAPIIntegrations = () => (
  //   <div className="space-y-3">
  //     {apiIntegrations.map((api, idx) => (
  //       <div
  //         key={idx}
  //         className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all"
  //       >
  //         <div className="flex items-start justify-between mb-4">
  //           <div className="flex-1">
  //             <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
  //               <span className="text-gray-900 font-semibold text-lg">
  //                 {api.name}
  //               </span>
  //               <span className={getStatusBadgeClasses(api.status)}>
  //                 {api.status.toUpperCase()}
  //               </span>
  //             </div>
  //             <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap">
  //               <span className="flex items-center">
  //                 <ICONS.Key size={14} className="mr-1" />
  //                 {api.apiKey}
  //               </span>
  //               <span className="flex items-center">
  //                 <ICONS.Clock size={14} className="mr-1" />
  //                 Last sync: {api.lastSync}
  //               </span>
  //             </div>
  //           </div>
  //         </div>

  //         <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
  //           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
  //             <div className="text-gray-600 text-xs mb-1 font-medium">
  //               Requests Today
  //             </div>
  //             <div className="text-gray-900 font-bold text-lg">
  //               {api.requestsToday.toLocaleString()}
  //             </div>
  //           </div>
  //           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
  //             <div className="text-gray-600 text-xs mb-1 font-medium">
  //               Rate Limit
  //             </div>
  //             <div className="text-gray-900 font-semibold text-sm">
  //               {api.rateLimit}
  //             </div>
  //           </div>
  //           <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
  //             <div className="text-gray-600 text-xs mb-1 font-medium">
  //               Usage
  //             </div>
  //             <div className="text-gray-900 font-semibold text-sm">
  //               {Math.round(
  //                 (api.requestsToday /
  //                   parseInt(api.rateLimit.split("/")[0] as string)) *
  //                   100
  //               )}
  //               %
  //             </div>
  //           </div>
  //         </div>

  //         <div className="flex justify-end space-x-2">
  //           <button className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium flex items-center space-x-1.5">
  //             <ICONS.Settings size={16} />
  //             <span>Configure</span>
  //           </button>
  //           {api.status === "Connected" && (
  //             <button className="px-4 py-2 bg-blue-100 text-blue-700 border border-blue-300 rounded-lg hover:bg-blue-200 transition-all text-sm font-medium">
  //               Test Connection
  //             </button>
  //           )}
  //           {api.status === "Error" && (
  //             <button className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 transition-all text-sm font-medium">
  //               Reconnect
  //             </button>
  //           )}
  //         </div>
  //       </div>
  //     ))}
  //   </div>
  // );

  //const renderComplianceRules = () => <ComplianceRules />;
  const renderLoginActivity = () => <Security />;
  const renderAlertSettings = () => <AlertsSettingsPage />;
  const renderMonitoringAudit = () => <MonitoringAuditPage />;
  const renderComplianceConfiguration = () => <ComplianceConfigurationPage />;

  return (
    <div className="">
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground text-sm mt-0.5">
            Manage application settings and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium">
            <ICONS.Save size={16} />
            <span>Save Changes</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        <SummaryCard
          title="Total Users"
          value={stats.totalUsers}
          mainColor="blue"
          icon={ICONS.Users}
          bottomLabel="System users"
        />
        <SummaryCard
          title="Active Users"
          value={stats.activeUsers}
          mainColor="green"
          icon={ICONS.UserCheck}
          bottomLabel="Currently active"
        />

        <SummaryCard
          title="API Connections"
          value={stats.connectedAPIs}
          mainColor="orange"
          icon={ICONS.Link}
          bottomLabel="Active integrations"
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-1 border-b border-panel-border">
          {[
            { id: "users", label: "User Management", icon: ICONS.Users },
            // { id: "api", label: "API Integrations", icon: ICONS.Link },
            // { id: "rules", label: "Compliance Rules", icon: ICONS.Shield },
            { id: "security", label: "Security", icon: ICONS.Lock },
            {
              id: "alerts",
              label: "Alerts & Notification",
              icon: ICONS.AlertCircle,
            },
            { id: "audit", label: "Monitoring & Audit", icon: ICONS.Activity },
            { id: "tenant", label: "Organization & Tenant", icon: ICONS.Users },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer ${
                activeTab === tab.id
                  ? "border-secondary text-secondary font-bold!"
                  : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-slate-800/50"
              }`}
            >
              <tab.icon size={16} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-12">
          {/* RENDER THE USER MANAGEMENT COMPONENT HERE */}
          {activeTab === "users" && <UserManagement />}

          {/* {activeTab === "api" && renderAPIIntegrations()}
          {activeTab === "rules" && renderComplianceRules()} */}
          {activeTab === "security" && renderLoginActivity()}
          {activeTab === "alerts" && renderAlertSettings()}
          {activeTab === "audit" && renderMonitoringAudit()}
          {activeTab === "tenant" && renderComplianceConfiguration()}
        </div>
      </div>
    </div>
  );
};

export default Settings;
