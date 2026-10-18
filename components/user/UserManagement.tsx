"use client";

import React, { useEffect, useState } from "react";
import { Plus, Loader2, Eye, Pencil, Power, PlayCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { getUsers, deactivateUser, activateUser } from "@/actions/user.actions";
import { User } from "@/types/user.types";
import { toast } from "sonner";
import AddUserForm from "./AddUserForm";
import PaginationControls from "@/components/ui/PaginationControls";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import { usePermissions } from "@/hooks/usepermissions";
import { DataTable, Column } from "@/components/common/table/DataTable";

export default function UserManagement() {
  const router = useRouter();
  const permissions = usePermissions();

  const getRoleColorStyles = (role: string) => {
    const normalizedRole = role?.toLowerCase?.() || "";
    if (normalizedRole.includes("admin")) {
      return "bg-chart-6 dark:text-purple-300 text-purple-700";
    }
    if (normalizedRole.includes("compliance")) {
      return "bg-chart-4 text-blue-700 dark:text-blue-200";
    }
    if (normalizedRole.includes("risk")) {
      return "bg-chart-1 text-red-700 dark:text-red-200";
    }
    if (normalizedRole.includes("auditor")) {
      return "bg-chart-5 text-green-700 dark:text-green-200";
    }
    if (normalizedRole.includes("devops")) {
      return "bg-chart-3 text-orange-700 dark:text-orange-200";
    }
    return "bg-chart-2 text-orange-600 dark:text-yellow-200 ";
  };

  // --- View State ---
  const [currentView, setCurrentView] = useState<"list" | "add">("list");

  // --- Data State ---
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Action Loading State
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // --- Fetch Data ---
  const fetchUsers = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getUsers({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (response.success && response.data) {
        setUserList(response.data);
        // Extract total from pagination metadata
        const paginationTotal = (response as any)?.pagination?.total;
        if (typeof paginationTotal === "number") {
          setTotalUsers(paginationTotal);
        } else {
          // Fallback: if no pagination info, use data length
          // This means pagination won't work properly without backend support
          setTotalUsers(response.data.length);
        }
      } else {
        setError(response.message || "Failed to load users");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while fetching users.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch on mount or change
  useEffect(() => {
    if (currentView === "list") {
      fetchUsers();
    }
  }, [currentPage, itemsPerPage, currentView]);

  // --- Handlers ---

  const handleAddClick = () => {
    setCurrentView("add");
  };

  const handleEditClick = (userId: string) => {
    router.push(`/users/${userId}/edit`);
  };

  const handleViewClick = (userId: string) => {
    router.push(`/users/${userId}`);
  };

  const handleBackToList = (refresh: boolean = false) => {
    setCurrentView("list");
    if (refresh) {
      fetchUsers();
    }
  };

  const handleToggleStatus = (user: User) => {
    const isSuspended =
      user.status === "suspended" || user.status === "inactive";
    const actionType = isSuspended ? "Activate" : "Deactivate";

    toast.warning(`Are you sure you want to ${actionType} this user?`, {
      action: {
        label: actionType,
        onClick: async () => {
          setTogglingId(user.id);

          try {
            let response;
            if (isSuspended) {
              response = await activateUser(user.id);
            } else {
              response = await deactivateUser(user.id);
            }

            if (response.success) {
              toast.success(`${actionType}d successfully`);
              await fetchUsers();
            } else {
              toast.error(`Failed to ${actionType}: ${response.message}`);
            }
          } catch (error) {
            console.error(error);
            toast.error(
              `An error occurred while trying to ${actionType} user.`,
            );
          } finally {
            setTogglingId(null);
          }
        },
      },
      cancel: {
        label: "Cancel",
        onClick: () => toast.dismiss(),
      },
    });
  };

  // --- Pagination Logic ---
  const totalPages = Math.ceil(totalUsers / itemsPerPage) || 1;

  const columns: Column<User>[] = [
    {
      key: "name",
      label: "Name",
      render: (value) => (
        <span className="font-medium text-foreground">{value}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => {
        const isSuspended = value === "inactive" || value === "suspended";
        return (
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              !isSuspended
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {value}
          </span>
        );
      },
    },
    {
      key: "role",
      label: "Role",
      render: (value) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getRoleColorStyles(
            value,
          )}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "email",
      label: "Email",
      render: (value) => <span className="text-muted-foreground">{value}</span>,
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_, row) => {
        const isSuspended =
          row.status === "inactive" || row.status === "suspended";
        const isBusy = togglingId === row.id;

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleViewClick(row.id)}
              className="flex items-center gap-2 rounded-lg cursor-pointer border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/30"
            >
              <Eye size={14} /> View
            </button>

            {permissions.canUpdateUser && (
              <button
                onClick={() => handleEditClick(row.id)}
                className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 cursor-pointer text-xs font-medium text-foreground transition-colors hover:bg-muted/30 border border-border"
              >
                <Pencil size={14} /> Edit
              </button>
            )}

            <button
              onClick={() => handleToggleStatus(row)}
              disabled={isBusy}
              className={`flex items-center gap-2 rounded-lg border cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                isSuspended
                  ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300"
                  : "border-border bg-card text-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200"
              }`}
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSuspended ? (
                <PlayCircle size={14} />
              ) : (
                <Power size={14} />
              )}
              {isBusy ? "Processing" : isSuspended ? "Activate" : "Deactivate"}
            </button>
          </div>
        );
      },
    },
  ];

  // --- RENDER VIEWS ---

  // 1. ADD View
  if (currentView === "add") {
    return (
      <div className="h-full">
        <AddUserForm
          onSuccess={() => handleBackToList(true)}
          onCancel={() => handleBackToList(false)}
        />
      </div>
    );
  }

  // 2. LIST View (Default)
  return (
    <div className="flex flex-col h-full">
      <div className="w-full flex-1">
        {/* --- Header Section --- */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              User Management
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage your team members, their roles, and security settings.
            </p>
          </div>

          {permissions.canCreateUser && (
            <button
              onClick={handleAddClick}
              className="flex items-center space-x-1.5 px-4 py-3 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium cursor-pointer"
            >
              <Plus size={18} /> Add User
            </button>
          )}
        </div>

        {/* --- Content Section --- */}
        <div className="space-y-6 pb-8">
          {/* A. Loading State */}
          {isLoading && (
            <div className="relative h-40 w-full">
              <LoadingOverlay loadingText="Loading users..." />
            </div>
          )}

          {/* B. Empty State */}
          {!isLoading && !error && userList.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
              No users found. Click "Add User" to create one.
            </div>
          )}

          {/* C. Data Loaded */}
          {!isLoading && !error && userList.length > 0 && (
            <DataTable<User>
              data={userList}
              columns={columns}
              rowKey={(row) => row.id}
            />
          )}
        </div>
      </div>

      {/* --- Footer: Pagination Section (replaced with PaginationControls) --- */}
      {!isLoading && !error && userList.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={itemsPerPage}
          totalRecords={totalUsers}
          onPageChange={(p) => setCurrentPage(p)}
          onPageSizeChange={(size) => {
            setItemsPerPage(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 20, 50]}
          className="mt-auto w-full"
        />
      )}
    </div>
  );
}
