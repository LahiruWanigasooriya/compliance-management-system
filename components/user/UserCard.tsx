// components/user/UserCard.tsx
import React from "react";
import {
  Mail,
  Clock,
  ShieldCheck,
  Pencil,
  Power,
  PlayCircle,
} from "lucide-react";
import { User } from "@/types/user.types";

interface UserCardProps {
  user: User;
  onEdit?: (userId: string) => void;
  canEdit?: boolean;
  // Renamed to generic "Toggle" since it handles both Activate & Deactivate
  onToggleStatus?: (user: User) => void;
  onEnableMFA?: (userId: string) => void;
}

const UserCard: React.FC<UserCardProps> = ({
  user,
  onEdit,
  canEdit = true,
  onToggleStatus,
  onEnableMFA,
}) => {
  // Helper to color-code roles
  const getRoleColorStyles = (role: string) => {
    const normalizedRole = role.toLowerCase();
    if (normalizedRole.includes("admin"))
      return "bg-purple-100 text-purple-800";
    if (normalizedRole.includes("compliance"))
      return "bg-blue-100 text-blue-800";
    if (normalizedRole.includes("risk")) return "bg-indigo-100 text-indigo-800";
    if (normalizedRole.includes("auditor")) return "bg-teal-50 text-teal-700";
    return "bg-card text-muted-foreground";
  };

  // Check if user is currently inactive/suspended
  const isSuspended = user.status === "inactive" || user.status === "inactive";

  return (
    <div className="w-full bg-card rounded-xl border border-border shadow-sm p-5 sm:p-6 transition-all hover:shadow-md cursor-pointer">
      {/* --- Header Section --- */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <h2 className="text-lg font-bold text-foreground">{user.name}</h2>

          {/* Status Badge */}
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
              MFA
            </span>
          )}
        </div>
      </div>

      {/* --- Info Section --- */}
      <div className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:items-center sm:gap-6">
        <div className="flex items-center gap-2">
          <Mail size={16} className="text-muted-foreground shrink-0" />
          <span className="truncate">{user.email}</span>
        </div>

        {/* <div className="flex items-center gap-2">
          <Clock size={16} className="text-muted-foreground shrink-0" />
          <span>Last login: {user.lastLogin}</span>
        </div> */}
      </div>

      {/* --- Permissions --- */}
      <div className="mt-6 rounded-lg bg-card p-4 border border-border">
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
            No Permissions Available
          </p>
        )}
      </div>

      {/* --- Actions Footer --- */}
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
        {canEdit && (
          <button
            onClick={() => onEdit && onEdit(user.id)}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#164e87] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#133f6d] cursor-pointer"
          >
            <Pencil size={16} />
            Edit User
          </button>
        )}

        {/* Toggle Status Button (Dynamic) */}
        <button
          onClick={() => onToggleStatus && onToggleStatus(user)}
          className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 cursor-pointer ${
            isSuspended
              ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 focus:ring-green-500" // Activate Style
              : "border-border bg-card text-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 focus:ring-red-500" // Deactivate Style
          }`}
        >
          {isSuspended ? (
            <>
              <PlayCircle size={16} /> Activate
            </>
          ) : (
            <>
              <Power size={16} /> Deactivate
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default UserCard;
