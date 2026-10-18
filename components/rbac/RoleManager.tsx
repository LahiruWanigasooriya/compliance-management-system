// components/RoleManager.tsx
import React, { useState, useEffect } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { Role, getAllRoles, deleteRole } from "../../actions/role.actions";
import { Badge } from "../ui/Shared";
import {
  Edit2,
  Trash2,
  Eye,
  Plus,
  ShieldAlert,
  Loader2,
  AlertCircle,
  CheckCircle,
  Download,
  Search,
  ArrowUpCircle,
} from "lucide-react";
import { startCase } from "lodash";
import { RoleModal } from "./RoleModal";
import LoadingOverlay from "@/components/layout/LoadingOverlay";

export const RoleManager: React.FC<{
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ canCreate, canUpdate, canDelete }) => {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Fetch roles on component mount
  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllRoles();
      if (result.success && result.data) {
        setRoles(result.data.roles);
      } else {
        setError(result.message || "Failed to fetch roles");
        toast.error(result.message || "Failed to fetch roles");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!roleId) return;

    if (
      !confirm(
        `Are you sure you want to delete the role "${roleName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      const result = await deleteRole(roleId);

      if (result.success) {
        setRoles((prev) => prev.filter((role) => role.id !== roleId));
        toast.success(`Role "${roleName}" deleted successfully`);
      } else {
        toast.error(result.message || "Failed to delete role");
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditRole = (role: Role) => {
    setSelectedRole(role);
    setIsEditOpen(true);
  };

  const handleRoleCreatedOrUpdated = () => {
    // Refresh the roles list
    fetchRoles();
    setIsEditOpen(false);
    setSelectedRole(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Truncate description for table display
  const truncateDescription = (description: string, maxLength: number = 60) => {
    if (!description) return "No description";
    if (description.length <= maxLength) return description;
    return description.substring(0, maxLength) + "...";
  };

  if (loading) {
    return (
      <div className="relative h-64">
        <LoadingOverlay loadingText="Loading roles..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">Failed to load roles</h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchRoles}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Roles Management
          </h2>
          <p className="text-muted-foreground text-sm">
            Manage user roles, inheritance, and permissions.
            <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 border border-emerald-500  px-2 py-1 rounded">
              {roles.length} role{roles.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setSelectedRole(null);
              setIsEditOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Create New Role
          </button>
        )}
      </div>

      {/* HIERARCHY INFO */}
      <div className="bg-emerald-50/50 rounded-lg border border-emerald-100 p-4 flex items-start space-x-3">
        <div className="bg-emerald-100 p-1.5 rounded-md">
          <ShieldAlert size={18} className="text-emerald-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Role Hierarchy & Inheritance
          </p>
          <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
            Higher-level roles automatically inherit privileges from lower
            privilege levels. Each role is linked to a privilege level and
            inherits all permissions from that level.
          </p>
        </div>
      </div>

      {/* ROLES TABLE */}
      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {roles.length === 0 ? (
            <div className="text-center py-12">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No roles found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first role
              </p>
              <button
                onClick={() => {
                  setSelectedRole(null);
                  setIsEditOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium"
              >
                <Plus size={16} /> Create New Role
              </button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary text-white font-semibold border-b border-border whitespace-nowrap">
                <tr>
                  <th className="px-6 py-3">Role Name</th>
                  <th className="px-6 py-3">Description</th>
                  <th className="px-6 py-3">Privilege Level</th>
                  <th className="px-6 py-3">Permissions</th>
                  <th className="px-6 py-3">Updated</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {roles.map((role) => (
                  <tr
                    key={role.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-6 py-3">
                      <div className="font-medium text-foreground">
                        {startCase(role.roleName)}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex items-start gap-2">
                        {role.description ? (
                          <span className="text-sm text-muted-foreground">
                            {truncateDescription(role.description)}
                          </span>
                        ) : (
                          <span className="text-sm text-muted-foreground italic whitespace-nowrap">
                            No Description
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3">
                      {(() => {
                        const val = role.privilegeLevel;
                        // Handle case where privilegeLevel is an object or a number
                        const levelValue =
                          typeof val === "object" && val !== null
                            ? (val as any).levelValue
                            : Number(val) || 5;

                        const levelColorMap: Record<number, string> = {
                          1: "bg-emerald-700 text-white border-emerald-600",
                          2: "bg-emerald-600 text-white border-emerald-500",
                          3: "bg-emerald-600/80 text-white border-emerald-400",
                          4: "bg-emerald-500/90 text-white border-emerald-300",
                          5: "bg-emerald-400 text-white border-emerald-200",
                        };
                        return (
                          <span
                            className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm transition-colors border
                              ${levelColorMap[levelValue] ?? "bg-slate-100 text-slate-600 border-slate-200"}
                          `}
                          >
                            {levelValue}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-3">
                      <div className="flex flex-wrap gap-2">
                        {role.privileges && role.privileges.length > 0 ? (
                          role.privileges.slice(0, 4).map((priv, idx) => (
                            <span
                              key={idx}
                              className="text-xs bg-muted text-foreground px-2 py-1 rounded"
                            >
                              {startCase(priv.resource)}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-muted-foreground whitespace-nowrap">
                            No Permissions
                          </span>
                        )}
                        {role.privileges && role.privileges.length > 4 && (
                          <span className="text-xs text-muted-foreground self-center">
                            +{role.privileges.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">
                      {formatDate(role.updatedAt)}
                    </td>
                    <td className="px-6 py-3 flex justify-end gap-2">
                      {/* <Link
                        href={`/roles/${role.id}`}
                        className="p-1.5 text-primary-foreground hover:text-indigo-600 bg-card border rounded shadow-sm flex items-center justify-center"
                        title="View Full Details"
                      >
                        <Eye size={16} />
                      </Link> */}

                      {canUpdate && (
                        <button
                          onClick={() => handleEditRole(role)}
                          className="p-1.5 text-primary-foreground bg-card hover:text-amber-600 border rounded shadow-sm"
                          title="Edit Role"
                          disabled={isDeleting}
                        >
                          <Edit2 size={16} />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() =>
                            handleDeleteRole(role.id, role.roleName)
                          }
                          className="p-1.5 text-primary-foreground hover:text-red-600 bg-card border rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete Role"
                          disabled={isDeleting}
                        >
                          {isDeleting ? (
                            <Loader2 size={16} className="animate-spin" />
                          ) : (
                            <Trash2 size={16} />
                          )}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT/CREATE MODAL */}
      <RoleModal
        role={selectedRole}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedRole(null);
        }}
        onSuccess={handleRoleCreatedOrUpdated}
      />
    </div>
  );
};
