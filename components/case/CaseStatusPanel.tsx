import { ICONS } from "@/constants/constants";
import { CasesOverview } from "@/types/cases.types";
import { getStatusBadgeClasses } from "@/utils/kyc/badgeClasses";

interface CaseStatusPanelProps {
  overview: CasesOverview | null;
}

const STATUS_ENTRIES = [
  {
    label: "Pending Review",
    value: "pending_review",
    accessor: (o: CasesOverview | null) => o?.pending_in_review ?? 0,
  },
  {
    label: "In Progress",
    value: "in_progress",
    accessor: (o: CasesOverview | null) => o?.in_progress ?? 0,
  },
  {
    label: "Escalated",
    value: "escalated",
    accessor: (o: CasesOverview | null) => o?.escalated ?? 0,
  },
  {
    label: "Closed",
    value: "closed",
    accessor: (o: CasesOverview | null) => o?.closed ?? 0,
  },
];

export const CaseStatusPanel = ({ overview }: CaseStatusPanelProps) => (
  <div className="bg-card rounded-xl shadow p-4 border border-panel-border">
    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
      <ICONS.BarChart3 size={20} />
      Case Status Overview
    </h2>
    <dl className="space-y-3 text-sm text-muted-foreground">
      {STATUS_ENTRIES.map((entry) => (
        <div key={entry.value} className="flex justify-between items-center">
          <dt className="text-foreground/70">{entry.label}</dt>
          <div className="flex items-center gap-2">
            <span
              className={`font-semibold text-foreground ${getStatusBadgeClasses(entry.value)}`}
            >
              {entry.accessor(overview)}
            </span>
          </div>
        </div>
      ))}
    </dl>
  </div>
);
