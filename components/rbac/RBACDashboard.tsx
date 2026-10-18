// app/page.tsx
"use client";
import React, { useState } from "react";
import { RoleManager } from "@/components/rbac/RoleManager";

import {
  ShieldCheck,
  Layers,
  ChevronRight,
  Activity,
  PersonStanding,
} from "lucide-react";
import { PrivilegeLevelManager } from "@/components/rbac/PrivilegeLevelManager";
import { usePermissions } from "@/hooks/usepermissions";

type ViewMode = "roles" | "levels";

export default function RBACDashboard() {
  const [currentView, setCurrentView] = useState<ViewMode>("roles");
  const permissions = usePermissions();

  return (
    <div className=" bg-card rounded-xl  shadow-sm p-6 text-foreground font-sans">
      {/* HEADER */}
      <header className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-secondary rounded-lg flex items-center justify-center">
              <PersonStanding size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Role-Based Access Control
              </h2>
              <p className="text-xs text-prime-foreground">
                Manage roles, privilege levels, and access permissions
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* NAVIGATION TABS */}
      <div className="bg-card border-b border-border">
        <div className="max-w-[1920px] mx-auto ">
          <nav className="flex">
            <button
              onClick={() => setCurrentView("levels")}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer
                ${
                  currentView === "levels"
                    ? "border-secondary text-secondary font-bold!"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-50/40"
                }
              `}
            >
              <Layers size={18} />
              Privilege Levels
              {/* {currentView === "levels" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"></span>
              )} */}
            </button>

            <button
              onClick={() => setCurrentView("roles")}
              className={`
                flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer
                ${
                  currentView === "roles"
                    ? "border-secondary text-secondary font-bold!"
                    : "text-muted-foreground hover:text-foreground hover:bg-slate-50/40"
                }
              `}
            >
              <ShieldCheck size={18} />
              Roles
              {/* {currentView === "roles" && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary"></span>
              )} */}
            </button>
          </nav>
        </div>
      </div>

      {/* BREADCRUMB */}
      {/* <div className="bg-card border-b border-border">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>RBAC</span>
            <ChevronRight size={16} />
            <span className="text-foreground font-medium">
              {currentView === "levels" ? "Privilege Levels" : "Roles"}
            </span>
          </div>
        </div>
      </div> */}

      {/* MAIN CONTENT */}
      <main className="max-w-[1920px] mx-auto py-4 md:py-6">
        {currentView === "levels" ? (
          <PrivilegeLevelManager
            canCreate={permissions.canCreateRBAC}
            canUpdate={permissions.canUpdateRBAC}
            canDelete={permissions.canDeleteRBAC}
          />
        ) : (
          <RoleManager
            canCreate={permissions.canCreateRBAC}
            canUpdate={permissions.canUpdateRBAC}
            canDelete={permissions.canDeleteRBAC}
          />
        )}
      </main>

      {/* FOOTER INFO */}
      {/* <footer className="bg-card border-t border-border mt-12">
        <div className="max-w-[1920px] mx-auto px-4 md:px-6 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2">
                Privilege Levels
              </h3>
              <p className="text-sm text-slate-500">
                Define hierarchical privilege levels with specific permissions.
                Lower level values represent higher privileges. Each level
                automatically inherits all permissions from levels with higher
                numbers.
              </p>
            </div>
            <div>
              <h3 className="font-semibold text-sm text-foreground mb-2">
                Roles
              </h3>
              <p className="text-sm text-slate-500">
                Assign users to roles that are linked to privilege levels. Roles
                inherit all permissions from their assigned privilege level and
                all lower levels in the hierarchy.
              </p>
            </div>
          </div>
        </div>
      </footer> */}
    </div>
  );
}
