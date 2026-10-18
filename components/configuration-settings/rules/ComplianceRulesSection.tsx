// components/ComplianceRulesSection.tsx
"use client";

import React, { useState } from "react";
import { Edit2, History, Play, Pause, X } from "lucide-react";
import { ComplianceRule, RuleCategory } from "../../../types/sysconfig.types";
import {
  COMPLIANCE_RULES_MOCK,
  ALERT_HISTORY_MOCK,
} from "../../../constants/sysconfig.constants";

const ComplianceRulesSection = () => {
  const [rules, setRules] = useState<ComplianceRule[]>(COMPLIANCE_RULES_MOCK);
  const [editingRule, setEditingRule] = useState<ComplianceRule | null>(null);
  const [historyRule, setHistoryRule] = useState<ComplianceRule | null>(null);

  // -- Actions --
  const toggleStatus = (id: string) => {
    setRules((prev) =>
      prev.map((rule) =>
        rule.id === id
          ? { ...rule, status: rule.status === "ACTIVE" ? "PAUSED" : "ACTIVE" }
          : rule,
      ),
    );
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRule) return;
    setRules((prev) =>
      prev.map((r) => (r.id === editingRule.id ? editingRule : r)),
    );
    setEditingRule(null);
  };

  // -- Helpers --
  const getStatusBadge = (status: string) => {
    const styles =
      status === "ACTIVE"
        ? "bg-green-100 text-green-700 border-green-200"
        : "bg-yellow-100 text-yellow-700 border-yellow-200";
    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-bold border ${styles}`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-bold text-foreground">Compliance Rules</h2>
        <button className="px-4 py-2 bg-[#164e87] text-white rounded-lg text-sm font-medium hover:bg-[#133f6d] transition shadow-sm">
          + New Rule
        </button>
      </div>

      {/*  */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-left text-sm text-muted-foreground">
          <thead className="bg-card/50 text-foreground font-semibold uppercase text-xs">
            <tr>
              <th className="px-6 py-4">Rule Name</th>
              <th className="px-6 py-4">Status</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4 text-right">Threshold</th>
              <th className="px-6 py-4 text-center">Alerts</th>
              <th className="px-6 py-4 text-right">Last Triggered</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rules.map((rule) => (
              <tr key={rule.id} className="hover:bg-card/80 transition">
                <td className="px-6 py-4 font-medium text-foreground">
                  {rule.name}
                </td>
                <td className="px-6 py-4">{getStatusBadge(rule.status)}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-0.5 rounded text-xs bg-muted text-muted-foreground border border-border font-medium">
                    {rule.category}
                  </span>
                </td>
                <td className="px-6 py-4 text-right font-mono text-foreground">
                  {rule.threshold.toLocaleString()}
                </td>
                <td className="px-6 py-4 text-center">
                  <span className="bg-red-50 text-red-600 px-2 py-0.5 rounded-full text-xs font-bold border border-red-100">
                    {rule.alertCount}
                  </span>
                </td>
                <td className="px-6 py-4 text-right text-xs text-muted-foreground">
                  {new Date(rule.lastTriggered).toLocaleString()}
                </td>
                <td className="px-6 py-4 flex justify-center gap-2">
                  <button
                    onClick={() => toggleStatus(rule.id)}
                    className={`p-1.5 rounded-md transition ${
                      rule.status === "ACTIVE"
                        ? "hover:bg-yellow-100 text-yellow-600"
                        : "hover:bg-green-100 text-green-600"
                    }`}
                    title={
                      rule.status === "ACTIVE" ? "Pause Rule" : "Activate Rule"
                    }
                  >
                    {rule.status === "ACTIVE" ? (
                      <Pause size={16} />
                    ) : (
                      <Play size={16} />
                    )}
                  </button>
                  <button
                    onClick={() => setEditingRule(rule)}
                    className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 transition"
                    title="Edit Rule"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button
                    onClick={() => setHistoryRule(rule)}
                    className="p-1.5 rounded-md hover:bg-purple-100 text-purple-600 transition"
                    title="View History"
                  >
                    <History size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Edit Modal */}
      {editingRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-xl w-full max-w-md p-6 shadow-2xl border border-border">
            <h3 className="text-lg font-bold mb-4 text-foreground">
              Edit Rule: {editingRule.name}
            </h3>
            <form onSubmit={handleEditSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Threshold Value
                </label>
                <input
                  type="number"
                  value={editingRule.threshold}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      threshold: Number(e.target.value),
                    })
                  }
                  className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">
                  Category
                </label>
                <select
                  value={editingRule.category}
                  onChange={(e) =>
                    setEditingRule({
                      ...editingRule,
                      category: e.target.value as RuleCategory,
                    })
                  }
                  className="w-full border border-border rounded-lg px-3 py-2 bg-card text-foreground focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  <option value="FRAUD">FRAUD</option>
                  <option value="SECURITY">SECURITY</option>
                  <option value="TRANSACTION">TRANSACTION</option>
                  <option value="REGULATORY">REGULATORY</option>
                </select>
              </div>
              <div className="flex gap-3 justify-end mt-6">
                <button
                  type="button"
                  onClick={() => setEditingRule(null)}
                  className="px-4 py-2 text-muted-foreground hover:bg-card/80 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#164e87] text-white rounded-lg hover:bg-[#133f6d]"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {historyRule && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 animate-in fade-in duration-200">
          <div className="bg-card rounded-xl w-full max-w-2xl p-6 shadow-2xl relative border border-border">
            <button
              onClick={() => setHistoryRule(null)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-bold mb-1 text-foreground">
              Alert History
            </h3>
            <p className="text-sm text-muted-foreground mb-6">
              Log for rule:{" "}
              <span className="font-semibold text-foreground">
                {historyRule.name}
              </span>
            </p>

            <div className="max-h-[60vh] overflow-y-auto border border-border rounded-lg">
              <table className="w-full text-left text-sm">
                <thead className="bg-card/50 text-xs uppercase text-muted-foreground sticky top-0">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Txn ID</th>
                    <th className="px-4 py-3">Outcome</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {ALERT_HISTORY_MOCK.filter(
                    (h) => h.ruleId === historyRule.id,
                  ).map((alert) => (
                    <tr key={alert.id}>
                      <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {alert.transactionId}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            alert.outcome === "BLOCKED"
                              ? "bg-red-100 text-red-700"
                              : "bg-orange-100 text-orange-700"
                          }`}
                        >
                          {alert.outcome}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-foreground">
                        {alert.details}
                      </td>
                    </tr>
                  ))}
                  {ALERT_HISTORY_MOCK.filter((h) => h.ruleId === historyRule.id)
                    .length === 0 && (
                    <tr>
                      <td
                        colSpan={4}
                        className="text-center py-8 text-muted-foreground"
                      >
                        No alerts recorded for this rule.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceRulesSection;
