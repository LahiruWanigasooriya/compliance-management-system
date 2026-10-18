import React from "react";
import { ICONS } from "../../constants/constants";

type MetricItemProps = {
  title: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
};

const MetricItem = ({
  title,
  value,
  icon: Icon,
  colorClass,
}: MetricItemProps) => (
  <div className="bg-card  rounded-lg p-4 border border-border transition-shadow  w-full hover:bg-gray-50 dark:hover:bg-card/70">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-lg font-bold text-primary-foreground mt-1">
          {value}
        </p>
      </div>
      <Icon className={`h-8 w-8 ${colorClass}  opacity-80`} />
    </div>
  </div>
);

type SystemStatusItemProps = {
  isOnline?: boolean;
};

const SystemStatusItem = ({ isOnline = true }: SystemStatusItemProps) => (
  <div className="bg-card rounded-lg p-4 border border-border transition-shadow w-full hover:bg-gray-50 dark:hover:bg-card/70">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs text-gray-500">System Status</p>
        <div className="flex items-center mt-1">
          <span
            className={`w-2 h-2 rounded-full mr-2 ${
              isOnline ? "bg-green-500 animate-pulse" : "bg-red-500"
            }`}
          ></span>
          <p
            className={`text-lg font-bold ${
              isOnline
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      <ICONS.Activity
        className={`h-8 w-8 opacity-80 ${
          isOnline
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      />
    </div>
  </div>
);

type QuickMetricsBarProps = {
  fraudData: any;
  aiMetrics: any;
  systemStatus?: 'online' | 'offline' | string;
};

const QuickMetricsBar = ({ fraudData, aiMetrics, systemStatus = 'online' }: QuickMetricsBarProps) => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-4 mb-6">
    <MetricItem
      title="Avg Resolution"
      value={fraudData.avgResolutionTime}
      icon={ICONS.Clock}
      colorClass="text-[#1A5276]"
    />
    <MetricItem
      title="False Positive"
      value={fraudData.falsePositiveRate}
      icon={ICONS.Target}
      colorClass="text-[#1A5276]"
    />
    <MetricItem
      title="Resolved Cases"
      value={fraudData.resolvedCases}
      icon={ICONS.CheckCircle}
      colorClass="text-[#1A5276]"
    />
  </div>
);

export default QuickMetricsBar;
