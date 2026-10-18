import React from "react";
import { WatchlistMatchesSummary } from "@/types/dashboard.types";
import { ICONS } from "@/constants/constants";

type WatchlistMatchesPanelProps = {
  watchlistMatches?: { type: string; count: number }[];
  watchlistData?: WatchlistMatchesSummary | null;
};

type WatchlistItemProps = {
  label: string;
  count: number;
  icon: React.ElementType;
  iconBgColor: string;
  iconColor: string;
};

const WatchlistItem = ({
  label,
  count,
  icon: Icon,
  iconBgColor,
  iconColor,
}: WatchlistItemProps) => (
  <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50/50 dark:bg-slate-800/50 border border-gray-100 dark:border-slate-700/50 hover:bg-gray-100/70 dark:hover:bg-slate-700/50 transition-all duration-200 group">
    <div className="flex items-center gap-3">
      <div className={`p-2 rounded-lg ${iconBgColor} transition-transform duration-200 group-hover:scale-105`}>
        <Icon className={`h-4 w-4 ${iconColor}`} />
      </div>
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
      </span>
    </div>
    <span className={`text-lg font-bold ${count > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-white'}`}>
      {count}
    </span>
  </div>
);

const WatchlistMatchesPanel = ({
  watchlistMatches,
  watchlistData,
}: WatchlistMatchesPanelProps) => {
  const data = watchlistData
    ? {
        ofac: watchlistData.ofac_sanctions,
        eu: watchlistData.eu_sanctions,
        un: watchlistData.un_sanctions,
        fatf: watchlistData.fatf_sanctions,
        pep: watchlistData.pep_database,
        terrorist: watchlistData.terrorist_financing,
        adverseMedia: watchlistData.adverse_media,
        internal: watchlistData.internal_watchlist,
      }
    : watchlistMatches
      ? {
          ofac: watchlistMatches.find((m) => m.type === 'OFAC Sanctions')?.count || 0,
          eu: watchlistMatches.find((m) => m.type === 'EU Sanctions')?.count || 0,
          un: watchlistMatches.find((m) => m.type === 'UN Sanctions')?.count || 0,
          fatf: watchlistMatches.find((m) => m.type === 'FATF Sanctions')?.count || 0,
          pep: watchlistMatches.find((m) => m.type === 'PEP Database')?.count || 0,
          terrorist: watchlistMatches.find((m) => m.type === 'Terrorist Financing')?.count || 0,
          adverseMedia: watchlistMatches.find((m) => m.type === 'Adverse Media')?.count || 0,
          internal: watchlistMatches.find((m) => m.type === 'Internal Watchlist')?.count || 0,
        }
      : {
          ofac: 0,
          eu: 0,
          un: 0,
          fatf: 0,
          pep: 0,
          terrorist: 0,
          adverseMedia: 0,
          internal: 0,
        };

  const watchlistItems = [
    { label: "OFAC Sanctions", count: data.ofac, icon: ICONS.Shield, iconBgColor: "bg-red-100 dark:bg-red-900/30", iconColor: "text-red-600 dark:text-red-400" },
    { label: "EU Sanctions", count: data.eu, icon: ICONS.Globe, iconBgColor: "bg-blue-100 dark:bg-blue-900/30", iconColor: "text-blue-600 dark:text-blue-400" },
    { label: "UN Sanctions", count: data.un, icon: ICONS.Globe, iconBgColor: "bg-sky-100 dark:bg-sky-900/30", iconColor: "text-sky-600 dark:text-sky-400" },
    { label: "FATF Sanctions", count: data.fatf, icon: ICONS.AlertTriangle, iconBgColor: "bg-orange-100 dark:bg-orange-900/30", iconColor: "text-orange-600 dark:text-orange-400" },
    { label: "PEP Database", count: data.pep, icon: ICONS.Users, iconBgColor: "bg-purple-100 dark:bg-purple-900/30", iconColor: "text-purple-600 dark:text-purple-400" },
    { label: "Terrorist Financing", count: data.terrorist, icon: ICONS.AlertCircle, iconBgColor: "bg-rose-100 dark:bg-rose-900/30", iconColor: "text-rose-600 dark:text-rose-400" },
    { label: "Adverse Media", count: data.adverseMedia, icon: ICONS.FileText, iconBgColor: "bg-amber-100 dark:bg-amber-900/30", iconColor: "text-amber-600 dark:text-amber-400" },
    { label: "Internal Watchlist", count: data.internal, icon: ICONS.List, iconBgColor: "bg-slate-100 dark:bg-slate-700/50", iconColor: "text-slate-600 dark:text-slate-400" },
  ];

  const totalMatches = Object.values(data).reduce((sum, val) => sum + val, 0);

  return (
    <div className="bg-card rounded-xl border border-border w-full shadow-sm hover:shadow-md transition-shadow duration-200">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-primary" />
              <h3 className="text-lg font-bold text-foreground">Watchlist Matches</h3>
            </div>
            <p className="text-sm text-muted-foreground mt-1 ml-3">
              Screening against OFAC, PEP & Sanctions
            </p>
          </div>
          {totalMatches > 0 && (
            <div className="px-3 py-1.5 rounded-full bg-red-100 dark:bg-red-900/30">
              <span className="text-sm font-bold text-red-600 dark:text-red-400">
                {totalMatches} total
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="p-6 max-h-60 overflow-y-auto space-y-3">
        {watchlistItems.map((item) => (
          <WatchlistItem
            key={item.label}
            label={item.label}
            count={item.count}
            icon={item.icon}
            iconBgColor={item.iconBgColor}
            iconColor={item.iconColor}
          />
        ))}
      </div>
    </div>
  );
};

export default WatchlistMatchesPanel;
