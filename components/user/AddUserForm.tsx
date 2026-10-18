"use client";

import React, { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, X } from "lucide-react"; // Added X icon
// import { useRouter } from "next/navigation"; // No longer strictly needed for navigation
import { createUser, getRoles, type Role } from "@/actions/user.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// --- 1. Define Validation Schema ---
const formSchema = z.object({
  firstName: z.string().min(2, "First name is required (min 2 chars)"),
  lastName: z.string().min(2, "Last name is required (min 2 chars)"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(5, "Please enter a valid phone number"),
  role: z.string().min(1, "Please select a role"),
});

type FormValues = z.infer<typeof formSchema>;

// --- New Props Interface ---
interface AddUserFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function AddUserForm({ onSuccess, onCancel }: AddUserFormProps) {
  // const router = useRouter();
  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(true);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
  });

  // --- 2. Fetch Roles on Component Mount ---
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await getRoles();
        console.log("Fetched roles:", response);

        if (response.success && Array.isArray(response.data)) {
          console.log(`Found ${response.data.length} roles.`);
          setRoles(response.data);
        } else {
          console.error("Data Issue:", response.data);
          setRoles([]);
        }
      } catch (err) {
        console.error("Unexpected error loading roles:", err);
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };

    fetchRoles();
  }, []);

  // --- 3. Handle Form Submission ---
  const onSubmit = async (data: FormValues) => {
    console.log("Submitting form data:", data);
    try {
      const response = await createUser(data);

      if (response.success) {
        toast.success("User added successfully!");
        // Call the parent's success handler instead of routing
        onSuccess();
      } else {
        toast.error(`Error: ${response.message}`);
      }
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">Add User</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter below details to add a new user.
          </p>
        </div>
        {/* Optional top cancel button */}
        <button
          onClick={onCancel}
          className="text-muted-foreground hover:text-foreground"
        >
          <X size={24} />
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          {/* First Name */}
          <div className="space-y-2">
            <label
              htmlFor="firstName"
              className="text-sm font-medium text-foreground"
            >
              First Name*
            </label>
            <input
              id="firstName"
              {...register("firstName")}
              type="text"
              placeholder="Enter first name"
              className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:ring-1 focus:ring-[#164e87]"
            />
            {errors.firstName && (
              <p className="text-xs text-red-500">{errors.firstName.message}</p>
            )}
          </div>

          {/* Last Name */}
          <div className="space-y-2">
            <label
              htmlFor="lastName"
              className="text-sm font-medium text-foreground"
            >
              Last Name*
            </label>
            <input
              id="lastName"
              {...register("lastName")}
              type="text"
              placeholder="Enter last name"
              className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:ring-1 focus:ring-[#164e87]"
            />
            {errors.lastName && (
              <p className="text-xs text-red-500">{errors.lastName.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="space-y-2">
            <label
              htmlFor="email"
              className="text-sm font-medium text-foreground"
            >
              Email*
            </label>
            <input
              id="email"
              {...register("email")}
              type="email"
              placeholder="Enter email address"
              className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:ring-1 focus:ring-[#164e87]"
            />
            {errors.email && (
              <p className="text-xs text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Phone Number */}
          <div className="space-y-2">
            <label
              htmlFor="phone"
              className="text-sm font-medium text-foreground"
            >
              Phone Number*
            </label>
            <input
              id="phone"
              {...register("phone")}
              type="tel"
              placeholder="+1234567890"
              className="w-full rounded-lg border border-border bg-card p-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:ring-1 focus:ring-[#164e87]"
            />
            {errors.phone && (
              <p className="text-xs text-red-500">{errors.phone.message}</p>
            )}
          </div>

          {/* Role Select */}
          <div className="space-y-2">
            <label
              htmlFor="role"
              className="text-sm font-medium text-foreground"
            >
              Role*
            </label>
            <select
              id="role"
              {...register("role")}
              disabled={loadingRoles}
              className={cn("w-full rounded-lg border border-border bg-card p-2.5 text-sm focus:border-[#164e87] focus:ring-1 focus:ring-[#164e87]",
                !watch("role") && "text-muted-foreground"
              )}
            >
              <option value="">
                {loadingRoles ? "Loading roles..." : "Select role type"}
              </option>
              {!loadingRoles &&
                Array.isArray(roles) &&
                roles.length > 0 &&
                roles.map((role: any) => (
                  <option key={role.id} value={role.id} className="text-foreground capitalize">
                    {(role.name || role.roleName).replace(/_/g, " ")}
                  </option>
                ))}

              {!loadingRoles && roles.length === 0 && (
                <option value="" disabled>
                  No roles available
                </option>
              )}
            </select>
            {errors.role && (
              <p className="text-xs text-red-500">{errors.role.message}</p>
            )}
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-border">
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
            className="flex items-center justify-center gap-2 rounded-lg bg-[#164e87] px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d] focus:outline-none focus:ring-2 focus:ring-[#164e87] focus:ring-offset-2 disabled:opacity-70 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 size={18} className="animate-spin" />
                Adding User...
              </>
            ) : (
              "Add User"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
