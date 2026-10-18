"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { updateTenant } from "@/actions/tenant.actions";
import type { Tenant } from "@/types/tenant.types";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  industry: z.string().optional(),
  plan: z.enum(["starter", "professional", "enterprise"]),
  status: z.enum(["active", "suspended", "inactive"]),
});

type FormValues = z.infer<typeof formSchema>;

interface EditTenantFormProps {
  tenant: Tenant;
  onSuccess: () => void;
  onCancel: () => void;
}

const INDUSTRIES = [
  "Financial Services",
  "Banking",
  "Insurance",
  "Healthcare",
  "Technology",
  "Retail",
  "Manufacturing",
  "Real Estate",
  "Legal",
  "Government",
  "Education",
  "Other",
];

export default function EditTenantForm({
  tenant,
  onSuccess,
  onCancel,
}: EditTenantFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: tenant.name,
      industry: tenant.industry || "",
      plan: tenant.plan,
      status: tenant.status,
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await updateTenant({
        id: tenant.id,
        name: data.name,
        industry: data.industry,
        plan: data.plan,
        status: data.status,
      });

      if (response.success) {
        toast.success("Tenant updated successfully");
        onSuccess();
      } else {
        toast.error(response.message || "Failed to update tenant");
      }
    } catch (error) {
      console.error("Error updating tenant:", error);
      toast.error("An unexpected error occurred");
    }
  };

  const currentStatus = watch("status");

  return (
    <div className="bg-card rounded-xl border border-border shadow-sm">
      {/* Header */}
      <div className="flex items-center gap-4 border-b border-border px-6 py-4">
        <button
          onClick={onCancel}
          className="flex items-center justify-center rounded-lg border border-border bg-card p-2 text-muted-foreground transition-colors hover:bg-muted/30 cursor-pointer"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex items-center gap-3">
          <Building2 className="h-6 w-6 text-[#164e87]" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Edit Tenant
            </h2>
            <p className="text-sm text-muted-foreground">
              Update organization details for{" "}
              <span className="font-medium">{tenant.name}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Tenant Info */}
      <div className="border-b border-border bg-muted/20 px-6 py-3">
        <div className="flex flex-wrap items-center gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">ID:</span>{" "}
            <span className="font-mono text-foreground">{tenant.id}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Subdomain:</span>{" "}
            <span className="font-medium text-foreground">
              {tenant.subdomain}.vesant.ai
            </span>
          </div>
          {tenant.createdAt && (
            <div>
              <span className="text-muted-foreground">Created:</span>{" "}
              <span className="text-foreground">
                {new Date(tenant.createdAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {/* Organization Name */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Organization Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("name")}
              placeholder="Acme Corporation"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Industry */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Industry
            </label>
            <select
              {...register("industry")}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            {errors.industry && (
              <p className="mt-1 text-sm text-red-500">
                {errors.industry.message}
              </p>
            )}
          </div>

          {/* Plan */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Subscription Plan <span className="text-red-500">*</span>
            </label>
            <select
              {...register("plan")}
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
            >
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
            {errors.plan && (
              <p className="mt-1 text-sm text-red-500">{errors.plan.message}</p>
            )}
          </div>

          {/* Status */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("status")}
              className={`w-full rounded-lg border px-4 py-2.5 focus:outline-none focus:ring-1 ${
                currentStatus === "active"
                  ? "border-green-300 bg-green-50 text-green-800 focus:border-green-500 focus:ring-green-500 dark:border-green-700 dark:bg-green-900/20 dark:text-green-300"
                  : currentStatus === "suspended"
                  ? "border-red-300 bg-red-50 text-red-800 focus:border-red-500 focus:ring-red-500 dark:border-red-700 dark:bg-red-900/20 dark:text-red-300"
                  : "border-yellow-300 bg-yellow-50 text-yellow-800 focus:border-yellow-500 focus:ring-yellow-500 dark:border-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-300"
              }`}
            >
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="inactive">Inactive</option>
            </select>
            {errors.status && (
              <p className="mt-1 text-sm text-red-500">
                {errors.status.message}
              </p>
            )}
          </div>
        </div>

        {/* Plan Details */}
        <div className="mt-6 rounded-lg border border-border bg-muted/30 p-4">
          <h3 className="mb-2 text-sm font-medium text-foreground">
            Plan Features
          </h3>
          <div className="grid grid-cols-1 gap-2 text-sm text-muted-foreground sm:grid-cols-3">
            <div
              className={`rounded-lg border p-3 ${
                watch("plan") === "starter"
                  ? "border-[#164e87] bg-[#164e87]/5"
                  : "border-border"
              }`}
            >
              <p className="font-medium text-foreground">Starter</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>Up to 10 users</li>
                <li>Basic compliance tools</li>
                <li>Email support</li>
              </ul>
            </div>
            <div
              className={`rounded-lg border p-3 ${
                watch("plan") === "professional"
                  ? "border-[#164e87] bg-[#164e87]/5"
                  : "border-border"
              }`}
            >
              <p className="font-medium text-foreground">Professional</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>Up to 50 users</li>
                <li>Advanced AML screening</li>
                <li>Priority support</li>
              </ul>
            </div>
            <div
              className={`rounded-lg border p-3 ${
                watch("plan") === "enterprise"
                  ? "border-[#164e87] bg-[#164e87]/5"
                  : "border-border"
              }`}
            >
              <p className="font-medium text-foreground">Enterprise</p>
              <ul className="mt-1 space-y-1 text-xs">
                <li>Unlimited users</li>
                <li>Full feature access</li>
                <li>Dedicated support</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-border bg-card px-5 py-2.5 text-sm font-medium text-foreground transition-colors hover:bg-muted/30 cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !isDirty}
            className="flex items-center gap-2 rounded-lg bg-[#164e87] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
