"use client";

import { useEffect, useState } from "react";
import {
  Plus,
  Loader2,
  Eye,
  Pencil,
  Power,
  PlayCircle,
  Trash2,
  Building2,
  Globe,
  CreditCard,
} from "lucide-react";
import {
  getTenants,
  suspendTenant,
  activateTenant,
  deleteTenant,
} from "@/actions/tenant.actions";
import type { Tenant } from "@/types/tenant.types";
import { toast } from "sonner";
import AddTenantForm from "./AddTenantForm";
import EditTenantForm from "./EditTenantForm";
import TenantDetailsModal from "./TenantDetailsModal";
import PaginationControls from "@/components/ui/PaginationControls";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import { DataTable, Column } from "@/components/common/table/DataTable";

export default function TenantManagement() {
  // --- View State ---
  const [currentView, setCurrentView] = useState<
    "list" | "add" | "edit" | "view"
  >("list");
  const [selectedTenant, setSelectedTenant] = useState<Tenant | null>(null);

  // --- Data State ---
  const [tenantList, setTenantList] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalTenants, setTotalTenants] = useState(0);

  // Action Loading State
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const getPlanColorStyles = (plan: string) => {
    const normalizedPlan = plan?.toLowerCase?.() || "";
    if (normalizedPlan === "enterprise") {
      return "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300";
    }
    if (normalizedPlan === "professional") {
      return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
    }
    return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
  };

  const getStatusColorStyles = (status: string) => {
    const normalizedStatus = status?.toLowerCase?.() || "";
    if (normalizedStatus === "active") {
      return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300";
    }
    if (normalizedStatus === "suspended") {
      return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
    }
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
  };

  // --- Fetch Data ---
  const fetchTenants = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await getTenants({
        page: currentPage,
        limit: itemsPerPage,
      });

      if (response.success && response.data) {
        setTenantList(response.data);
        const paginationTotal = (response as any)?.pagination?.total;
        if (typeof paginationTotal === "number") {
          setTotalTenants(paginationTotal);
        } else {
          setTotalTenants(response.data.length);
        }
      } else {
        setError(response.message || "Failed to load tenants");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred while fetching tenants.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (currentView === "list") {
      fetchTenants();
    }
  }, [currentPage, itemsPerPage, currentView]);

  // --- Handlers ---
  const handleAddClick = () => {
    setCurrentView("add");
  };

  const handleEditClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setCurrentView("edit");
  };

  const handleViewClick = (tenant: Tenant) => {
    setSelectedTenant(tenant);
    setCurrentView("view");
  };

  const handleBackToList = (refresh: boolean = false) => {
    setCurrentView("list");
    setSelectedTenant(null);
    if (refresh) {
      fetchTenants();
    }
  };

  const handleToggleStatus = (tenant: Tenant) => {
    const isSuspended =
      tenant.status === "suspended" || tenant.status === "inactive";
    const actionType = isSuspended ? "Activate" : "Suspend";

    toast.warning(`Are you sure you want to ${actionType} this tenant?`, {
      action: {
        label: actionType,
        onClick: async () => {
          setTogglingId(tenant.id);

          try {
            let response;
            if (isSuspended) {
              response = await activateTenant(tenant.id);
            } else {
              response = await suspendTenant(tenant.id);
            }

            if (response.success) {
              toast.success(`Tenant ${actionType.toLowerCase()}d successfully`);
              await fetchTenants();
            } else {
              toast.error(`Failed to ${actionType}: ${response.message}`);
            }
          } catch (error) {
            console.error(error);
            toast.error(
              `An error occurred while trying to ${actionType} tenant.`
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

  const handleDeleteTenant = (tenant: Tenant) => {
    toast.error(`Are you sure you want to delete "${tenant.name}"?`, {
      description: "This action cannot be undone.",
      action: {
        label: "Delete",
        onClick: async () => {
          setDeletingId(tenant.id);

          try {
            const response = await deleteTenant(tenant.id);

            if (response.success) {
              toast.success("Tenant deleted successfully");
              await fetchTenants();
            } else {
              toast.error(`Failed to delete: ${response.message}`);
            }
          } catch (error) {
            console.error(error);
            toast.error("An error occurred while trying to delete tenant.");
          } finally {
            setDeletingId(null);
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
  const totalPages = Math.ceil(totalTenants / itemsPerPage) || 1;

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      label: "Name",
      render: (value) => (
        <div className="flex items-center gap-2">
          <Building2 size={16} className="text-muted-foreground" />
          <span className="font-medium text-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "subdomain",
      label: "Subdomain",
      render: (value) => (
        <div className="flex items-center gap-1">
          <Globe size={14} className="text-muted-foreground" />
          <span className="text-muted-foreground">{value}</span>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${getStatusColorStyles(
            value
          )}`}
        >
          {value}
        </span>
      ),
    },
    {
      key: "plan",
      label: "Plan",
      render: (value) => (
        <div className="flex items-center gap-1">
          <CreditCard size={14} className="text-muted-foreground" />
          <span
            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize ${getPlanColorStyles(
              value
            )}`}
          >
            {value}
          </span>
        </div>
      ),
    },
    {
      key: "industry",
      label: "Industry",
      render: (value) => (
        <span className="text-muted-foreground">{value || "-"}</span>
      ),
    },
    {
      key: "actions",
      label: "Actions",
      className: "text-right",
      render: (_, row) => {
        const isSuspended =
          row.status === "inactive" || row.status === "suspended";
        const isBusy = togglingId === row.id;
        const isDeleting = deletingId === row.id;

        return (
          <div className="flex items-center justify-end gap-2">
            <button
              onClick={() => handleViewClick(row)}
              className="flex items-center gap-2 rounded-lg cursor-pointer border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/30"
            >
              <Eye size={14} /> View
            </button>

            <button
              onClick={() => handleEditClick(row)}
              className="flex items-center gap-2 rounded-lg bg-card px-3 py-1.5 cursor-pointer text-xs font-medium text-foreground transition-colors hover:bg-muted/30 border border-border"
            >
              <Pencil size={14} /> Edit
            </button>

            <button
              onClick={() => handleToggleStatus(row)}
              disabled={isBusy}
              className={`flex items-center gap-2 rounded-lg border cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                isSuspended
                  ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "border-border bg-card text-foreground hover:bg-red-50 hover:text-red-600 hover:border-red-200 dark:hover:bg-red-900/20 dark:hover:text-red-400"
              }`}
            >
              {isBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : isSuspended ? (
                <PlayCircle size={14} />
              ) : (
                <Power size={14} />
              )}
              {isBusy ? "Processing" : isSuspended ? "Activate" : "Suspend"}
            </button>

            <button
              onClick={() => handleDeleteTenant(row)}
              disabled={isDeleting}
              className="flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 text-red-700 cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-100 hover:border-red-300 disabled:opacity-60 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              Delete
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
        <AddTenantForm
          onSuccess={() => handleBackToList(true)}
          onCancel={() => handleBackToList(false)}
        />
      </div>
    );
  }

  // 2. EDIT View
  if (currentView === "edit" && selectedTenant) {
    return (
      <div className="h-full">
        <EditTenantForm
          tenant={selectedTenant}
          onSuccess={() => handleBackToList(true)}
          onCancel={() => handleBackToList(false)}
        />
      </div>
    );
  }

  // 3. VIEW Details
  if (currentView === "view" && selectedTenant) {
    return (
      <div className="h-full">
        <TenantDetailsModal
          tenant={selectedTenant}
          onClose={() => handleBackToList(false)}
        />
      </div>
    );
  }

  // 4. LIST View (Default)
  return (
    <div className="flex flex-col h-full">
      <div className="w-full flex-1">
        {/* --- Header Section --- */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-foreground">
              Tenant Management
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage organizations, their subscriptions, and settings.
            </p>
          </div>

          <button
            onClick={handleAddClick}
            className="flex items-center justify-center gap-2 rounded-lg bg-[#164e87] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d] cursor-pointer"
          >
            <Plus size={18} /> Add Tenant
          </button>
        </div>

        {/* --- Content Section --- */}
        <div className="space-y-6 pb-8">
          {/* A. Loading State */}
          {isLoading && (
            <div className="relative h-40 w-full">
              <LoadingOverlay loadingText="Loading tenants..." />
            </div>
          )}

          {/* B. Error State */}
          {!isLoading && error && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              {error}
            </div>
          )}

          {/* C. Empty State */}
          {!isLoading && !error && tenantList.length === 0 && (
            <div className="rounded-lg border border-dashed border-border p-10 text-center text-muted-foreground">
              No tenants found. Click &quot;Add Tenant&quot; to create one.
            </div>
          )}

          {/* D. Data Loaded */}
          {!isLoading && !error && tenantList.length > 0 && (
            <DataTable<Tenant>
              data={tenantList}
              columns={columns}
              rowKey={(row) => row.id}
            />
          )}
        </div>
      </div>

      {/* --- Footer: Pagination Section --- */}
      {!isLoading && !error && tenantList.length > 0 && (
        <PaginationControls
          currentPage={currentPage}
          totalPages={totalPages}
          pageSize={itemsPerPage}
          totalRecords={totalTenants}
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
