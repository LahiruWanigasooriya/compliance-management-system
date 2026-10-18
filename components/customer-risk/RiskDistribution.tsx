import { RiskMetrics } from "@/types/customer-risk.types";

interface RiskDistributionProps {
  metrics: RiskMetrics;
}

const getScoreColor = (score: number) => {
  if (score >= 80) return "text-red-600";
  if (score >= 60) return "text-orange-600";
  if (score >= 40) return "text-yellow-600";
  return "text-green-600";
};

export default function RiskDistribution({ metrics }: RiskDistributionProps) {
  // Get percentages from distribution array
  const getCategoryPercentage = (category: string) => {
    if (!metrics.riskDistribution || !Array.isArray(metrics.riskDistribution)) {
      return 0;
    }
    const item = metrics.riskDistribution.find(
      (d) => d.category.toLowerCase() === category.toLowerCase()
    );
    return item ? item.percentage : 0;
  };

  return (
    <div className="bg-card rounded-xl border border-panel-border shadow-sm p-4 mb-4">
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Risk Distribution
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
        <div className="bg-card rounded-lg p-3 border border-panel-border">
          <div className="text-primary-foreground text-xs mb-1 font-medium">
            Critical Risk
          </div>
          <div className="text-foreground font-bold text-lg">
            {metrics.totalCriticalProfiles}
          </div>
          <div className="text-red-600 text-xs mt-1 font-semibold">
            {getCategoryPercentage("critical")}%
          </div>
        </div>
        <div className="bg-card rounded-lg p-3 border border-panel-border">
          <div className="text-primary-foreground text-xs mb-1 font-medium">
            High Risk
          </div>
          <div className="text-foreground font-bold text-lg">
            {metrics.totalHighProfiles}
          </div>
          <div className="text-orange-600 text-xs mt-1 font-semibold">
            {getCategoryPercentage("high")}%
          </div>
        </div>
        <div className="bg-card rounded-lg p-3 border border-panel-border">
          <div className="text-primary-foreground text-xs mb-1 font-medium">
            Medium Risk
          </div>
          <div className="text-foreground font-bold text-lg">
            {metrics.totalMediumProfiles}
          </div>
          <div className="text-yellow-600 text-xs mt-1 font-semibold">
            {getCategoryPercentage("medium")}%
          </div>
        </div>
        <div className="bg-card rounded-lg p-3 border border-panel-border">
          <div className="text-primary-foreground text-xs mb-1 font-medium">
            Low Risk
          </div>
          <div className="text-foreground font-bold text-lg">
            {metrics.totalLowProfiles}
          </div>
          <div className="text-green-600 text-xs mt-1 font-semibold">
            {getCategoryPercentage("low")}%
          </div>
        </div>
        <div className="bg-card rounded-lg p-3 border border-panel-border">
          <div className="text-primary-foreground text-xs mb-1 font-medium">
            Avg Risk Score
          </div>
          <div
            className={`font-bold text-lg ${getScoreColor(metrics.averageRiskScore)}`}
          >
            {metrics.averageRiskScore}
          </div>
          <div className="text-muted-foreground text-xs mt-1">
            Portfolio average
          </div>
        </div>
      </div>
    </div>
  );
}
