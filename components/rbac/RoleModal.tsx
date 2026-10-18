// components/RoleModal.tsx
import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  PrivilegeLevel,
  getAllPrivilegeLevels,
} from "@/actions/privilege.level.actions";
import { Role, createRole, updateRole } from "../../actions/role.actions";
import { Loader2, AlertCircle } from "lucide-react";

interface RoleModalProps {
  role: Role | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const RoleModal: React.FC<RoleModalProps> = ({
  role,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [formData, setFormData] = useState({
    roleName: role?.roleName || "",
    description: role?.description || "",
    privilegeLevelId: role?.privilegeLevelId || "",
  });
  const [privilegeLevels, setPrivilegeLevels] = useState<PrivilegeLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingLevels, setLoadingLevels] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load privilege levels when modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchLevels = async () => {
        setLoadingLevels(true);
        setError(null);
        const result = await getAllPrivilegeLevels();
        if (result.success && result.data) {
          setPrivilegeLevels(result.data);
        } else {
          const errorMsg = result.message || "Failed to load privilege levels";
          setError(errorMsg);
          toast.error(errorMsg);
        }
        setLoadingLevels(false);
      };
      fetchLevels();
    }
  }, [isOpen]);

  // Reset form when role changes
  useEffect(() => {
    if (role) {
      setFormData({
        roleName: role.roleName || "",
        description: role.description || "",
        privilegeLevelId: role.privilegeLevelId || "",
      });
    } else {
      setFormData({
        roleName: "",
        description: "",
        privilegeLevelId: "",
      });
    }
    setError(null);
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.roleName.trim()) {
      setError("Role name is required");
      toast.error("Role name is required");
      return;
    }
    if (!formData.privilegeLevelId) {
      setError("Please select a privilege level");
      toast.error("Please select a privilege level");
      return;
    }

    try {
      setLoading(true);

      const result = role
        ? await updateRole(
            role.id,
            formData.roleName,
            formData.privilegeLevelId,
            formData.description,
          )
        : await createRole(
            formData.roleName,
            formData.privilegeLevelId,
            formData.description,
          );

      if (result.success) {
        toast.success(
          result.message || (role ? "Role updated" : "Role created"),
        );
        onSuccess();
      } else {
        const errorMessage =
          result.message ||
          (role ? "Failed to update role" : "Failed to create role");
        setError(errorMessage);
        toast.error(errorMessage);
      }
    } catch (err: any) {
      const errorMessage = err.message || "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-card border border-border rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-foreground">
            {role ? "Edit Role" : "Create New Role"}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {/* Display error message prominently */}
        {error && (
          <div className="mb-6 p-4 bg-destructive/10 border border-destructive rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-destructive">Error</h4>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Role Name <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={formData.roleName}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    roleName: e.target.value,
                  }));
                  setError(null);
                }}
                className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g. Casino Manager"
                disabled={loading}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Privilege Level <span className="text-destructive">*</span>
              </label>
              <select
                value={formData.privilegeLevelId}
                onChange={(e) => {
                  setFormData((prev) => ({
                    ...prev,
                    privilegeLevelId: e.target.value,
                  }));
                  setError(null);
                }}
                className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading || loadingLevels}
                title="Privilege Level"
                required
              >
                <option value="">
                  {loadingLevels
                    ? "Loading levels..."
                    : "Select a privilege level"}
                </option>
                {privilegeLevels.map((level) => (
                  <option key={level.id} value={level.id}>
                    Level {level.levelValue}
                  </option>
                ))}
              </select>
              {loadingLevels && (
                <p className="text-xs text-muted-foreground mt-1">
                  Loading privilege levels...
                </p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              Description{" "}
              <span className="text-muted-foreground text-xs">(Optional)</span>
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => {
                setFormData((prev) => ({
                  ...prev,
                  description: e.target.value,
                }));
                setError(null);
              }}
              className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 min-h-[100px] resize-vertical"
              placeholder="Enter a description for this role (optional)"
              disabled={loading}
              rows={4}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Add a description to explain the purpose and responsibilities of
              this role.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-2 text-sm border border-border text-foreground rounded-lg hover:bg-muted/50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || loadingLevels}
              className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {role ? "Update Role" : "Create Role"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
