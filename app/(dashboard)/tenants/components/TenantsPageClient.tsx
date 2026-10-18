"use client";

import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Loader2,
  Eye,
  Pencil,
  Power,
  PlayCircle,
  Trash2,
  Building2,
  Search,
  Filter,
  RefreshCw,
  AlertCircle,
  Globe,
} from "lucide-react";
import {
  getTenants,
  suspendTenant,
  activateTenant,
  deleteTenant,
} from "@/actions/tenant.actions";
import type { Tenant } from "@/types/tenant.types";
import { toast } from "sonner";
import PaginationControls from "@/components/ui/PaginationControls";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import { DataTable, Column } from "@/components/common/table/DataTable";
import SummaryCard from "@/components/layout/SummaryCard";
import { ICONS } from "@/constants/constants";
import ConfirmationModal from "@/components/common/ConfirmationModal";

export default function TenantsPageClient() {
  const router = useRouter();

  // --- Data State ---
  const [tenantList, setTenantList] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Action Loading State
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "suspend" | "activate" | "delete";
    tenant: Tenant | null;
  }>({ isOpen: false, type: "suspend", tenant: null });

  // --- Stats ---
  const stats = useMemo(() => {
    const active = tenantList.filter((t) => t.status === "active").length;
    const suspended = tenantList.filter((t) => t.status === "suspended").length;
    const inactive = tenantList.filter((t) => t.status === "inactive").length;
    return { total: tenantList.length, active, suspended, inactive };
  }, [tenantList]);

  // --- Filtered Data ---
  const filteredTenants = useMemo(() => {
    let result = tenantList;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.name.toLowerCase().includes(query) ||
          t.subdomain.toLowerCase().includes(query) ||
          t.industry?.toLowerCase().includes(query)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }

    return result;
  }, [tenantList, searchQuery, statusFilter]);

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
        page: 1,
        limit: 1000,
      });

      if (response.success && response.data) {
        setTenantList(response.data);
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
    fetchTenants();
  }, []);

  // --- Handlers ---
  const handleAddClick = () => {
    router.push("/tenants/add");
  };

  const handleEditClick = (tenant: Tenant) => {
    router.push(`/tenants/${tenant.id}/edit`);
  };

  const handleViewClick = (tenant: Tenant) => {
    router.push(`/tenants/${tenant.id}`);
  };

  const handleToggleStatus = (tenant: Tenant) => {
    const isSuspended =
      tenant.status === "suspended" || tenant.status === "inactive";
    setConfirmModal({
      isOpen: true,
      type: isSuspended ? "activate" : "suspend",
      tenant,
    });
  };

  const handleDeleteTenant = (tenant: Tenant) => {
    setConfirmModal({
      isOpen: true,
      type: "delete",
      tenant,
    });
  };

  const handleConfirmAction = async () => {
    if (!confirmModal.tenant) return;

    const tenant = confirmModal.tenant;
    const actionType = confirmModal.type;

    if (actionType === "delete") {
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
    } else {
      setTogglingId(tenant.id);
      try {
        const response =
          actionType === "activate"
            ? await activateTenant(tenant.id)
            : await suspendTenant(tenant.id);

        if (response.success) {
          toast.success(`Tenant ${actionType}d successfully`);
          await fetchTenants();
        } else {
          toast.error(`Failed to ${actionType}: ${response.message}`);
        }
      } catch (error) {
        console.error(error);
        toast.error(`An error occurred while trying to ${actionType} tenant.`);
      } finally {
        setTogglingId(null);
      }
    }

    setConfirmModal({ isOpen: false, type: "suspend", tenant: null });
  };

  const closeConfirmModal = () => {
    setConfirmModal({ isOpen: false, type: "suspend", tenant: null });
  };

  // --- Pagination Logic ---
  const paginatedTenants = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredTenants.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredTenants, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(filteredTenants.length / itemsPerPage) || 1;

  const columns: Column<Tenant>[] = [
    {
      key: "name",
      label: "Organization",
      render: (value, row) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#164e87]/10 dark:bg-[#164e87]/20">
            <Building2 size={20} className="text-[#164e87]" />
          </div>
          <div>
            <p className="font-medium text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Globe size={10} />
              {row.subdomain}.vesant.ai
            </p>
          </div>
        </div>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (value) => (
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-semibold capitalize ${getStatusColorStyles(
            value
          )}`}
        >
          {value}
        </span>
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
      key: "createdAt",
      label: "Created",
      render: (value) => (
        <span className="text-muted-foreground text-sm">
          {value ? new Date(value).toLocaleDateString() : "-"}
        </span>
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
              className="flex items-center gap-1.5 rounded-lg cursor-pointer border border-border bg-card px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted/30"
              title="View Details"
            >
              <Eye size={14} /> View
            </button>

            <button
              onClick={() => handleEditClick(row)}
              className="flex items-center gap-1.5 rounded-lg bg-card px-3 py-1.5 cursor-pointer text-xs font-medium text-foreground transition-colors hover:bg-muted/30 border border-border"
              title="Edit Tenant"
            >
              <Pencil size={14} /> Edit
            </button>

            <button
              onClick={() => handleToggleStatus(row)}
              disabled={isBusy}
              className={`flex items-center gap-1.5 rounded-lg border cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60 ${
                isSuspended
                  ? "border-green-200 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-300 dark:border-green-800 dark:bg-green-900/20 dark:text-green-400"
                  : "border-border bg-card text-foreground hover:bg-yellow-50 hover:text-yellow-600 hover:border-yellow-200 dark:hover:bg-yellow-900/20 dark:hover:text-yellow-400"
              }`}
              title={isSuspended ? "Activate Tenant" : "Suspend Tenant"}
            >
              {isBusy ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : isSuspended ? (
                <PlayCircle size={14} />
              ) : (
                <Power size={14} />
              )}
              {isBusy ? "..." : isSuspended ? "Activate" : "Suspend"}
            </button>

            <button
              onClick={() => handleDeleteTenant(row)}
              disabled={isDeleting}
              className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 text-red-700 cursor-pointer px-3 py-1.5 text-xs font-medium transition-colors hover:bg-red-100 hover:border-red-300 disabled:opacity-60 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400"
              title="Delete Tenant"
            >
              {isDeleting ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Building2 className="h-7 w-7 text-[#164e87]" />
            Tenant Management
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage organizations and tenant configurations
          </p>
        </div>

        <button
          onClick={handleAddClick}
          className="flex items-center justify-center gap-2 rounded-lg bg-[#164e87] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d] cursor-pointer"
        >
          <Plus size={18} /> Add Tenant
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          title="Total Tenants"
          value={stats.total}
          mainColor="blue"
          icon={ICONS.Building}
          bottomLabel="Organizations"
        />
        <SummaryCard
          title="Active Tenants"
          value={stats.active}
          mainColor="green"
          icon={ICONS.CheckCircle}
          bottomLabel="Currently active"
        />
        <SummaryCard
          title="Suspended"
          value={stats.suspended}
          mainColor="red"
          icon={ICONS.AlertCircle}
          bottomLabel="Requires attention"
        />
        <SummaryCard
          title="Inactive"
          value={stats.inactive}
          mainColor="orange"
          icon={ICONS.Clock}
          bottomLabel="Not active"
        />
      </div>

      {/* Filters & Search */}
      <div className="bg-card rounded-xl border border-border p-4 shadow-sm">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1 max-w-md">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />
            <input
              type="text"
              placeholder="Search by name, subdomain, or industry..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full rounded-lg border border-border bg-card py-2.5 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
            />
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-muted-foreground" />
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="rounded-lg border border-border bg-card px-3 py-2 text-sm text-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>

            <button
              onClick={fetchTenants}
              disabled={isLoading}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw
                size={16}
                className={isLoading ? "animate-spin" : ""}
              />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="bg-card rounded-xl border border-border shadow-sm">
        {/* Loading State */}
        {isLoading && (
          <div className="relative h-60 w-full">
            <LoadingOverlay loadingText="Loading tenants..." />
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-700 dark:border-red-800 dark:bg-red-900/20 dark:text-red-400">
              <div className="flex items-center gap-2">
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && filteredTenants.length === 0 && (
          <div className="p-12 text-center">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-medium text-foreground">
              No tenants found
            </h3>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchQuery || statusFilter !== "all"
                ? "Try adjusting your search or filters"
                : "Get started by creating your first tenant"}
            </p>
            {!searchQuery && statusFilter === "all" && (
              <button
                onClick={handleAddClick}
                className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[#164e87] px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d] cursor-pointer"
              >
                <Plus size={16} /> Add Tenant
              </button>
            )}
          </div>
        )}

        {/* Data Table */}
        {!isLoading && !error && paginatedTenants.length > 0 && (
          <div className="p-4">
            <DataTable<Tenant>
              data={paginatedTenants}
              columns={columns}
              rowKey={(row) => row.id}
            />
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !error && filteredTenants.length > 0 && (
          <div className="border-t border-border p-4">
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              pageSize={itemsPerPage}
              totalRecords={filteredTenants.length}
              onPageChange={(p) => setCurrentPage(p)}
              onPageSizeChange={(size) => {
                setItemsPerPage(size);
                setCurrentPage(1);
              }}
              pageSizeOptions={[5, 10, 20, 50]}
            />
          </div>
        )}
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        onCancel={closeConfirmModal}
        onConfirm={handleConfirmAction}
        isLoading={
          confirmModal.type === "delete"
            ? deletingId === confirmModal.tenant?.id
            : togglingId === confirmModal.tenant?.id
        }
        title={
          confirmModal.type === "delete"
            ? `Delete "${confirmModal.tenant?.name}"?`
            : confirmModal.type === "activate"
            ? `Activate "${confirmModal.tenant?.name}"?`
            : `Suspend "${confirmModal.tenant?.name}"?`
        }
        description={
          confirmModal.type === "delete"
            ? "This action cannot be undone. All tenant data will be permanently deleted."
            : confirmModal.type === "activate"
            ? "This will restore access to the tenant and all its users."
            : "This will temporarily disable access to the tenant and all its users."
        }
        confirmLabel={
          confirmModal.type === "delete"
            ? "Delete"
            : confirmModal.type === "activate"
            ? "Activate"
            : "Suspend"
        }
        loadingLabel={
          confirmModal.type === "delete"
            ? "Deleting..."
            : confirmModal.type === "activate"
            ? "Activating..."
            : "Suspending..."
        }
        variant={
          confirmModal.type === "delete"
            ? "danger"
            : confirmModal.type === "activate"
            ? "success"
            : "warning"
        }
        icon={
          confirmModal.type === "delete" ? (
            <Trash2 className="w-6 h-6 text-red-600 dark:text-red-400" />
          ) : confirmModal.type === "activate" ? (
            <PlayCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
          ) : (
            <Power className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
          )
        }
      />
    </div>
  );
}
