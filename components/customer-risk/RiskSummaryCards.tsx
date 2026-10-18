import SummaryCard from '@/components/layout/SummaryCard';
import { ICONS } from '@/constants/constants';
import { RiskMetrics } from '@/types/customer-risk.types';

interface RiskSummaryCardsProps {
  metrics: RiskMetrics;
  totalCustomers: number;
}

export default function RiskSummaryCards({
  metrics,
  totalCustomers,
}: RiskSummaryCardsProps) {
  const getCriticalTrend = () => {
    if (!metrics.trendIndicators) return undefined;
    const change = metrics.trendIndicators.criticalChange;
    if (change > 0) return `+${change}`;
    if (change < 0) return `${change}`;
    return undefined;
  };

  const getCriticalTrendColor = () => {
    if (!metrics.trendIndicators) return undefined;
    const change = metrics.trendIndicators.criticalChange;
    if (change > 0) return 'red' as const;
    if (change < 0) return 'green' as const;
    return undefined;
  };

  const getHighTrend = () => {
    if (!metrics.trendIndicators) return undefined;
    const change = metrics.trendIndicators.highChange;
    if (change > 0) return `+${change}`;
    if (change < 0) return `${change}`;
    return undefined;
  };

  const getHighTrendColor = () => {
    if (!metrics.trendIndicators) return undefined;
    const change = metrics.trendIndicators.highChange;
    if (change > 0) return 'orange' as const;
    if (change < 0) return 'green' as const;
    return undefined;
  };

  return (
    <>
      {/* First Row - Core Risk Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SummaryCard
          title="Total Customers"
          value={metrics.totalActiveProfiles}
          mainColor="blue"
          icon={ICONS.Users}
          bottomLabel="Active accounts"
        />
        <SummaryCard
          title="Critical Risk Profiles"
          value={metrics.totalCriticalProfiles}
          mainColor="red"
          icon={ICONS.AlertTriangle}
          trend={getCriticalTrend()}
          trendColor={getCriticalTrendColor()}
          bottomLabel="Immediate attention"
        />
        <SummaryCard
          title="High Risk Profiles"
          value={metrics.totalHighProfiles}
          mainColor="orange"
          icon={ICONS.AlertCircle}
          trend={getHighTrend()}
          trendColor={getHighTrendColor()}
          bottomLabel="Enhanced monitoring"
        />
        <SummaryCard
          title="PEP Accounts"
          value={metrics.totalPepProfiles}
          mainColor="purple"
          icon={ICONS.Shield}
          bottomLabel="Politically exposed"
        />
      </div>

      {/* Second Row - Synthetic Identity Metrics */}
      {(metrics.totalSyntheticProfiles > 0 ||
        metrics.totalPendingReview > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
          <SummaryCard
            title="Synthetic Profiles"
            value={metrics.totalSyntheticProfiles || 0}
            mainColor="red"
            icon={ICONS.AlertTriangle}
            bottomLabel="Flagged as synthetic"
          />
          <SummaryCard
            title="Confirmed Synthetic"
            value={metrics.totalConfirmedSynthetic || 0}
            mainColor="red"
            icon={ICONS.XCircle}
            bottomLabel="Verified fake profiles"
          />
          <SummaryCard
            title="Pending Review"
            value={metrics.totalPendingReview || 0}
            mainColor="yellow"
            icon={ICONS.Clock}
            bottomLabel="Awaiting verification"
          />
          <SummaryCard
            title="Avg Synthetic Score"
            value={metrics.averageSyntheticScore || 0}
            mainColor="orange"
            icon={ICONS.TrendingUp}
            bottomLabel="Detection confidence"
          />
        </div>
      )}
    </>
  );
}
