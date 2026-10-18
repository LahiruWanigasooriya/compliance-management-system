'use client';

import { Case, CaseStatus } from '@/types/cases.types';
import { formatPriority, getSLAStatus } from './utils';
import { format } from 'date-fns';
import { ICONS } from '@/constants/constants';
import CopyableText from '@/components/common/copyable-text/CopyableText';
import LoadingOverlay from '@/components/layout/LoadingOverlay';
import { getStatusWithIcon } from '@/utils/statusHelpers';
import { Button } from '@/components/ui/button';
import { getStatusBadgeClasses, getRiskBadgeClasses } from '@/utils/kyc/badgeClasses';

const riskLevelFromScore = (risk_score: number) => {
  if (risk_score >= 80) return 'critical';
  if (risk_score >= 60) return 'high';
  if (risk_score >= 40) return 'medium';
  return 'low';
};

const STATUS_BADGE_COLOR: Record<CaseStatus, 'red' | 'green' | 'blue' | 'yellow' | 'gray'> = {
  pending_review: 'yellow',
  in_progress: 'blue',
  escalated: 'red',
  resolved: 'green',
  closed: 'gray',
  reopened: 'blue',
  open: 'blue',
  sar_filed: 'green',
};

interface CaseListPanelProps {
  cases: Case[];
  onCaseClick: (caseId: string) => void;
  loading?: boolean;
  canEscalateCase?: boolean;
}

export const CaseListPanel = ({
  cases,
  onCaseClick,
  loading = false,
  canEscalateCase = false,
}: CaseListPanelProps) => {
  const formatStatus = (status: string) => {
    return status
      .split(/[_\s]+/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  };

  const getPriorityBadgeClasses = (priority: string) => {
    const styles = {
      low: 'bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800',
      medium:
        'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800',
      high: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800',
      critical:
        'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800',
    };
    return `px-2.5 py-1 rounded-full text-xs font-semibold border ${
      styles[priority as keyof typeof styles] || styles.medium
    }`;
  };

  if (loading) {
    return (
      <div className="relative bg-card rounded-xl border border-panel-border shadow-sm p-8 mb-4 min-h-[120px]">
        <LoadingOverlay loadingText="Loading cases..." />
      </div>
    );
  }

  if (cases.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-panel-border shadow-sm p-8">
        <p className="text-center text-muted-foreground">No cases found</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-12 space-y-3">
        {cases.map((c) => {
          const slaStatus = getSLAStatus(c.sla_ends);
          const statusLabel =
            getStatusWithIcon(c.status) || formatStatus(c.status);
          const badgeColor = STATUS_BADGE_COLOR[c.status] ?? 'gray';
          return (
            <div
              key={c.id}
              className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                    <span className="text-foreground font-semibold text-lg">
                      {c.title}
                    </span>

                    <span className={getRiskBadgeClasses(c.priority)}>
                      {formatPriority(c.priority)}
                    </span>
                    <span
                      className={getRiskBadgeClasses(riskLevelFromScore(c.risk_score))}
                    >
                      Risk: {c.risk_score}
                    </span>
                    <span
                      className={`${getStatusBadgeClasses(c.status)} px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1`}
                    >
                      {statusLabel}
                    </span>
                  </div>
                  <h3 className="text-foreground font-medium text-xs mb-2">
                    <CopyableText
                      text={c.id.toUpperCase()}
                      textClassName="text-foreground font-medium text-xs"
                      iconClassName='!translate-y-0'
                    />
                  </h3>
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap gap-y-1">
                    <span className="flex items-center">
                      <ICONS.User size={14} className="mr-1" />
                      {c.assigned_user?.full_name || 'Unassigned'}
                    </span>
                    <span className="flex items-center">
                      <ICONS.Users size={14} className="mr-1" />
                      {c.customer?.customer_id ? (
                        <CopyableText
                          text={c.customer.customer_id}
                          textClassName="text-sm text-muted-foreground"
                          iconClassName='!translate-y-0.75'
                        />
                      ) : (
                        'N/A'
                      )}
                    </span>
                    <span className="flex items-center">
                      <ICONS.Briefcase size={14} className="mr-1" />
                      {c.category || 'N/A'}
                    </span>
                    <span className="flex items-center">
                      <ICONS.Calendar size={14} className="mr-1" />
                      Created: {format(new Date(c.created_at), 'MMM dd, yyyy')}
                    </span>
                    <span
                      className={`flex items-center px-2 py-0.5 rounded text-xs font-medium ${slaStatus.color}`}
                    >
                      <ICONS.Clock size={14} className="mr-1" />
                      {slaStatus.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-card rounded-lg p-3 border border-panel-border">
                  <div className="text-primary-foreground text-xs mb-1 font-medium">
                    Priority
                  </div>

                  <div
                    className={`font-medium text-xs ${
                      c.priority === 'critical'
                        ? 'text-red-600'
                        : c.priority === 'high'
                          ? 'text-orange-600'
                          : c.priority === 'medium'
                            ? 'text-yellow-600'
                            : 'text-green-600'
                    }`}
                  >
                    {formatPriority(c.priority)}
                  </div>
                </div>
                <div className="bg-card rounded-lg p-3 border border-panel-border">
                  <div className="text-primary-foreground text-xs mb-1 font-medium">
                    Risk Score
                  </div>
                  <div
                    className={`font-medium text-xs ${
                      c.risk_score >= 80
                        ? 'text-red-600'
                        : c.risk_score >= 60
                          ? 'text-orange-600'
                          : c.risk_score >= 40
                            ? 'text-yellow-600'
                            : 'text-green-600'
                    }`}
                  >
                    {c.risk_score}
                  </div>
                </div>
                <div className="bg-card rounded-lg p-3 border border-panel-border">
                  <div className="text-primary-foreground text-xs mb-1 font-medium">
                    SLA Deadline
                  </div>
                  <div className="text-foreground text-xs">
                    {c.sla_ends
                      ? format(new Date(c.sla_ends), 'MMM dd, yyyy HH:mm')
                      : 'N/A'}
                  </div>
                </div>
                <div className="bg-card rounded-lg p-3 border border-panel-border">
                  <div className="text-primary-foreground text-xs mb-1 font-medium">
                    Last Updated
                  </div>
                  <div className="text-foreground text-xs">
                    {c.updated_at
                      ? format(new Date(c.updated_at), 'MMM dd, yyyy')
                      : 'N/A'}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button
                  onClick={() => onCaseClick(c.id)}
                  className="px-4 py-2 bg-[#1A5276] cursor-pointer text-white rounded-lg hover:bg-[#143F5C] transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
                >
                  <ICONS.Eye size={16} />
                  <span>View Case</span>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
