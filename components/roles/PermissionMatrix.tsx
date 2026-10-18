'use client';
import React from 'react';

// Define the structure based on the image provided
const FEATURES = [
  'Fraud Alerts', 'SAR/CTR Reporting', 'Case Escalation', 
  'AI Models', 'Audit Logs', 'System Security', 'Roles Management'
];
const ACTIONS = ['Read', 'Create', 'Update', 'Delete', 'Approve', 'Export'];

interface PermissionMatrixProps {
  permissions: Record<string, string[]>;
  onChange?: (feature: string, action: string, checked: boolean) => void;
  readOnly?: boolean;
}

export const PermissionMatrix = ({ permissions, onChange, readOnly = false }: PermissionMatrixProps) => {
  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden overflow-x-auto">
      <table className="min-w-full divide-y divide-slate-200">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider sticky left-0 bg-slate-50">Feature</th>
            {ACTIONS.map(action => (
              <th key={action} className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">{action}</th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-slate-200">
          {FEATURES.map((feature) => (
            <tr key={feature} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 sticky left-0 bg-white">{feature}</td>
              {ACTIONS.map((action) => {
                const isChecked = permissions[feature]?.includes(action);
                return (
                  <td key={`${feature}-${action}`} className="px-6 py-4 whitespace-nowrap text-center">
                    <input
                      type="checkbox"
                      disabled={readOnly}
                      checked={isChecked || false}
                      onChange={(e) => onChange && onChange(feature, action, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 disabled:opacity-50"
                    />
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};