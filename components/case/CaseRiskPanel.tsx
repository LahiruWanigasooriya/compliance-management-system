import { ICONS } from "@/constants/constants";
import { CasesOverview } from "@/types/cases.types";
import { getRiskBadgeClasses } from "@/utils/kyc/badgeClasses";

interface CaseRiskPanelProps {
  overview: CasesOverview | null;
}

const RISK_ENTRIES = [
  { label: "Critical", value: "critical" },
  { label: "High", value: "high" },
  { label: "Medium", value: "medium" },
  { label: "Low", value: "low" },
];

export const CaseRiskPanel = ({ overview }: CaseRiskPanelProps) => {
  return (
    <div className="bg-card rounded-xl shadow p-4 border border-panel-border">
      <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
        <ICONS.BarChart3 size={20} />
        Risk Type Overview
      </h2>
      <dl className="space-y-3 text-sm text-muted-foreground">
        {RISK_ENTRIES.map((entry) => (
          <div key={entry.value} className="flex justify-between items-center">
            <dt className="text-foreground/70">{entry.label}</dt>
            <div className="flex items-center gap-2">
              <span
                className={`font-semibold text-foreground ${getRiskBadgeClasses(entry.value)}`}
              >
                {overview?.[entry.value as keyof CasesOverview] ?? 0}
              </span>
            </div>
          </div>
        ))}
      </dl>
    </div>
  );
};
