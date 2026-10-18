import React, { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Edit2,
  Trash2,
  Plus,
  ShieldAlert,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Eye,
  ArrowRight,
  Download,
  Search,
  CheckCircle,
  ArrowUpCircle,
  FileText,
} from "lucide-react";
import {
  PrivilegeLevel,
  deletePrivilegeLevel,
  getAllPrivilegeLevels,
} from "@/actions/privilege.level.actions";
import { PrivilegeLevelModal } from "./PrivilegeLevelModal";
import Link from "next/link";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
import { startCase } from "lodash";

export const PrivilegeLevelManager: React.FC<{
  canCreate: boolean;
  canUpdate: boolean;
  canDelete: boolean;
}> = ({ canCreate, canUpdate, canDelete }) => {
  const [privilegeLevels, setPrivilegeLevels] = useState<PrivilegeLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<PrivilegeLevel | null>(
    null,
  );
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [expandedLevels, setExpandedLevels] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchPrivilegeLevels();
  }, []);

  const fetchPrivilegeLevels = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await getAllPrivilegeLevels();

      if (result.success && result.data) {
        // Sort by level value (lowest number = highest privilege)
        const sorted = result.data.sort((a, b) => a.levelValue - b.levelValue);
        setPrivilegeLevels(sorted);
      } else {
        setError(result.message || "Failed to fetch privilege levels");
        toast.error(result.message || "Failed to fetch privilege levels");
      }
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "An unexpected error occurred";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteLevel = async (levelId: string, levelValue: number) => {
    if (!levelId) return;

    if (
      !confirm(
        `Are you sure you want to delete privilege level ${levelValue}? This action cannot be undone.`,
      )
    ) {
      return;
    }

    try {
      setIsDeleting(true);
      const result = await deletePrivilegeLevel(levelId);

      if (result.success) {
        setPrivilegeLevels((prev) =>
          prev.filter((level) => level.id !== levelId),
        );
        toast.success(`Privilege level ${levelValue} deleted successfully`);
      } else {
        // Show the actual error message from the backend
        toast.error(result.message || "Failed to delete privilege level");
      }
    } catch (err: any) {
      // Fallback error handling
      const errorMessage = err.message || "An unexpected error occurred";
      toast.error(errorMessage);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleEditLevel = (level: PrivilegeLevel) => {
    setSelectedLevel(level);
    setIsEditOpen(true);
  };

  const handleLevelCreatedOrUpdated = () => {
    fetchPrivilegeLevels();
    setIsEditOpen(false);
    setSelectedLevel(null);
  };

  const toggleExpanded = (levelId: string) => {
    setExpandedLevels((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(levelId)) {
        newSet.delete(levelId);
      } else {
        newSet.add(levelId);
      }
      return newSet;
    });
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const formatInheritanceGroup = (group?: string): string => {
    const groupValue = group || "business";
    switch (groupValue) {
      case "system_admin":
        return "System Admin";
      case "technical":
        return "Technical";
      case "business":
      default:
        return "Business";
    }
  };

  const getInheritanceGroupColor = (group?: string): string => {
    const groupValue = group || "business";
    switch (groupValue) {
      case "system_admin":
        return "bg-purple-100 text-purple-800";
      case "technical":
        return "bg-cyan-100 text-cyan-800";
      case "business":
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  if (loading) {
    return (
      <div className="relative h-64">
        <LoadingOverlay loadingText="Loading privilege levels..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive rounded-lg p-6">
        <div className="flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-800">
              Failed to load privilege levels
            </h3>
            <p className="text-sm text-red-600 mt-1">{error}</p>
            <button
              onClick={fetchPrivilegeLevels}
              className="mt-3 px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-md hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Privilege Levels Management
          </h2>
          <p className="text-muted-foreground text-sm">
            Define hierarchical privilege levels with inherited permissions.
            <span className="ml-2 text-xs bg-emerald-100 text-emerald-700 border border-emerald-500 px-2 py-1 rounded">
              {privilegeLevels.length} level
              {privilegeLevels.length !== 1 ? "s" : ""}
            </span>
          </p>
        </div>
        {canCreate && (
          <button
            onClick={() => {
              setSelectedLevel(null);
              setIsEditOpen(true);
            }}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium"
          >
            <Plus size={16} /> Create New Role
          </button>
        )}
      </div>

      {/* HIERARCHY INFO */}
      <div className="bg-emerald-50/50 rounded-lg border border-emerald-100 p-4 flex items-start space-x-3">
        <div className="bg-emerald-100 p-1.5 rounded-md">
          <ShieldAlert size={18} className="text-emerald-700" />
        </div>
        <div>
          <p className="text-sm font-semibold text-emerald-900">
            Inheritance Model
          </p>
          <p className="text-xs text-emerald-700/80 mt-1 leading-relaxed">
            Lower level values have higher privileges. Each level automatically
            inherits all permissions from levels with higher numbers.
          </p>
        </div>
      </div>

      {/* LEVELS TABLE */}
      <div className="bg-card border border-border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          {privilegeLevels.length === 0 ? (
            <div className="text-center py-12">
              <ShieldAlert className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                No privilege levels found
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                Get started by creating your first privilege level
              </p>
              <button
                onClick={() => {
                  setSelectedLevel(null);
                  setIsEditOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium"
              >
                <Plus size={16} /> Create New Level
              </button>
            </div>
          ) : (
            <table className="w-full text-sm text-left">
              <thead className="bg-secondary text-white font-semibold border-b border-border whitespace-nowrap">
                <tr>
                  <th className="px-6 py-3 w-12"></th>
                  <th className="px-6 py-3">Level Value</th>
                  <th className="px-6 py-3">Inheritance Group</th>
                  <th className="px-6 py-3">Privileges Summary</th>
                  <th className="px-6 py-3">Updated</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {privilegeLevels.map((level) => {
                  const levelColorMap: Record<number, string> = {
                    1: "bg-emerald-700 text-white border-emerald-600",
                    2: "bg-emerald-600 text-white border-emerald-500",
                    3: "bg-emerald-600/80 text-white border-emerald-400",
                    4: "bg-emerald-500/90 text-white border-emerald-300",
                    5: "bg-emerald-400 text-white border-emerald-200",
                  };
                  return (
                    <React.Fragment key={level.id}>
                      <tr className="hover:bg-muted/40 transition-colors">
                        <td className="px-6 py-3">
                          <button
                            onClick={() => toggleExpanded(level.id)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer"
                          >
                            {expandedLevels.has(level.id) ? (
                              <ChevronUp size={18} />
                            ) : (
                              <ChevronDown size={18} />
                            )}
                          </button>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex-shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm transition-colors border
                              ${levelColorMap[level.levelValue] ?? "bg-white text-slate-600 border-slate-200"}
                          `}
                            >
                              {level.levelValue}
                            </span>

                            {/* Visual Authority Meter in Table */}
                            <div className="flex flex-col gap-0.5">
                              <div className="flex items-end gap-0.5 h-4">
                                {[...Array(5)].map((_, i) => {
                                  // Logic: Level 1 has 5 bars, Level 5 has 1 bar.
                                  // Filled count = 6 - levelValue
                                  const filledCount = Math.max(
                                    1,
                                    6 - level.levelValue,
                                  );
                                  const isFilled = i < filledCount;
                                  const heightClass = [
                                    "h-1.5",
                                    "h-2",
                                    "h-2.5",
                                    "h-3",
                                    "h-3.5",
                                  ][i]; // Ascending height for cool effect

                                  return (
                                    <div
                                      key={i}
                                      className={`
                                       w-1 rounded-full transition-all duration-300
                                       ${isFilled ? "bg-emerald-500" : "bg-slate-200"}
                                       ${heightClass}
                                     `}
                                    />
                                  );
                                })}
                              </div>
                              <span className="text-[9px] text-muted-foreground font-medium uppercase tracking-tighter">
                                {level.levelValue === 1
                                  ? "Max Power"
                                  : level.levelValue === 5
                                    ? "Least Power"
                                    : "Authority"}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded text-xs font-medium ${getInheritanceGroupColor(
                              level.inheritanceGroup,
                            )}`}
                          >
                            {formatInheritanceGroup(level.inheritanceGroup)}
                          </span>
                        </td>
                        <td className="px-6 py-3">
                          <div className="flex flex-wrap gap-2">
                            {level.privileges.slice(0, 3).map((priv, idx) => (
                              <span
                                key={idx}
                                className="text-xs bg-muted text-foreground px-2 py-1 rounded"
                              >
                                {startCase(priv.resource)}
                              </span>
                            ))}
                            {level.privileges.length > 3 && (
                              <span className="text-xs text-muted-foreground self-center">
                                +{level.privileges.length - 3} more
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-3 text-muted-foreground whitespace-nowrap">
                          {formatDate(level.updatedAt)}
                        </td>
                        <td className="px-6 py-3 flex justify-end gap-2">
                          {/* <Link
                          href={``}
                          className="p-1.5 text-primary-foreground hover:text-indigo-600 bg-card border rounded shadow-sm flex items-center justify-center"
                          title="View Full Details"
                        >
                          <Eye size={16} />
                        </Link> */}
                          {canUpdate && (
                            <button
                              onClick={() => handleEditLevel(level)}
                              className="p-1.5 text-primary-foreground bg-card hover:text-amber-600 border rounded shadow-sm"
                              title="Edit Level"
                              disabled={isDeleting}
                            >
                              <Edit2 size={16} />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() =>
                                handleDeleteLevel(level.id, level.levelValue)
                              }
                              className="p-1.5 text-primary-foreground hover:text-red-600 bg-card border rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete Level"
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <Loader2 size={16} className="animate-spin" />
                              ) : (
                                <Trash2 size={16} />
                              )}
                            </button>
                          )}
                        </td>
                      </tr>
                      {expandedLevels.has(level.id) && (
                        <tr className="bg-muted/10">
                          <td colSpan={6} className="px-6 py-4">
                            <div className="space-y-3">
                              {/* <h4 className="font-semibold text-sm text-foreground">
                              Detailed Privileges:
                            </h4> */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-4 px-2">
                                {level.privileges.map((priv, idx) => (
                                  <div
                                    key={idx}
                                    className="group flex flex-col items-start gap-2.5 p-3 rounded-lg transition-all duration-200 hover:bg-slate-50 border border-transparent hover:border-slate-100 hover:shadow-sm"
                                  >
                                    <div className="font-semibold text-sm text-slate-700 flex items-center gap-2">
                                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-sm shadow-emerald-200 group-hover:scale-125 transition-transform" />
                                      {startCase(priv.resource)}
                                    </div>

                                    <div className="flex flex-wrap items-center gap-1.5 justify-start w-full">
                                      {priv.actions.map((action, actionIdx) => (
                                        <React.Fragment key={actionIdx}>
                                          {action.create && (
                                            <span className="cursor-default inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                              <Plus
                                                size={10}
                                                className="text-slate-500"
                                              />{" "}
                                              Create
                                            </span>
                                          )}
                                          {action.get && (
                                            <span className="cursor-default inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                              <Eye
                                                size={10}
                                                className="text-slate-500"
                                              />{" "}
                                              View
                                            </span>
                                          )}
                                          {action.update && (
                                            <span className="cursor-default inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                              <Edit2
                                                size={10}
                                                className="text-slate-500"
                                              />{" "}
                                              Edit
                                            </span>
                                          )}
                                          {action.delete && (
                                            <span className="cursor-default inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                              <Trash2
                                                size={10}
                                                className="text-slate-500"
                                              />{" "}
                                              Delete
                                            </span>
                                          )}
                                          {action.approve && (
                                            <span className="cursor-default inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                              <CheckCircle
                                                size={10}
                                                className="text-slate-500"
                                              />{" "}
                                              Approve
                                            </span>
                                          )}
                                          {action.export && (
                                            <span className="cursor-default inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                              <Download
                                                size={10}
                                                className="text-slate-500"
                                              />{" "}
                                              Export
                                            </span>
                                          )}
                                          {action.query && (
                                            <span className="cursor-default inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                              <Search
                                                size={10}
                                                className="text-slate-500"
                                              />{" "}
                                              Query
                                            </span>
                                          )}
                                          {action.escalate && (
                                            <span className="cursor-default inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-medium bg-slate-50 text-slate-700 border border-slate-200 group-hover:bg-white group-hover:border-slate-300 transition-colors">
                                              <ArrowUpCircle
                                                size={10}
                                                className="text-slate-500"
                                              />{" "}
                                              Escalate
                                            </span>
                                          )}
                                        </React.Fragment>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* EDIT/CREATE MODAL */}
      <PrivilegeLevelModal
        level={selectedLevel}
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setSelectedLevel(null);
        }}
        onSuccess={handleLevelCreatedOrUpdated}
        existingLevels={privilegeLevels}
      />
    </div>
  );
};
