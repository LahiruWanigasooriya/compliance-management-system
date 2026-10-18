"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, Save, X, Loader2 } from "lucide-react";
import { User } from "@/types/user.types";
import { updateUser, getRoles, type Role } from "@/actions/user.actions";
import { toast } from "sonner";

// 1. Define the Validation Schema
const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: z.string().min(1, "Role is required"),
  status: z.enum(["active", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

// --- New Props Interface ---
interface EditUserFormProps {
  userData: User;
  onSuccess: () => void;
  onCancel: () => void;
}

export default function EditUserForm({
  userData,
  onSuccess,
  onCancel,
}: EditUserFormProps) {
  // const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  // 2. Initialize Form
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: userData.name,
      role: "",
      status: (userData.status === "active" ? "active" : "inactive") as
        | "active"
        | "inactive",
    },
  });

  const selectedRole = watch("role");

  // 3. Fetch Roles & Set Default Selected Role
  useEffect(() => {
    const fetchRolesAndSetDefault = async () => {
      try {
        const response = await getRoles();

        if (response.success && Array.isArray(response.data)) {
          setRoles(response.data);

          // --- 🟢 FIX: Find the ID that matches the current User's Role Name ---
          const currentUserRoleName = userData.role.toLowerCase();

          // Look for a role where the name matches
          const matchingRole = response.data.find(
            (r) =>
              r.name.toLowerCase() === currentUserRoleName ||
              r.name.toLowerCase().replace(/_/g, " ") ===
                currentUserRoleName.replace(/_/g, " "),
          );

          if (matchingRole) {
            setValue("role", matchingRole.id.toString(), { shouldDirty: false });
          } else {
            console.warn(
              `⚠️ Could not find a matching Role ID for name: "${userData.role}"`,
            );
          }
        } else {
          setRoles([]);
        }
      } catch (err) {
        console.error("Failed to load roles", err);
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRolesAndSetDefault();
  }, [userData.role, setValue]);

  // 4. Handle Submission
  const onSubmit = async (data: FormValues) => {
    console.log("Client: Submitting Update...", data);
    try {
      const response = await updateUser({
        id: userData.id,
        ...data,
      });

      if (response.success) {
        toast.success("User updated successfully!");
        // Call parent success handler
        onSuccess();
      } else {
        toast.error(`Error: ${response.message}`);
      }
    } catch (error) {
      console.error("Client: Update Error", error);
      toast.error("An unexpected error occurred.");
    }
  };

  const initials = userData.name
    ? userData.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2)
    : "U";

  return (
    <div className="mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={onCancel} // Use prop instead of router.back()
          className="rounded-full p-2 transition-colors hover:bg-card"
        >
          <ArrowLeft size={20} className="text-muted-foreground" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Edit User</h1>
          <p className="text-sm text-muted-foreground">
            Update details for {userData.name}
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
        {/* Summary */}
        <div className="mb-8 flex items-center gap-4 border-b border-gray-100 dark:border-gray-700 pb-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-blue-600 dark:bg-blue-700 text-xl font-bold text-white">
            {initials}
          </div>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              {userData.name}
            </h2>
            <p className="text-sm text-muted-foreground">{userData.email}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              User ID: {userData.id}
            </p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Full Name
              </label>
              <input
                {...register("name")}
                type="text"
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-border bg-card p-2.5 text-sm text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Name cannot be changed.
              </p>
              {errors.name && (
                <p className="text-xs text-red-500">{errors.name.message}</p>
              )}
            </div>

            {/* Email (Read Only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Email Address
              </label>
              <input
                type="email"
                value={userData.email}
                disabled
                className="w-full cursor-not-allowed rounded-lg border border-border bg-card p-2.5 text-sm text-muted-foreground"
              />
              <p className="text-xs text-muted-foreground">
                Email cannot be changed.
              </p>
            </div>

            {/* Roles */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Role
              </label>

              {loadingRoles || (userData?.role && !selectedRole) ? (
                // Skeleton / loading state (prevents first-option flash)
                <div className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-muted-foreground">
                  Loading roles…
                </div>
              ) : (
                <select
                  {...register("role")}
                  className="w-full rounded-lg border border-border bg-card p-2.5 text-sm focus:border-blue-500"
                >
                  {!selectedRole && (
                    <option value="">Select role type</option>
                  )}

                  {roles.map((r: any) => (
                    <option key={r.id} value={r.id} className="capitalize">
                      {(r.name || r.roleName || "Unknown Role").replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              )}

              {errors.role && (
                <p className="text-xs text-red-500">{errors.role.message}</p>
              )}
            </div>

            {/* Status */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Status
              </label>
              <select
                {...register("status")}
                className="w-full rounded-lg border border-border bg-card p-2.5 text-sm focus:border-blue-500"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && (
                <p className="text-xs text-red-500">{errors.status.message}</p>
              )}
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 border-t border-border pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="flex items-center gap-2 rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground hover:bg-card/80"
            >
              <X size={16} /> Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || loadingRoles}
              className="flex items-center gap-2 rounded-lg bg-[#164e87] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#133f6d] disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                <>
                  <Save size={16} /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
