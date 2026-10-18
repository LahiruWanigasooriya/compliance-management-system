// components/DataRetentionSection.tsx
"use client";

import React, { useState } from "react";
import { Save, AlertTriangle, CheckCircle } from "lucide-react";
import { RetentionPolicy } from "../../../types/sysconfig.types";
import { RETENTION_POLICIES_MOCK } from "../../../constants/sysconfig.constants";

const DataRetentionSection = () => {
  const [policies, setPolicies] = useState<RetentionPolicy[]>(
    RETENTION_POLICIES_MOCK,
  );
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, number>>(
    {},
  );
  const [warningId, setWarningId] = useState<string | null>(null);

  const handleYearsChange = (id: string, years: number) => {
    // store unsaved changes in days internally (years * 360)
    setUnsavedChanges((prev) => ({ ...prev, [id]: years * 360 }));
    if (warningId === id) setWarningId(null);
  };

  const getActiveValue = (policy: RetentionPolicy) =>
    // show value in years (round to nearest year)
    Math.round((unsavedChanges[policy.id] ?? policy.retentionPeriodDays) / 360);

  const savePolicy = (policy: RetentionPolicy) => {
    const newValue = unsavedChanges[policy.id];
    if (!newValue && newValue !== 0) return;

    // SCENARIO: Validate Retention Policies
    if (newValue < policy.regulatoryMinimumDays && warningId !== policy.id) {
      setWarningId(policy.id); // Trigger warning state
      return;
    }

    // SCENARIO: Enforce Retention Policies (Mock saving)
    setPolicies((prev) =>
      prev.map((p) =>
        p.id === policy.id
          ? {
              ...p,
              retentionPeriodDays: newValue,
              lastUpdated: new Date().toISOString(),
            }
          : p,
      ),
    );

    // Clear state
    const newUnsaved = { ...unsavedChanges };
    delete newUnsaved[policy.id];
    setUnsavedChanges(newUnsaved);
    setWarningId(null);
  };

  const formatType = (str: string) => str.replace(/_/g, " ");

  return (
    <div className="p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Data Retention Policies
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Configure automated data purging schedules. System enforces deletion
          daily at 00:00 UTC.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {policies.map((policy) => {
          const currentValue = getActiveValue(policy);
          const isChanged = unsavedChanges[policy.id] !== undefined;
          const showWarning = warningId === policy.id;

          return (
            <div
              key={policy.id}
              className={`border rounded-xl p-5 transition-all duration-200 ${
                showWarning
                  ? "border-red-300 bg-red-50"
                  : "border-border bg-card hover:border-blue-300"
              }`}
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-foreground capitalize">
                    {formatType(policy.dataType)}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Last Updated:{" "}
                    {new Date(policy.lastUpdated).toLocaleDateString()}
                  </p>
                </div>
                <div className="bg-muted p-2 rounded-lg text-center min-w-[80px]">
                  <span className="text-[10px] font-bold text-muted-foreground block">
                    MIN REQ
                  </span>
                  <span className="text-sm font-bold text-foreground block">
                    {Math.ceil(policy.regulatoryMinimumDays / 360)} Years
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Retention Period (Years)
                  </label>
                  <input
                    type="number"
                    value={currentValue}
                    onChange={(e) =>
                      handleYearsChange(
                        policy.id,
                        parseInt(e.target.value) || 0,
                      )
                    }
                    className={`w-full border rounded-lg px-3 py-2 outline-none focus:ring-2 transition bg-card text-foreground ${
                      showWarning
                        ? "border-red-300 focus:ring-red-200 text-red-700"
                        : "border-border focus:ring-blue-500"
                    }`}
                  />
                </div>

                {/* Validation Warning */}
                {showWarning && (
                  <div className="flex items-start gap-2 text-sm text-red-700 bg-red-100 p-3 rounded-lg border border-red-200">
                    <AlertTriangle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-bold">Compliance Warning</p>
                      <p className="mt-1 text-xs">
                        Value is below regulatory minimum (
                        {policy.regulatoryMinimumDays} days). Click 'Confirm' to
                        proceed anyway.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                {isChanged ? (
                  <button
                    onClick={() => savePolicy(policy)}
                    className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg font-medium transition text-primary-foreground ${
                      showWarning
                        ? "bg-red-600 hover:bg-red-700"
                        : "bg-[#164e87] hover:bg-[#133f6d]"
                    }`}
                  >
                    {showWarning ? "Confirm & Save" : "Save Changes"}
                    <Save size={16} />
                  </button>
                ) : (
                  <div className="flex items-center justify-center gap-2 py-2 text-green-600 bg-card rounded-lg border border-border text-sm font-medium">
                    <CheckCircle size={16} />
                    Active
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DataRetentionSection;
