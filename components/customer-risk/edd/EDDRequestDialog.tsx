"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { createEDDRequest } from "@/actions/customer-risk.actions";
import type { CreateEDDRequest, EDDDocumentType, EDDPriority } from "@/types/customer-risk.types";
import { toast } from "sonner";
import { useAuth } from "@/components/providers/auth.provider";

interface EDDRequestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  profileId: string;
  customerId: string;
  onSuccess?: () => void;
}

const documentTypeOptions: { value: EDDDocumentType; label: string }[] = [
  { value: "source_of_wealth", label: "Source of Wealth" },
  { value: "source_of_funds", label: "Source of Funds" },
  { value: "business_purpose", label: "Business Purpose" },
  { value: "bank_statement", label: "Bank Statement" },
  { value: "tax_return", label: "Tax Return" },
  { value: "employment_proof", label: "Employment Proof" },
  { value: "address_verification", label: "Address Verification" },
  { value: "id_verification", label: "ID Verification" },
  { value: "other", label: "Other" },
];

const priorityOptions: { value: EDDPriority; label: string }[] = [
  { value: "low", label: "Low" },
  { value: "normal", label: "Normal" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export default function EDDRequestDialog({
  open,
  onOpenChange,
  profileId,
  customerId,
  onSuccess,
}: EDDRequestDialogProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateEDDRequest>({
    document_type: "source_of_wealth",
    reason: "",
    description: "",
    priority: "normal",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Clean up the data - only send non-empty values
      const cleanedData: CreateEDDRequest = {
        document_type: formData.document_type,
      };

      // Only add optional fields if they have values
      if (formData.reason?.trim()) {
        cleanedData.reason = formData.reason.trim();
      }
      if (formData.description?.trim()) {
        cleanedData.description = formData.description.trim();
      }
      if (formData.priority) {
        cleanedData.priority = formData.priority;
      }
      if (formData.due_date) {
        // Convert to ISO string format
        cleanedData.due_date = new Date(formData.due_date).toISOString();
      }

      // Add the current user as the requester
      if (user?.id) {
        cleanedData.requested_by = user.id;
      }
      if (user?.full_name) {
        cleanedData.requested_by_name = user.full_name;
      }

      const response = await createEDDRequest(profileId, cleanedData);

      if (response.success) {
        toast.success("EDD request created successfully");
        onOpenChange(false);
        onSuccess?.();
        // Reset form
        setFormData({
          document_type: "source_of_wealth",
          reason: "",
          description: "",
          priority: "normal",
        });
      } else {
        toast.error(response.message || "Failed to create EDD request");
      }
    } catch (error) {
      console.error("Error creating EDD request:", error);
      toast.error("An error occurred while creating the request");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Request Enhanced Due Diligence Documents</DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Customer: {customerId}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              required
              value={formData.document_type}
              onChange={(e) =>
                setFormData({ ...formData, document_type: e.target.value as EDDDocumentType })
              }
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {documentTypeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) =>
                setFormData({ ...formData, priority: e.target.value as EDDPriority })
              }
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {priorityOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reason</label>
            <Input
              value={formData.reason}
              onChange={(e) =>
                setFormData({ ...formData, reason: e.target.value })
              }
              placeholder="e.g., High risk transaction pattern detected"
              className="w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Provide additional details about why this document is required..."
              rows={4}
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Due Date</label>
            <Input
              type="date"
              value={formData.due_date || ""}
              onChange={(e) =>
                setFormData({ ...formData, due_date: e.target.value })
              }
              className="w-full"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-4 py-2 border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-foreground cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Creating..." : "Create Request"}
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
