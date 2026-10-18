"use client";

import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  Loader2,
  Building2,
  Globe,
  Mail,
  Briefcase,
  Plus,
} from "lucide-react";
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
  adminEmail: z.string().email("Please enter a valid email address"),
});

type FormValues = z.infer<typeof formSchema>;

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

export default function AddTenantPage() {
  const router = useRouter();

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
      adminEmail: "",
    },
  });

  const subdomain = watch("subdomain");

  const onSubmit = async (data: FormValues) => {
    try {
      const response = await createTenant({
        name: data.name,
        subdomain: data.subdomain,
        industry: data.industry,
        adminEmail: data.adminEmail,
      });

      if (response.success) {
        toast.success("Tenant created successfully");
        router.push("/tenants");
      } else {
        toast.error(response.message || "Failed to create tenant");
      }
    } catch (error) {
      console.error("Error creating tenant:", error);
      toast.error("An unexpected error occurred");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="h-1 bg-[#164e87]" />
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <button
                onClick={() => router.back()}
                className="flex items-center justify-center rounded-lg border border-border bg-muted/50 p-2.5 text-muted-foreground transition-colors hover:bg-muted cursor-pointer mt-1"
              >
                <ArrowLeft size={18} />
              </button>

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#164e87] to-[#1a5a9e] text-white shadow-lg">
                  <Plus size={24} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">
                    Add New Tenant
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Create a new organization account
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Organization Name Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Building2 size={18} className="text-[#164e87]" />
                Organization Name
              </h2>
            </div>
            <div className="p-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("name")}
                placeholder="Acme Corporation"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-2 focus:ring-[#164e87]/20 transition-all"
              />
              {errors.name && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  {errors.name.message}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                This will be the display name for your organization
              </p>
            </div>
          </div>

          {/* Admin Email Card */}
          <div className="bg-card rounded-xl border border-border shadow-sm">
            <div className="p-5 border-b border-border">
              <h2 className="font-semibold text-foreground flex items-center gap-2">
                <Mail size={18} className="text-[#164e87]" />
                Admin Contact
              </h2>
            </div>
            <div className="p-6">
              <label className="mb-2 block text-sm font-medium text-foreground">
                Admin Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                {...register("adminEmail")}
                placeholder="admin@acme.com"
                className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-2 focus:ring-[#164e87]/20 transition-all"
              />
              {errors.adminEmail && (
                <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                  {errors.adminEmail.message}
                </p>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                This email will receive the setup invitation and have full admin access
              </p>
            </div>
          </div>
        </div>

        {/* Subdomain Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Globe size={18} className="text-[#164e87]" />
              Subdomain Configuration
            </h2>
          </div>
          <div className="p-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Subdomain <span className="text-red-500">*</span>
            </label>
            <div className="flex">
              <span className="flex items-center rounded-l-xl border border-r-0 border-border bg-muted px-4 text-sm text-muted-foreground font-medium">
                https://
              </span>
              <input
                type="text"
                {...register("subdomain")}
                placeholder="acme"
                className="flex-1 border border-x-0 border-border bg-muted/30 px-4 py-3.5 text-foreground placeholder:text-muted-foreground focus:border-[#164e87] focus:outline-none focus:ring-2 focus:ring-[#164e87]/20 transition-all"
              />
              <span className="flex items-center rounded-r-xl border border-l-0 border-border bg-muted px-4 text-sm text-muted-foreground font-medium">
                .vesant.ai
              </span>
            </div>
            {errors.subdomain && (
              <p className="mt-2 text-sm text-red-500 flex items-center gap-1">
                {errors.subdomain.message}
              </p>
            )}
            {subdomain && !errors.subdomain && (
              <div className="mt-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 px-4 py-3">
                <p className="text-sm text-green-700 dark:text-green-300">
                  Your tenant URL will be:{" "}
                  <span className="font-semibold">
                    https://{subdomain}.vesant.ai
                  </span>
                </p>
              </div>
            )}
            <p className="mt-3 text-xs text-muted-foreground">
              Choose carefully - the subdomain cannot be changed after creation
            </p>
          </div>
        </div>

        {/* Industry Card */}
        <div className="bg-card rounded-xl border border-border shadow-sm">
          <div className="p-5 border-b border-border">
            <h2 className="font-semibold text-foreground flex items-center gap-2">
              <Briefcase size={18} className="text-[#164e87]" />
              Industry
            </h2>
          </div>
          <div className="p-6">
            <label className="mb-2 block text-sm font-medium text-foreground">
              Select Industry <span className="text-muted-foreground font-normal">(Optional)</span>
            </label>
            <select
              {...register("industry")}
              className="w-full rounded-xl border border-border bg-muted/30 px-4 py-3.5 text-foreground focus:border-[#164e87] focus:outline-none focus:ring-2 focus:ring-[#164e87]/20 transition-all cursor-pointer"
            >
              <option value="">Select an industry</option>
              {INDUSTRIES.map((industry) => (
                <option key={industry} value={industry}>
                  {industry}
                </option>
              ))}
            </select>
            <p className="mt-3 text-xs text-muted-foreground">
              Helps provide relevant compliance templates and recommendations
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-card rounded-xl border border-border shadow-sm p-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-muted-foreground">
              After creation, you can configure security settings and compliance features
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => router.back()}
                className="rounded-xl border border-border bg-card px-6 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-2 rounded-xl bg-[#164e87] px-8 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#133f6d] hover:shadow-md disabled:opacity-60 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus size={18} />
                    Create Tenant
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
