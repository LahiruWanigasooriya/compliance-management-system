import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, Trash2, AlertCircle, Loader2 } from "lucide-react";
import {
  PrivilegeLevel,
  Privilege,
  Action,
  createPrivilegeLevel,
  updatePrivilegeLevel,
} from "@/actions/privilege.level.actions";

interface PrivilegeLevelModalProps {
  level: PrivilegeLevel | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  existingLevels: PrivilegeLevel[];
}

export const PrivilegeLevelModal: React.FC<PrivilegeLevelModalProps> = ({
  level,
  isOpen,
  onClose,
  onSuccess,
  existingLevels,
}) => {
  const [levelValue, setLevelValue] = useState(level?.levelValue || 1);
  const [inheritanceGroup, setInheritanceGroup] = useState(
    level?.inheritanceGroup || "business",
  );
  const [privileges, setPrivileges] = useState<Privilege[]>(
    level?.privileges || [],
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (level) {
      setLevelValue(level.levelValue || 1);
      setInheritanceGroup(level.inheritanceGroup || "business");
      setPrivileges(level.privileges || []);
    } else {
      // Reset to defaults for create mode
      setLevelValue(1);
      setInheritanceGroup("business");
      setPrivileges([]);
    }
    setError(null);
    setLoading(false);
  }, [level]);

  const addPrivilege = () => {
    setPrivileges([
      ...privileges,
      {
        resource: "",
        actions: [
          {
            create: false,
            get: false,
            update: false,
            delete: false,
            approve: false,
            export: false,
            query: false,
            escalate: false,
          },
        ],
      },
    ]);
  };

  const removePrivilege = (index: number) => {
    setPrivileges(privileges.filter((_, i) => i !== index));
  };

  const updatePrivilege = (index: number, field: string, value: string) => {
    const updated = [...privileges];
    if (field === "resource") {
      updated[index].resource = value;
    }
    setPrivileges(updated);
  };

  const updateAction = (
    privilegeIndex: number,
    actionField: keyof Action,
    value: boolean,
  ) => {
    const updated = [...privileges];
    updated[privilegeIndex].actions[0][actionField] = value;
    setPrivileges(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (levelValue < 1) {
      setError("Level value must be at least 1");
      toast.error("Level value must be at least 1");
      return;
    }

    // Check for duplicate level value within the same inheritance group
    const duplicate = existingLevels.find(
      (l) =>
        l.levelValue === levelValue &&
        l.id !== level?.id &&
        (l.inheritanceGroup || "business") === inheritanceGroup,
    );
    if (duplicate) {
      setError(
        `Level value ${levelValue} already exists in the ${inheritanceGroup} group`,
      );
      toast.error(
        `Level value ${levelValue} already exists in the ${inheritanceGroup} group`,
      );
      return;
    }

    if (privileges.length === 0) {
      setError("At least one privilege must be specified");
      toast.error("At least one privilege must be specified");
      return;
    }

    // Validate each privilege has a resource
    for (const priv of privileges) {
      if (!priv.resource.trim()) {
        setError("All privileges must have a resource name");
        toast.error("All privileges must have a resource name");
        return;
      }
    }

    try {
      setLoading(true);

      const result = level
        ? await updatePrivilegeLevel(
            level.id,
            levelValue,
            privileges,
            inheritanceGroup,
          )
        : await createPrivilegeLevel(levelValue, privileges, inheritanceGroup);

      if (result.success) {
        toast.success(
          result.message ||
            (level
              ? "Level updated successfully"
              : "Level created successfully"),
        );
        onSuccess();
      } else {
        const errorMessage =
          result.message ||
          (level ? "Failed to update level" : "Failed to create level");
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
            {level ? "Edit Privilege Level" : "Create New Privilege Level"}
          </h3>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground text-2xl"
            disabled={loading}
          >
            ✕
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-red-800">Error</h4>
                <p className="text-sm text-red-600 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium mb-2">
                Level Value <span className="text-red-500">*</span>
                <span className="text-xs text-muted-foreground ml-2">
                  (Lower = Higher Privilege)
                </span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="Enter level value"
                value={levelValue}
                onChange={(e) => {
                  setLevelValue(parseInt(e.target.value) || 1);
                  setError(null);
                }}
                className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current value: {levelValue}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Inheritance Group <span className="text-red-500">*</span>
              </label>
              <select
                value={inheritanceGroup}
                onChange={(e) => {
                  setInheritanceGroup(e.target.value);
                  setError(null);
                }}
                className="w-full px-4 py-2 border border-border bg-card text-foreground rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                disabled={loading}
                aria-label="Inheritance Group"
              >
                <option value="business">Business</option>
                <option value="technical">Technical</option>
                <option value="system_admin">System Admin</option>
              </select>
              <p className="text-xs text-muted-foreground mt-1">
                Current group: {inheritanceGroup}
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-3">
              <label className="block text-sm font-medium">
                Privileges <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={addPrivilege}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                disabled={loading}
              >
                <Plus size={16} /> Add Privilege
              </button>
            </div>

            <div className="space-y-4">
              {privileges.map((priv, idx) => (
                <div
                  key={idx}
                  className="border border-border rounded-lg p-4 bg-card"
                >
                  <div className="flex justify-between items-start mb-3">
                    <input
                      type="text"
                      placeholder="Resource name (e.g., users, roles, reports)"
                      value={priv.resource}
                      onChange={(e) =>
                        updatePrivilege(idx, "resource", e.target.value)
                      }
                      className="flex-1 px-3 py-2 border border-border bg-card text-foreground rounded-lg text-sm"
                      disabled={loading}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => removePrivilege(idx)}
                      className="ml-2 p-2 text-red-600 hover:bg-red-50 rounded"
                      disabled={loading}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { key: "create", label: "Create" },
                      { key: "get", label: "View" },
                      { key: "update", label: "Edit" },
                      { key: "delete", label: "Delete" },
                      { key: "approve", label: "Approve" },
                      { key: "export", label: "Export" },
                      { key: "query", label: "Query" },
                      { key: "escalate", label: "Escalate" },
                    ].map((action) => (
                      <label
                        key={action.key}
                        className="flex items-center gap-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          checked={priv.actions[0][action.key as keyof Action]}
                          onChange={(e) =>
                            updateAction(
                              idx,
                              action.key as keyof Action,
                              e.target.checked,
                            )
                          }
                          className="rounded"
                          disabled={loading}
                        />
                        {action.label}
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {privileges.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No privileges defined. Click "Add Privilege" to get started.
              </p>
            )}
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t">
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
              disabled={loading}
              className="px-6 py-2 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
            >
              {loading && <Loader2 size={16} className="animate-spin" />}
              {level ? "Update Level" : "Create Level"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
