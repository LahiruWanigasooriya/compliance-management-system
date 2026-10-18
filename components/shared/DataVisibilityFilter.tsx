'use client';
import { Lock, EyeOff } from 'lucide-react';

interface DataVisibilityProps {
  userRole: string; // In real app, get this from auth context
  region: string;
  children: React.ReactNode;
}

export const DataVisibilityFilter = ({ userRole, region, children }: DataVisibilityProps) => {
  // Mock Logic: US Employees cannot see EU data (GDPR example)
  const isRestricted = region === 'EU' && userRole === 'US_Employee';

  if (isRestricted) {
    return (
      <div className="w-full h-64 bg-slate-50 border border-slate-200 border-dashed rounded-lg flex flex-col items-center justify-center text-slate-500 p-6 text-center">
        <div className="bg-slate-100 p-4 rounded-full mb-4">
          <EyeOff className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-900">Data Hidden</h3>
        <p className="max-w-md mt-2">
          Your current role <strong>{userRole}</strong> does not permit visibility of data in the <strong>{region}</strong> region due to data sovereignty rules.
        </p>
        <div className="mt-4 text-xs flex items-center gap-1 text-amber-600">
          <Lock size={12} />
          This access attempt has been logged.
        </div>
      </div>
    );
  }

  return <>{children}</>;
};