"use client";

import React, { useEffect, useState } from "react";
import { Plus, Loader2, ChevronLeft, ChevronRight } from "lucide-react";
import UserCard from "@/components/user/UserCard";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getUsers, deactivateUser, activateUser } from "@/actions/user.actions";
import { User } from "@/types/user.types";
import { toast } from "sonner";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import { usePermissions } from "@/hooks/usepermissions";

export default function UsersPage() {
  const router = useRouter();
  const permissions = usePermissions();
  // --- State ---
  const [userList, setUserList] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalUsers, setTotalUsers] = useState(0);

  // Action Loading State
  const [deactivatingId, setDeactivatingId] = useState<string | null>(null);
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

      console.log("Fetched Users:", response);

      if (response.success && response.data) {
        setUserList(response.data);
        setTotalUsers(23); // Mocking 23 to match your screenshot requirement for now
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

  useEffect(() => {
    fetchUsers();
  }, [currentPage, itemsPerPage]);

  // --- Handlers ---

  const handleEdit = (userId: string) => {
    router.push(`/user/edit-user/${userId}`);
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

  const handleEnableMFA = (id: string) => console.log("Enable MFA for", id);

  // --- Pagination Logic ---
  const totalPages = Math.ceil(totalUsers / itemsPerPage);
  const startResult = (currentPage - 1) * itemsPerPage + 1;
  const endResult = Math.min(currentPage * itemsPerPage, totalUsers);

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <main className="min-h-screen flex flex-col">
      <div className="mx-auto w-full flex-1">
        {/* --- Header Section --- */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              User Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage your team members, their roles, and security settings.
            </p>
          </div>
          {permissions.canCreateUser && (
            <Link
              href="/user/add-user"
              className="flex items-center justify-center gap-2 rounded-lg bg-[#164e87] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d]"
            >
              <Plus size={18} /> Add User
            </Link>
          )}
        </div>

        {/* --- Content Section --- */}
        <div className="space-y-6 pb-20">
          {/* A. Loading State */}
          {isLoading && (
            <div className="relative h-40 w-full">
              <LoadingOverlay loadingText="Loading users..." />
            </div>
          )}
          {/* B. Empty State */}
          {!isLoading && !error && userList.length === 0 && (
            <div className="rounded-lg border border-dashed border-gray-300 p-10 text-center text-gray-500">
              No users found. Click "Add User" to create one.
            </div>
          )}
          {/* C. Data Loaded */}
          {!isLoading &&
            !error &&
            userList.length > 0 &&
            userList.map((user) => (
              <div key={user.id} className="relative">
                {togglingId === user.id && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-xl bg-white/60 backdrop-blur-sm">
                    <Loader2 className="h-8 w-8 animate-spin text-[#164e87]" />
                  </div>
                )}

                <UserCard
                  user={user}
                  onEdit={handleEdit}
                  canEdit={permissions.canUpdateUser}
                  onToggleStatus={handleToggleStatus}
                  onEnableMFA={handleEnableMFA}
                />
              </div>
            ))}
        </div>
      </div>

      {/* --- Footer: Pagination Section --- */}
      {!isLoading && !error && userList.length > 0 && (
        <div className="sticky bottom-0 mt-auto w-full border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            {/* Left: Results Text */}
            <div className="text-sm text-gray-700">
              Results: <span className="font-medium">{startResult}</span> -{" "}
              <span className="font-medium">{endResult}</span> of{" "}
              <span className="font-medium">{totalUsers}</span>
            </div>

            {/* Center: Pagination Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronLeft size={20} />
              </button>

              {/* Page Numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                  (page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[32px] rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                        currentPage === page
                          ? "bg-[#00cba0] text-white"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      {page}
                    </button>
                  ),
                )}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="rounded-md p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <ChevronRight size={20} />
              </button>
            </div>

            {/* Right: Limit Selector */}
            <div className="flex items-center gap-3">
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="h-9 cursor-pointer rounded-md border border-gray-300 bg-[#2c3e50] px-3 py-1 text-sm font-medium text-white hover:bg-[#34495e] focus:outline-none focus:ring-2 focus:ring-[#164e87]"
              >
                <option value={5}>5</option>
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
              <span className="text-sm text-gray-500">Results per page</span>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
