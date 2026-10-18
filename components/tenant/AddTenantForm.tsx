"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Loader2, Building2 } from "lucide-react";
import { toast } from "sonner";
import { createTenant } from "@/actions/tenant.actions";

const formSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  subdomain: z
    .string()
    .min(3, "Subdomain must be at least 3 characters")
    .max(50, "Subdomain must be less than 50 characters")
    .regex(
      /^[a-z0-9-]+$/,
      "Subdomain can only contain lowercase letters, numbers, and hyphens"
    ),
  industry: z.string().optional(),
  plan: z.enum(["starter", "professional", "enterprise"]),
  adminEmail: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

interface AddTenantFormProps {
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

export default function AddTenantForm({
  onSuccess,
  onCancel,
}: AddTenantFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      subdomain: "",
      industry: "",
      plan: "starter",
      adminEmail: "",
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await createTenant({
        name: data.name,
        subdomain: data.subdomain,
        industry: data.industry,
        plan: data.plan,
        adminEmail: data.adminEmail,
      });

      if (response.success) {
        toast.success("Tenant created successfully");
        onSuccess();
      } else {
        toast.error(response.message || "Failed to create tenant");
      }
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast.error("An unexpected error occurred");
    }
  };

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
              Add New Tenant
            </h2>
            <p className="text-sm text-muted-foreground">
              Create a new organization account
            </p>
          </div>
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

          {/* Subdomain */}
          <div>
            <label className="mb-2 block text-sm font-medium text-foreground">
              Subdomain <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center">
              <input
                type="text"
                {...register("subdomain")}
                placeholder="acme"
                className="w-full rounded-l-lg border border-r-0 border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
              />
              <span className="rounded-r-lg border border-border bg-muted px-4 py-2.5 text-sm text-muted-foreground">
                .vesant.ai
              </span>
            </div>
            {errors.subdomain && (
              <p className="mt-1 text-sm text-red-500">
                {errors.subdomain.message}
              </p>
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

          {/* Admin Email */}
          <div className="md:col-span-2">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Admin Email <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              {...register("adminEmail")}
              placeholder="admin@acme.com"
              className="w-full rounded-lg border border-border bg-card px-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-1 focus:ring-[#164e87]"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              An invitation email will be sent to this address
            </p>
            {errors.adminEmail && (
              <p className="mt-1 text-sm text-red-500">
                {errors.adminEmail.message}
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
            disabled={isSubmitting}
            className="flex items-center gap-2 rounded-lg bg-[#164e87] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[#133f6d] disabled:opacity-60 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Tenant"
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
