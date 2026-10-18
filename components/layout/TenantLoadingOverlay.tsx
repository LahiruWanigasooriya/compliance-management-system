"use client";

import { useTenant, TenantSwitchState } from "@/components/providers/tenant.provider";
import { Building2, Check, Loader2 } from "lucide-react";

const getStateInfo = (state: TenantSwitchState) => {
  switch (state) {
    case 'switching':
      return { text: 'Preparing...', progress: 20 };
    case 'loading':
      return { text: 'Loading data...', progress: 50 };
    case 'settling':
      return { text: 'Almost there...', progress: 85 };
    case 'complete':
      return { text: 'Complete!', progress: 100 };
    default:
      return { text: 'Switching...', progress: 0 };
  }
};

const TenantLoadingOverlay = () => {
  const { switchingToTenant, switchState } = useTenant();
  const { text, progress } = getStateInfo(switchState);
  const isComplete = switchState === 'complete';

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="flex flex-col items-center gap-4 bg-white dark:bg-gray-800 p-8 rounded-xl shadow-2xl animate-in zoom-in-95 duration-200 min-w-[280px]">
        {/* Animated icon */}
        <div className="relative">
          {isComplete ? (
            <div className="bg-emerald-500 p-4 rounded-full animate-in zoom-in duration-200">
              <Check className="w-8 h-8 text-white" />
            </div>
          ) : (
            <>
              <div className="absolute inset-0 bg-emerald-500/20 rounded-full animate-ping" />
              <div className="relative bg-emerald-500/10 p-4 rounded-full">
                <Building2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
              </div>
            </>
          )}
        </div>

        {/* Text content */}
        <div className="text-center">
          <p className="text-lg font-semibold text-gray-900 dark:text-white">
            {isComplete ? 'Tenant Switched' : 'Switching Tenant'}
          </p>
          {switchingToTenant && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
              {isComplete ? 'Now viewing' : 'Loading'}{' '}
              <span className="font-medium text-emerald-600 dark:text-emerald-400">
                {switchingToTenant.name || switchingToTenant.id}
              </span>
            </p>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-2">
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
            {!isComplete && <Loader2 className="w-3 h-3 animate-spin" />}
            <span>{text}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantLoadingOverlay;
