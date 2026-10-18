"use client";

import React from "react";
import { ChevronLeft, Mail, Phone, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { User } from "@/types/user.types";

interface UserDetailsProps {
  user: User;
}

export default function UserDetails({ user }: UserDetailsProps) {
  const router = useRouter();

  const getRoleColorStyles = (role: string) => {
    const normalizedRole = role?.toLowerCase?.() || "";
    if (normalizedRole.includes("admin")) {
      return "bg-purple-100 text-purple-800";
    }
    if (normalizedRole.includes("compliance")) {
      return "bg-blue-100 text-blue-800";
    }
    if (normalizedRole.includes("risk")) {
      return "bg-indigo-100 text-indigo-800";
    }
    if (normalizedRole.includes("auditor")) {
      return "bg-teal-50 text-teal-700";
    }
    return "bg-card text-muted-foreground";
  };

  const isSuspended = user.status === "inactive" || user.status === "suspended";

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return "N/A";
    return date.toLocaleString();
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-start gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors mt-1 cursor-pointer"
        >
          <ChevronLeft size={20} />
        </button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-foreground">User Details</h1>
          <p className="text-sm text-muted-foreground">
            View user profile information, roles, and permissions.
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <h2 className="text-xl font-semibold text-foreground">{user.name}</h2>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              !isSuspended
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {user.status}
          </span>
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleColorStyles(
              user.role,
            )}`}
          >
            {user.role}
          </span>
          {user.mfaEnabled && (
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
              <ShieldCheck size={12} className="shrink-0" />
              MFA Enabled
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Mail size={16} className="shrink-0" />
            <span>{user.email || "N/A"}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Phone size={16} className="shrink-0" />
            <span>{user.phone || "N/A"}</span>
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Last Login:</span>{" "}
            {formatDateTime(user.lastLogin)}
          </div>
          <div className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">User ID:</span>{" "}
            {user.id}
          </div>
        </div>
      </div>

      {/* Permissions */}
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Permissions
        </h3>

        {user.permissions && user.permissions.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {user.permissions.map((permission, index) => (
              <div
                key={index}
                className="rounded-md border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm"
              >
                <span className="font-semibold text-foreground">
                  {permission.resource}
                </span>
                <span className="mx-1 text-gray-500">•</span>
                <span className="text-muted-foreground">
                  {permission.actions
                    .map((action) => (action === "get" ? "read" : action))
                    .join(", ")}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No permissions available.
          </p>
        )}
      </div>
    </div>
  );
}
