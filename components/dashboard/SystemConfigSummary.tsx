import React from "react";
import { ICONS } from "../../constants/constants";

const ConfigBlock = ({ title, subtitle, icon: Icon, items }: any) => (
  <div className="bg-card rounded-xl border border-border p-6">
    <div className="flex items-center space-x-3 mb-4">
      <div className="h-10 w-10 bg-gray-500 rounded-lg flex items-center justify-center">
        <Icon className="h-6 w-6 text-white" />
      </div>
      <div>
        <h3 className="text-lg font-bold text-foreground">{title}</h3>
        <p className="text-xs text-muted-foreground">{subtitle}</p>
      </div>
    </div>
    <div className="space-y-2">
      {items.map((item: any, idx: number) => (
        <div
          key={idx}
          className="flex items-center justify-between p-2 bg-card rounded border border-border"
        >
          <span className="text-xs text-primary-foreground">{item.label}</span>
          <span className="text-xs font-bold text-primary-foreground">
            {item.value}
          </span>
        </div>
      ))}
    </div>
  </div>
);

const SystemConfigSummary = () => {
  const dataRetention = [
    { label: "OFAC logs ", value: "0 years" },
    // { label: 'Transaction Logs', value: '5 years' },
    // { label: 'AI Detection Logs', value: '18 months' },
  ];

  const securityStatus = [
    { label: "Encryption", value: "AES-256" },
    { label: "RBAC Active", value: "Enabled" },
    { label: "Audit Logging", value: "Immutable" },
  ];

  const integrations = [
    { label: "OFAC Screening", value: "Connected" },
    { label: "FinCEN Gateway", value: "Active" },
    { label: "Chainalysis", value: "Synced" },
  ];

  return (
    <div className="mt-6 grid grid-cols-1  gap-6">
      {/* <ConfigBlock
        title="Data Retention"
        subtitle="Compliance & Storage"
        icon={ICONS.Database}
        items={dataRetention}
      /> */}
      {/* <ConfigBlock
        title="Security Status"
        subtitle="Access & Encryption"
        icon={ICONS.Lock}
        items={securityStatus}
      />
      <ConfigBlock
        title="Integrations"
        subtitle="External Services"
        icon={ICONS.Globe}
        items={integrations}
      /> */}
    </div>
  );
};

export default SystemConfigSummary;
