export interface AMLCategory {
  category: string;
  categoryDisplay: string;
  count: number;
  percentage: number;
  riskLevel: string;
  lastMatch: string;
}

export interface TrendData {
  recentMatches: {
    currentValue: number;
    previousValue: number;
    change: number;
    changePercent: number;
    direction: string;
    isPositiveTrend: boolean;
  };
  criticalRisk: {
    currentValue: number;
    previousValue: number;
    change: number;
    changePercent: number;
    direction: string;
    isPositiveTrend: boolean;
  };
  activeScreening: {
    currentValue: number;
    previousValue: number;
    change: number;
    changePercent: number;
    direction: string;
    isPositiveTrend: boolean;
  };
  timeSeriesData: {
    date: string;
    count: number;
    label: string;
  }[];
}

export interface AMLDashboardResponse {
  data: {
    totalEntries: number;
    totalInternalWatchlistEntries: number;
    highRisk: number;
    active: number;
    criticalRisk: number;
    recentMatches: number;
    categories: AMLCategory[];
    trendData: TrendData;
    recentMatchTrend: {
      currentValue: number;
      previousValue: number;
      change: number;
      changePercent: number;
      direction: string;
      isPositiveTrend: boolean;
    };
  };
  metadata: {
    processingMs: number;
    tenantId: string;
    version: string;
  };
  timestamp: string;
}
