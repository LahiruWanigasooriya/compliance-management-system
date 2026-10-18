"use client";

import { ImageVerificationWarnings } from "@/types/kyc/kyc.types";

interface ValidationWarningsProps {
  warnings: ImageVerificationWarnings | null;
}

const ValidationWarnings = ({ warnings }: ValidationWarningsProps) => {
  if (!warnings || Object.keys(warnings).length === 0) {
    return (
      <div className="bg-card p-2 text-gray-700 h-full  dark:text-gray-200">
        <div className="h-full bg-gray-50 border border-gray-200 rounded p-4 flex items-center justify-center dark:bg-[#0f1e19]/60 dark:border-[#1f3d35]">
          <p className="text-gray-500 text-sm text-center dark:text-gray-400">
            No warnings available
          </p>
        </div>
      </div>
    );
  }

  const criticalKeys = [
    "metadata_alteration_detected",
    "font_inconsistency",
    "copy_move_forgery",
    "moiré_pattern_warning",
  ];

  const successKeys = ["face_detected"];

  const isCritical = (key: string) => criticalKeys.includes(key);
  const isSuccess = (key: string) => successKeys.includes(key);

  const getWarningClasses = (key: string) => {
    if (isSuccess(key)) {
      return "text-[11px] leading-snug px-1.5 py-1 bg-emerald-50 rounded border-l-2 border-emerald-500 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-300";
    }
    if (isCritical(key)) {
      return "text-[11px] leading-snug px-1.5 py-1 bg-red-50 rounded border-l-2 border-red-500 text-red-700 dark:bg-red-950/20 dark:text-red-300";
    }
    return "text-[11px] leading-snug px-1.5 py-1 bg-gray-100 rounded border-l-2 border-gray-400 text-gray-700 dark:bg-black/30 dark:border-gray-600 dark:text-gray-300";
  };

  return (
    <div className="bg-card p-2 text-gray-700  dark:text-gray-200 rounded-sm">
      <style>{`
        .warnings-container::-webkit-scrollbar {
          width: 4px;
        }
        .warnings-container::-webkit-scrollbar-track {
          background: rgba(148, 163, 184, 0.2);
        }
        .warnings-container::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 2px;
        }
        .dark .warnings-container::-webkit-scrollbar-track {
          background: rgba(0,0,0,0.2);
        }
        .dark .warnings-container::-webkit-scrollbar-thumb {
          background: #374151;
        }
      `}</style>

      <div className="warnings-container max-h-[270px] overflow-y-auto bg-card border border-border dark:border-[#1f3d35] rounded ">
        {/* Document Warnings */}
        {Object.keys(warnings.document).length !== 0 && (
          <div className="border-b border-gray-200 p-2.5 dark:border-[#1f3d35]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="px-1.5 py-0.5 bg-blue-100 text-blue-700 text-[9px] font-medium rounded uppercase tracking-wide dark:bg-blue-900 dark:text-blue-300">
                DOC
              </span>
            </div>
            <div className="space-y-1">
              {Object.entries(warnings.document).map(([key, text]) => (
                <div key={key} className={getWarningClasses(key)} title={text}>
                  {isCritical(key) && <span className="mr-1">!</span>}
                  {isSuccess(key) && <span className="mr-1">OK</span>}
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Address Warnings */}
        {Object.keys(warnings.address).length !== 0 && (
          <div className="border-b border-gray-200 p-2.5 dark:border-[#1f3d35]">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="px-1.5 py-0.5 bg-yellow-100 text-yellow-700 text-[9px] font-medium rounded uppercase tracking-wide dark:bg-yellow-900 dark:text-yellow-400">
                ADDR
              </span>
            </div>
            <div className="space-y-1">
              {Object.entries(warnings.address).map(([key, text]) => (
                <div key={key} className={getWarningClasses(key)} title={text}>
                  {isCritical(key) && <span className="mr-1">!</span>}
                  {isSuccess(key) && <span className="mr-1">OK</span>}
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Face Warnings */}
        {Object.keys(warnings.face).length !== 0 && (
          <div className="p-2.5">
            <div className="flex items-center gap-1.5 mb-1.5">
              <span className="px-1.5 py-0.5 bg-pink-100 text-pink-700 text-[9px] font-medium rounded uppercase tracking-wide dark:bg-pink-900 dark:text-pink-300">
                FACE
              </span>
            </div>
            <div className="space-y-1">
              {Object.entries(warnings?.face || {}).map(([key, text]) => (
                <div key={key} className={getWarningClasses(key)} title={text}>
                  {isCritical(key) && <span className="mr-1">!</span>}
                  {isSuccess(key) && <span className="mr-1">OK</span>}
                  {text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ValidationWarnings;
