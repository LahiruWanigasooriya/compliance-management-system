import React from "react";
import { ICONS } from "../../../constants/constants";
import {
  getSeverityColor,
  getRiskIndicatorColor,
} from "../../../utils/helpers";

type HighRiskCustomer = {
  highRiskCustomers: any[];
  totalHighRisk: number;
};
const HighRiskCustomersPanel = ({
  highRiskCustomers,
  totalHighRisk,
}: HighRiskCustomer) => {
  return (
    <div className="bg-card rounded-xl border border-border p-6 w-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-foreground">
          High-Risk Customers
        </h3>
        <button className="text-sm text-primary-foreground hover:text-primary-foreground/70 font-semibold cursor-not-allowed">
          View All {/*    ({totalHighRisk}) */}
        </button>
      </div>
      <div className="space-y-3">
        {highRiskCustomers.map((customer, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between p-4 bg-card rounded-lg border border-gray-200 dark:border-slate-700  dark:hover:border-slate-500 transition-shadow hover:bg-gray-50 dark:hover:bg-card/70 "
          >
            <div className="flex items-center space-x-3">
              <div className="h-10 w-10 bg-gray-800 dark:bg-white/40 rounded-full flex items-center justify-center">
                <ICONS.User size={20} className="text-white" />
              </div>
              <div>
                <p className="text-sm font-bold text-foreground">
                  {customer.name}
                </p>
                <div className="flex items-center space-x-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    {customer.id}
                  </span>
                  <span className="text-xs text-gray-500">•</span>
                  <span className="text-xs text-muted-foreground">
                    Peer: {customer.peerGroup}
                  </span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="flex items-center space-x-2 mb-1 justify-end">
                <span
                  className={`px-2 py-1 rounded text-xs font-bold ${getSeverityColor(
                    customer.riskLevel
                  )}`}
                >
                  {customer.riskLevel}
                </span>
                <span
                  className={`text-sm font-bold ${getRiskIndicatorColor(
                    customer.score
                  )}`}
                >
                  {customer.score}
                </span>
              </div>
              <div className="flex items-center justify-end space-x-2 text-xs text-muted-foreground">
                <span>{customer.alerts} alerts</span>
                <span>•</span>
                <span>{customer.lastActivity}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HighRiskCustomersPanel;
