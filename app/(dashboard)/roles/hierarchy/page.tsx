'use client';
import { ArrowDown, Shield, Users } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

// A simple tree visualization component
const HierarchyNode = ({ role, children }: { role: string, children?: React.ReactNode }) => (
  <div className="flex flex-col items-center">
    <div className="p-4 bg-white border-2 border-slate-200 rounded-lg shadow-sm w-64 text-center relative z-10">
      <div className="flex justify-center mb-2 text-indigo-600"><Shield size={20} /></div>
      <h3 className="font-bold text-slate-900">{role}</h3>
      <p className="text-xs text-slate-500 mt-1">Inherits permissions from below</p>
    </div>
    {children && (
      <>
        <div className="h-8 w-0.5 bg-slate-300"></div>
        <div className="flex gap-8 relative">
          {/* Connector lines logic would go here for complex trees */}
          {children}
        </div>
      </>
    )}
  </div>
);

export default function RoleHierarchyPage() {
  return (
    <div className="space-y-8 p-8 max-w-[1920px]">
      <div className="text-center mb-12">
        <h1 className="text-2xl font-bold text-slate-900">Role Inheritance Hierarchy</h1>
        <p className="text-slate-500">Higher roles automatically inherit privileges from lower roles.</p>
      </div>

      <div className="flex flex-col items-center">
        {/* Level 1: Super Admin */}
        <HierarchyNode role="System Admin / C-Suite">
          <div className="flex flex-col items-center">
            
            {/* Level 2: Managers */}
            <div className="flex gap-12 border-t-2 border-slate-300 pt-8 mt-[-1px]">
              <HierarchyNode role="Risk Manager">
                 {/* Level 3: Operational */}
                 <div className="pt-8">
                   <ArrowDown className="mx-auto mb-2 text-slate-300" />
                   <HierarchyNode role="Compliance Officer" />
                 </div>
              </HierarchyNode>

              <HierarchyNode role="IT Security Lead">
                 <div className="pt-8">
                   <ArrowDown className="mx-auto mb-2 text-slate-300" />
                   <HierarchyNode role="IT Support" />
                 </div>
              </HierarchyNode>
            </div>
          </div>
        </HierarchyNode>
      </div>

      <div className="mt-12 bg-slate-50 p-6 rounded-lg border border-slate-200 max-w-3xl mx-auto">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Users size={16}/> Audit Log: Inheritance Changes</h3>
        <ul className="text-sm space-y-2 text-slate-600">
          <li>• <strong>System:</strong> Auto-synced "View Audit" permission to <em>Risk Manager</em> (inherited from Compliance Officer) - <em>10 mins ago</em></li>
        </ul>
      </div>
    </div>
  );
}