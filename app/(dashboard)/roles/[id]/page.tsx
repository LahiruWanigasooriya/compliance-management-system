// app/roles/[id]/page.tsx
"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { toast } from "sonner";
import { getRole, deleteRole, type Role } from "@/actions/role.actions";
import {
  ArrowLeft,
  Edit2,
  Trash2,
  Loader2,
  AlertCircle,
  ShieldCheck,
  Clock,
  Layers,
  Key,
  FileText,
} from "lucide-react";
import { Badge } from "@/components/ui/Shared";

export default function RoleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const roleId = params.id as string;

  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    if (roleId) {
      fetchRoleDetails();
    }
  }, [roleId]);

  const fetchRoleDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getRole(roleId);

      if (result.success && result.data) {
        setRole(result.data as unknown as Role);
      } else {
        setError(result.message || "Failed to fetch role details");
        toast.error(result.message || "Failed to fetch role details");
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

  const handleDelete = async () => {
    if (!role) return;

    if (
      !confirm(
        `Are you sure you want to delete the role "${role.roleName}"? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      const result = await deleteRole(roleId);

      if (result.success) {
        toast.success(`Role "${role.roleName}" deleted successfully`);
        router.push("/");
      } else {
        toast.error(result.message || "Failed to delete role");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to delete role";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return dateString;
    }
  };

  const getActionLabel = (action: any): string => {
    const labels: string[] = [];
    if (action.create) labels.push("Create");
    if (action.get) labels.push("View");
    if (action.update) labels.push("Edit");
    if (action.delete) labels.push("Delete");
    if (action.approve) labels.push("Approve");
    if (action.export) labels.push("Export");
    if (action.query) labels.push("Query");
    if (action.escalate) labels.push("Escalate");
    return labels.length > 0 ? labels.join(", ") : "No actions";
  };

  if (loading) {
    return (
      <div className="min-h-screen ">
        <div className="max-w-7xl mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-4" />
              <p className="text-sm text-muted-foreground">
                Loading role details...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !role) {
    return (
      <div className="min-h-screen ">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">
                  Failed to load role details
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {error || "Role not found"}
                </p>
                <div className="flex gap-3 mt-4">
                  <button
                    onClick={fetchRoleDetails}
                    className="px-4 py-2 bg-destructive text-primary-foreground text-sm font-medium rounded-md hover:bg-destructive/90 transition-colors"
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => router.push("/")}
                    className="px-4 py-2 bg-card text-foreground text-sm font-medium rounded-md border border-border hover:bg-muted transition-colors"
                  >
                    Back to Roles
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen ">
      {/* Header */}
      <header className="border-b border-border shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 hover:bg-muted rounded-md transition-colors"
                title="Back to Roles"
              >
                <ArrowLeft size={20} className="text-muted-foreground" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  Role Details
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  View and manage role configuration
                </p>
              </div>
            </div>
            {/* <div className="flex gap-2">
              <button
                onClick={() => router.push(`/roles/${roleId}/edit`)}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-md flex items-center gap-2 text-sm font-medium transition-colors"
              >
                <Edit2 size={16} />
                Edit Role
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md flex items-center gap-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Trash2 size={16} />
                )}
                Delete Role
              </button>
            </div> */}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Basic Information Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <ShieldCheck className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Basic Information
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1">
                Role Name
              </label>
              <p className="text-lg font-semibold text-foreground">
                {role.roleName}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Layers size={16} />
                Privilege Level
              </label>
              <Badge color="blue">
                Level <>{role.privilegeLevel}</>
              </Badge>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <FileText size={16} />
                Description
              </label>
              <p className="text-foreground">
                {role.description || "No description provided"}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Clock size={16} />
                Created At
              </label>
              <p className="text-foreground">{formatDate(role.createdAt)}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Clock size={16} />
                Last Updated
              </label>
              <p className="text-foreground">{formatDate(role.updatedAt)}</p>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-muted-foreground mb-1 flex items-center gap-2">
                <Key size={16} />
                Role ID
              </label>
              <p className="text-sm font-mono text-foreground bg-muted px-3 py-2 rounded border border-border">
                {role.id}
              </p>
            </div>
          </div>
        </div>

        {/* Permissions Card */}
        <div className="bg-card border border-border rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <Key className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-semibold text-foreground">
              Permissions & Privileges
            </h2>
          </div>

          {role.privileges && role.privileges.length > 0 ? (
            <div className="space-y-4">
              {role.privileges.map((privilege, index) => (
                <div
                  key={index}
                  className="border border-border rounded-lg p-4 hover:border-indigo-300 transition-colors bg-muted/20"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {privilege.resource}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        Resource permissions and allowed actions
                      </p>
                    </div>
                    <Badge>
                      {privilege.actions.length} action
                      {privilege.actions.length !== 1 ? "s" : ""}
                    </Badge>
                  </div>

                  <div className="space-y-2">
                    {privilege.actions.map((action, actionIndex) => (
                      <div
                        key={actionIndex}
                        className="bg-muted/30 rounded-md p-3"
                      >
                        <div className="flex flex-wrap gap-2">
                          {action.create && (
                            <span className="px-3 py-1 bg-chart-5 text-green-700 dark:text-green-400 rounded-full text-xs font-medium">
                              Create
                            </span>
                          )}
                          {action.get && (
                            <span className="px-3 py-1 bg-chart-4 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                              View
                            </span>
                          )}
                          {action.update && (
                            <span className="px-3 py-1 bg-chart-2 text-amber-700 dark:text-amber-300 rounded-full text-xs font-medium">
                              Edit
                            </span>
                          )}
                          {action.delete && (
                            <span className="px-3 py-1 bg-chart-1 text-red-700 dark:text-red-300 rounded-full text-xs font-medium">
                              Delete
                            </span>
                          )}
                          {action.approve && (
                            <span className="px-3 py-1 bg-chart-6 text-purple-700 dark:text-purple-400 rounded-full text-xs font-medium">
                              Approve
                            </span>
                          )}
                          {action.export && (
                            <span className="px-3 py-1 bg-chart-4 text-blue-700 dark:text-blue-300 rounded-full text-xs font-medium">
                              Export
                            </span>
                          )}
                          {action.query && (
                            <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                              Query
                            </span>
                          )}
                          {action.escalate && (
                            <span className="px-3 py-1 bg-chart-2 dark:text-orange-300 text-orange-700 rounded-full text-xs font-medium">
                              Escalate
                            </span>
                          )}
                        </div>
                        {!action.create &&
                          !action.get &&
                          !action.update &&
                          !action.delete &&
                          !action.approve &&
                          !action.export &&
                          !action.query &&
                          !action.escalate && (
                            <span className="text-sm text-slate-400 italic">
                              No actions enabled
                            </span>
                          )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Key className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
              <p className="text-foreground">No permissions assigned</p>
              <p className="text-sm text-muted-foreground mt-1">
                This role currently has no specific permissions configured
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
