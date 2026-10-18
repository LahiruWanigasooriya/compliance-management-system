// components/PermissionMatrix.tsx
import React from "react";
import { Check, X } from "lucide-react";

// Define the structure of your permissions grid
const FEATURES = [
  "Fraud Alerts",
  "Case Management",
  "SAR/CTR Reporting",
  "AI Models",
  "System Security",
  "Audit Logs",
];

const ACCESS_LEVELS = ["View", "Create", "Edit", "Delete", "Approve"];

export const PermissionMatrix = ({
  isReadOnly = false,
}: {
  isReadOnly?: boolean;
}) => {
  return (
    <div className="overflow-x-auto border rounded-lg shadow-sm bg-card">
      <table className="w-full text-sm text-left">
        <thead className="bg-card text-foreground font-semibold border-b">
          <tr>
            <th className="px-4 py-3 min-w-[150px]">Feature</th>
            {ACCESS_LEVELS.map((level) => (
              <th key={level} className="px-4 py-3 text-center w-24">
                {level}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {FEATURES.map((feature, index) => (
            <tr key={index} className="hover:bg-primary/20 transition-colors">
              <td className="px-4 py-3 font-medium text-primary-foreground">
                {feature}
              </td>
              {ACCESS_LEVELS.map((level, i) => {
                // Mocking logic: randomly checking boxes for demo
                const isChecked = Math.random() > 0.6;
                return (
                  <td key={i} className="px-4 py-3 text-center">
                    {isReadOnly ? (
                      isChecked ? (
                        <div className="flex justify-center">
                          <Check size={18} className="text-green-600" />
                        </div>
                      ) : (
                        <div className="flex justify-center">
                          <X size={18} className="text-slate-200" />
                        </div>
                      )
                    ) : (
                      <input
                        type="checkbox"
                        defaultChecked={isChecked}
                        className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                      />
                    )}
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
