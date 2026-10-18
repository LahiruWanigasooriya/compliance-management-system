// components/ComplianceOps.tsx
import React, { useState } from "react";
import { MOCK_LOGS, MOCK_TEMP_ACCESS } from "../../constants/rbacData";
import { Modal } from "../ui/Shared";
import { Clock, History, AlertOctagon, RefreshCw } from "lucide-react";

export const ComplianceOps = () => {
  const [showTempModal, setShowTempModal] = useState(false);

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
      {/* SECTION 12 & 13: WORKFLOWS & TEMP ACCESS */}
      <div className="bg-card border rounded-lg shadow-sm p-4">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <RefreshCw size={18} className="text-green-600" /> Workflows & Access
        </h3>

        {/* Workflow Monitor */}
        <div className="mb-6">
          <h4 className="text-xs font-bold text-primary-foreground uppercase mb-3">
            Approval Pipeline
          </h4>
          <div className="flex items-center text-xs w-full">
            <div className="flex-1 text-center relative">
              <div className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 z-10 relative">
                ✓
              </div>
              <span className="font-medium">Analyst</span>
              <div className="absolute top-3 left-[50%] right-[-50%] h-0.5 bg-green-500 -z-0"></div>
            </div>
            <div className="flex-1 text-center relative">
              <div className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center mx-auto mb-1 z-10 relative">
                2
              </div>
              <span className="font-medium">Manager</span>
              <div className="text-[10px] text-blue-600 animate-pulse">
                In Progress
              </div>
              <div className="absolute top-3 left-[50%] right-[-50%] h-0.5 bg-gray-200 -z-0"></div>
            </div>
            <div className="flex-1 text-center">
              <div className="w-6 h-6 bg-gray-200 text-gray-500 rounded-full flex items-center justify-center mx-auto mb-1">
                3
              </div>
              <span className="text-gray-400">Executive</span>
            </div>
          </div>
        </div>

        {/* Temp Access */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h4 className="text-xs font-bold text-primary-foreground/90 uppercase">
              Temporary Access
            </h4>
            <button
              onClick={() => setShowTempModal(true)}
              className="text-xs bg-slate-600 hover:bg-slate-600/70 text-white px-2 py-1 rounded "
            >
              Grant Access
            </button>
          </div>
          <div className="space-y-2">
            {MOCK_TEMP_ACCESS.map((req) => (
              <div
                key={req.id}
                className="flex justify-between items-center p-2 bg-card-second rounded border text-sm"
              >
                <div>
                  <span className="font-semibold">{req.user}</span>{" "}
                  <span className="text-slate-400">→</span> {req.requestedRole}
                </div>
                <div
                  className={`text-xs px-2 py-0.5 rounded ${
                    req.status === "Active"
                      ? "bg-green-100 text-green-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {req.status} ({req.duration})
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 9 & 14: LOGS & SECURITY ALERTS */}
      <div className="bg-card border rounded-lg shadow-sm p-4 flex flex-col">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <History size={18} className="text-slate-500" /> Audit & Security
        </h3>

        {/* Conflict Alert (Section 14) */}
        <div className="bg-chart-1/10 border border-red-500 p-3 rounded mb-4 flex gap-3 items-start">
          <AlertOctagon
            className="dark:text-red-400 text-red-700 shrink-0"
            size={20}
          />
          <div>
            <h4 className="text-sm font-bold dark:text-red-400 text-red-700">
              SoD Conflict Detected
            </h4>
            <p className="text-xs dark:text-red-400 text-red-700 mt-1">
              User <strong>J.Doe</strong> attempted to assign both "Initiator"
              and "Approver" roles. Blocked by system policy.
            </p>
          </div>
        </div>

        {/* Logs Table (Section 9) */}
        <div className="flex-1 overflow-auto max-h-[250px] border rounded">
          <table className="w-full text-xs text-left">
            <thead className="bg-card sticky top-0">
              <tr>
                <th className="px-2 py-2">Time</th>
                <th className="px-2 py-2">Action</th>
                <th className="px-2 py-2">User</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {MOCK_LOGS.map((log) => (
                <tr key={log.id}>
                  <td className="px-2 py-2 ">{log.timestamp.split(" ")[1]}</td>
                  <td className="px-2 py-2 font-medium">{log.action}</td>
                  <td className="px-2 py-2">{log.user}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-2 text-center">
          <button className="text-xs text-indigo-500 hover:underline">
            View All Logs
          </button>
        </div>
      </div>

      {/* Temp Access Modal */}
      <Modal
        isOpen={showTempModal}
        onClose={() => setShowTempModal(false)}
        title="Grant Temporary Access"
      >
        <div className="space-y-3">
          <p className="text-sm bg-card text-slate-500">
            Grant temporary elevated privileges to a user. This action is
            logged.
          </p>
          <input
            className="w-full border text-primary-foreground p-2 rounded text-sm"
            placeholder="Select User..."
          />
          <input
            className="w-full border text-primary-foreground p-2 rounded text-sm"
            placeholder="Select Role..."
          />
          <select className="w-full border text-primary-foreground p-2 rounded text-sm bg-card">
            <option>1 Hour</option>
            <option>4 Hours</option>
            <option>24 Hours</option>
          </select>
          <textarea
            className="w-full border text-primary-foreground p-2 rounded text-sm"
            placeholder="Reason for access..."
            rows={2}
          ></textarea>
          <button className="w-full bg-indigo-600 text-white py-2 rounded text-sm font-medium hover:bg-indigo-700">
            Grant Access
          </button>
        </div>
      </Modal>
    </div>
  );
};
