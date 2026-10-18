// components/SystemModule.tsx
import React from "react";
import { Bot, Shield, Globe, Lock } from "lucide-react";
import { Badge } from "../ui/Shared";

export const SystemModule = () => {
  return (
    <div className="space-y-6">
      {/* SECTIONS 7 & 8: AI & MODELS */}
      <div className="bg-card border rounded-lg shadow-sm p-5">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Bot className="text-purple-600" size={20} /> AI Model Governance
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Model Updates */}
          <div className="border rounded p-3">
            <h4 className="text-sm font-semibold mb-2">Fraud_Detection_v2.1</h4>
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                Active
              </span>
              <button className="text-xs text-blue-600 hover:underline">
                View Performance
              </button>
            </div>
          </div>
          {/* AI Alerts Approval */}
          <div className="border rounded p-3 bg-card border-border">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-semibold text-purple-500">
                Pending Approvals
              </h4>
              <Badge color="red">3 New</Badge>
            </div>
            <p className="text-xs dark:text-purple-400/70 text-purple-700/70 mt-1">
              High-risk patterns detected by AI require human sign-off.
            </p>
            <div className="mt-3 flex gap-2">
              <button className="flex-1 bg-card border border-purple-500 dark:text-purple-400 text-purple-800 text-xs py-1.5 rounded hover:bg-purple-500/10">
                Review
              </button>
              <button className="flex-1 bg-purple-600 text-white text-xs py-1.5 rounded hover:bg-purple-700">
                Approve All
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* SECTIONS 10 & 11: SECURITY & DATA VISIBILITY */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-slate-200 rounded-lg p-5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Lock size={64} />
          </div>
          <h3 className="font-bold text-white mb-2 flex items-center gap-2">
            <Shield size={18} /> System Security
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between items-center border-b border-slate-700 pb-2">
              <span>API Rate Limiting</span>
              <div className="w-8 h-4 bg-green-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-0"></div>
              </div>
            </div>
            <div className="flex justify-between items-center pb-2">
              <span>MFA Enforcement</span>
              <div className="w-8 h-4 bg-green-500 rounded-full relative">
                <div className="w-4 h-4 bg-white rounded-full absolute right-0"></div>
              </div>
            </div>
            <div className="p-2 bg-red-900/30 border border-red-800 rounded text-xs text-red-200 mt-2">
              Only IT/DevOps can modify these settings.
            </div>
          </div>
        </div>

        <div className="bg-card border rounded-lg p-5 shadow-sm">
          <h3 className="font-bold mb-2 flex items-center gap-2">
            <Globe size={18} className="text-blue-500" /> Data Visibility
            Boundaries
          </h3>
          <p className="text-xs text-slate-500 mb-4">
            Users only access data within their assigned region.
          </p>

          <div className="flex gap-2 flex-wrap">
            <div className="px-3 py-1.5 bg-card text-blue-500 border border-border rounded text-sm font-medium">
              Region: North America
            </div>
            <div className="px-3 py-1.5 bg-card text-gray-400 border border-border rounded text-sm line-through">
              Region: EU (Restricted)
            </div>
          </div>

          <div className="mt-4 pt-3 border-t text-xs text-slate-400 flex items-center gap-1">
            <Lock size={12} /> Security Protocol: Enforced
          </div>
        </div>
      </div>
    </div>
  );
};
