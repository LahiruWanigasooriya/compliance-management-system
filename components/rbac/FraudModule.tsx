// components/FraudModule.tsx
import React from "react";
import { MOCK_ALERTS } from "../../constants/rbacData";
import { Badge } from "../ui/Shared";
import { AlertTriangle, FileText, Send, UserCheck } from "lucide-react";

export const FraudModule = () => {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* SECTION 3 & 4: FRAUD ALERTS & CASES */}
      <div className="bg-card border rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg flex items-center gap-2">
            <AlertTriangle size={18} className="text-red-500" /> Fraud Alerts &
            Cases
          </h3>
          <Badge color="blue">Compliance View</Badge>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-foreground bg-card uppercase">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">Severity</th>
                <th className="px-3 py-2">Amount</th>
                <th className="px-3 py-2">AI Flag</th>
                <th className="px-3 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MOCK_ALERTS.map((alert) => (
                <tr key={alert.id}>
                  <td className="px-3 py-3 font-mono text-primary-foreground">
                    {alert.id}
                  </td>
                  <td className="px-3 py-3">
                    <Badge
                      color={
                        alert.severity === "Critical"
                          ? "red"
                          : alert.severity === "High"
                          ? "yellow"
                          : "green"
                      }
                    >
                      {alert.severity}
                    </Badge>
                  </td>
                  <td className="px-3 py-3">
                    ${alert.amount.toLocaleString()}
                  </td>
                  <td className="px-3 py-3">
                    {alert.aiFlagged && (
                      <span className="text-[10px] bg-purple-200 text-purple-700 px-1 rounded">
                        AI
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-3">
                    <button className="text-indigo-500 font-medium hover:underline text-xs">
                      Investigate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 5 & 6: REPORTING & ESCALATION */}
      <div className="bg-card border rounded-lg shadow-sm p-4 flex flex-col gap-6">
        {/* SAR/CTR Reporting */}
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
            <FileText size={18} className="text-foreground" /> SAR / CTR
            Reporting
          </h3>
          <div className="border rounded-md p-3 flex justify-between items-center bg-card">
            <div>
              <div className="font-medium text-primary-foreground text-sm">
                Draft SAR #2024-881
              </div>
              <div className="text-xs text-slate-500">
                Last edited: 2 hours ago
              </div>
            </div>
            <div className="flex gap-2">
              <button
                className="px-3 py-1 text-xs  border shadow-sm rounded border-border bg-chart-1 dark:text-red-200 text-red-700"
                disabled
              >
                Delete
              </button>
              <button className="px-3 py-1 text-xs bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1">
                <Send size={12} /> Submit
              </button>
            </div>
          </div>
        </div>

        {/* Case Escalation */}
        <div>
          <h3 className="font-bold text-lg flex items-center gap-2 mb-3">
            <UserCheck size={18} className="text-amber-600" /> Escalation
          </h3>
          <div className="bg-chart-3/10 border border-border rounded-md p-4">
            <p className="text-sm text-amber-700 dark:text-amber-300 mb-3">
              Case <strong>#F-1029</strong> requires Manager review due to
              amount &gt; $10k.
            </p>
            <button className="w-full py-2 bg-amber-400/50 dark:text-orange-50 text-orange-600 font-semibold rounded hover:bg-amber-400/30 text-sm transition-colors border border-amber-300">
              Escalate to Risk Manager
            </button>
            <p className="text-[10px] text-amber-700 mt-2 text-center opacity-90">
              Action will be logged in Audit Trail
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
