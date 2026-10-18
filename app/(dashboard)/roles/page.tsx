import Link from 'next/link';
import { Plus, Search, Edit2, Trash2, Eye, MoreHorizontal, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { ButtonRbac } from '@/components/ui/ButtonRbac';

// Mock Data
const roles = [
  { id: 'ROLE-001', name: 'System Admin', description: 'Full access to all modules', users: 3, updatedAt: '2023-12-30T10:00:00' },
  { id: 'ROLE-002', name: 'Compliance Officer', description: 'Can view alerts and draft reports', users: 12, updatedAt: '2023-12-29T14:30:00' },
  { id: 'ROLE-003', name: 'Risk Manager', description: 'Approves SARs and high-risk cases', users: 5, updatedAt: '2023-12-28T09:15:00' },
];

export default function RolesPage() {
  return (
    <div className="space-y-6 max-w-[1920px] mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Roles Management</h1>
          <p className="text-slate-500 text-sm mt-1">Manage system roles, permissions, and access boundaries.</p>
        </div>
        <Link href="/roles/create">
          <ButtonRbac>
            <Plus className="w-4 h-4 mr-2" />
            Create New Role
          </ButtonRbac>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
          <input 
            type="text" 
            placeholder="Search roles..." 
            className="w-full pl-10 pr-4 py-2 text-sm border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Roles Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Role Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Users</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Last Updated</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {roles.length > 0 ? (
                roles.map((role) => (
                  <tr key={role.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-indigo-600">{role.name}</span>
                        <span className="text-xs text-slate-500 truncate max-w-xs">{role.description}</span>
                        <span className="text-[10px] text-slate-400 font-mono mt-1">{role.id}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant="default">{role.users} Users</Badge>
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {new Date(role.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link href={`/roles/${role.id}`}>
                          <ButtonRbac variant="ghost" className="p-2 h-auto text-slate-500"><Eye size={16} /></ButtonRbac>
                        </Link>
                        <Link href={`/roles/${role.id}/edit`}>
                          <ButtonRbac variant="ghost" className="p-2 h-auto text-indigo-600"><Edit2 size={16} /></ButtonRbac>
                        </Link>
                        {/* Example of deleting logic would go here, triggering the modal */}
                        <ButtonRbac variant="ghost" className="p-2 h-auto text-red-600 hover:text-red-700 hover:bg-red-50"><Trash2 size={16} /></ButtonRbac>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center">
                      <div className="bg-slate-100 p-3 rounded-full mb-3"><Users className="w-6 h-6 text-slate-400" /></div>
                      <p className="font-medium">No Roles Exist</p>
                      <p className="text-sm mt-1">Create a role to get started.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}