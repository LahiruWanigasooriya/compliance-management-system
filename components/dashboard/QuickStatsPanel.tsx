import React from 'react';
import { ICONS } from '../../constants/constants';

type QuickStatsPanelProps = {
  title: string;
  value: string;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
  percentage?: string;
};

const QuickStatItem = ({
  title,
  value,
  icon: Icon,
  iconBgColor,
  iconColor,
  percentage,
}: QuickStatsPanelProps) => {
  return (
    <div className="flex items-center justify-between p-2 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100/70 dark:hover:bg-slate-700/50 transition-all duration-200 group">
      <div className="flex items-center gap-3">
        <div
          className={`p-2.5 rounded-lg ${iconBgColor} transition-transform duration-200 group-hover:scale-105`}
        >
          <Icon className={`h-5 w-5 ${iconColor}`} />
        </div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {title}
        </span>
      </div>
      <div className="flex items-center gap-3">
        {percentage && (
          <span className="text-xs font-medium px-2 py-1 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
            {percentage}
          </span>
        )}
        <span className="text-lg font-bold text-gray-900 dark:text-white">
          {value}
        </span>
      </div>
    </div>
  );
};

const QuickStatsPanel = ({ fraudData }: any) => {
  const highRiskPercentage = fraudData.totalCustomers
    ? `${parseFloat(((fraudData.highRiskCustomers / fraudData.totalCustomers) * 100).toFixed(1))}%`
    : '0%';

  return (
    <div className="bg-card rounded-xl border border-border p-6 w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-2 mb-5">
        <div className="h-1 w-1 rounded-full bg-primary" />
        <h3 className="text-lg font-bold text-foreground">Quick Statistics</h3>
      </div>
      <div className="space-y-3">
        <QuickStatItem
          title="High-Risk Customers"
          value={fraudData.highRiskCustomers}
          icon={ICONS.Users}
          iconBgColor="bg-red-100 dark:bg-red-900/30"
          iconColor="text-red-600 dark:text-red-400"
          percentage={highRiskPercentage}
        />
        <QuickStatItem
          title="Watchlist Matches"
          value={fraudData.watchlistMatches}
          icon={ICONS.Target}
          iconBgColor="bg-amber-100 dark:bg-amber-900/30"
          iconColor="text-amber-600 dark:text-amber-400"
        />
        <QuickStatItem
          title="KYC Updates Due"
          value={fraudData.kycUpdatesRequired}
          icon={ICONS.UserCheck}
          iconBgColor="bg-blue-100 dark:bg-blue-900/30"
          iconColor="text-blue-600 dark:text-blue-400"
        />
        <QuickStatItem
          title="Peer Analyses"
          value={fraudData.peerGroupAnalyses}
          icon={ICONS.Package}
          iconBgColor="bg-emerald-100 dark:bg-emerald-900/30"
          iconColor="text-emerald-600 dark:text-emerald-400"
        />
      </div>
    </div>
  );
};

export default QuickStatsPanel;
