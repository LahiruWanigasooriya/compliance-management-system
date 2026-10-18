// components/RoleManager.tsx
import React, { useState } from "react";
import Link from "next/link"; // <--- 1. Import Link
import { Role } from "../types/rbac";
import { MOCK_ROLES } from "../constants/rbacData";
import { Drawer, Modal, Badge } from "./ui/Shared";
import { PermissionMatrix } from "../components/rbac/PermissionMatrix"; // <--- 2. Import the Matrix
import { Edit2, Trash2, Eye, Plus, ShieldAlert } from "lucide-react";

export const RoleManager = () => {
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // State for the "Quick View" drawer (optional if you prefer routing)
  const [viewMode, setViewMode] = useState<"details" | null>(null);

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">
            Roles Management
          </h2>
          <p className="text-primary-foreground text-sm">
            Manage user roles, inheritance, and permissions.
          </p>
        </div>
        <button
          onClick={() => setIsEditOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md flex items-center gap-2 text-sm font-medium transition-colors"
        >
          <Plus size={16} /> Create New Role
        </button>
      </div>

      {/* ROLES TABLE */}
      <div className="bg-card border rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-card text-foreground font-semibold border-b border-border">
              <tr>
                <th className="px-6 py-3">Role Name</th>
                <th className="px-6 py-3">Users</th>
                <th className="px-6 py-3">Updated</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {MOCK_ROLES.map((role) => (
                <tr
                  key={role.id}
                  className="hover:bg-primary/20 transition-colors"
                >
                  <td className="px-6 py-3">
                    <div className="font-medium text-foreground">
                      {role.name}
                    </div>
                    <div className="text-xs text-muted-foreground truncate max-w-[200px]">
                      {role.description}
                    </div>
                  </td>
                  <td className="px-6 py-3 text-muted-foreground">12</td>
                  <td className="px-6 py-3 text-muted-foreground">
                    {role.updatedAt}
                  </td>
                  <td className="px-6 py-3 flex justify-end gap-2">
                    {/* CONNECTION METHOD 1: LINK TO SEPARATE PAGE */}
                    <Link
                      href={`/roles/${role.id}`}
                      className="p-1.5 text-primary-foreground hover:text-indigo-600 bg-card border rounded shadow-sm flex items-center justify-center"
                      title="View Full Details"
                    >
                      <Eye size={16} />
                    </Link>

                    <button
                      onClick={() => setIsEditOpen(true)}
                      className="p-1.5 text-primary-foreground bg-card hover:text-amber-600  border rounded shadow-sm"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button className="p-1.5 text-primary-foreground hover:text-red-600 bg-card border rounded shadow-sm">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* HIERARCHY INFO */}
      <div className="bg-blue-50 dark:bg-blue-950/30 border border-border rounded-lg p-4">
        <div className="flex items-start gap-3">
          <ShieldAlert className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
          <div>
            <h3 className="font-semibold text-foreground">
              Role Hierarchy & Inheritance
            </h3>
            <p className="text-sm text-muted-foreground mt-1">
              Higher-level roles automatically inherit privileges from lower
              levels. Each role is linked to a privilege level and inherits all
              permissions from that level.
            </p>
          </div>
        </div>
        <div className="flex flex-col md:flex-row gap-4 items-center text-sm">
          <div className="p-3 bg-card border border-border shadow-sm rounded-md w-full md:w-auto text-center">
            Analyst
          </div>
          <div className="hidden md:block h-0.5 w-8 bg-slate-500"></div>
          <div className="p-3 bg-card border-2 border-border shadow-sm rounded-md w-full md:w-auto text-center relative">
            Compliance Officer
            <span className="absolute -top-2 -right-2 bg-indigo-100 text-indigo-700 text-[10px] px-1.5 rounded-full">
              Inherits
            </span>
          </div>
          <div className="hidden md:block h-0.5 w-8 bg-slate-500"></div>
          <div className="p-3 bg-card border border-border shadow-sm rounded-md w-full md:w-auto text-center">
            Manager
          </div>
        </div>
      </div>

      {/* CONNECTION METHOD 2: EMBEDDED IN MODAL */}
      {/* Note: We increase max-w-lg to max-w-4xl to fit the matrix */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-foreground">
                Create / Edit Role
              </h3>
              <button
                onClick={() => setIsEditOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            </div>

            <div className="space-y-6">
              {/* Top Form Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Role Name
                  </label>
                  <input
                    type="text"
                    className="w-full border rounded p-2 text-sm"
                    placeholder="e.g. Senior Auditor"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Inherits From (Optional)
                  </label>
                  <select className="w-full border rounded p-2 text-sm bg-card">
                    <option value="">None (Standalone)</option>
                    <option value="analyst">Risk Analyst</option>
                    <option value="manager">Manager</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm  font-medium mb-1">
                    Description
                  </label>
                  <textarea
                    className="w-full border rounded p-2 text-sm"
                    rows={2}
                    placeholder="Role responsibilities..."
                  ></textarea>
                </div>
              </div>

              {/* EMBEDDED MATRIX HERE */}
              <div className="border-t pt-4">
                <h4 className="font-semibold text-foreground mb-3">
                  Permission Configuration
                </h4>
                <div className="bg-card p-2 rounded">
                  {/* We pass isReadOnly={false} so admins can check boxes */}
                  <PermissionMatrix isReadOnly={false} />
                </div>
              </div>

              {/* Footer Actions */}
              <div className="flex justify-end gap-2 pt-4 border-t">
                <button
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 text-sm text-slate-600 hover:bg-slate-100 rounded"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700">
                  Save Role Configuration
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
