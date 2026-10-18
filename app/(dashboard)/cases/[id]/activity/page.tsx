'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ICONS } from '@/constants/constants';
import { WorklogEntry, WorklogTimelineResponse } from '@/types/cases.types';
import { getWorklogTimeline, getCaseById } from '@/actions/cases.actions';
import PaginationControls from '@/components/ui/PaginationControls';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

const getWorklogIcon = (type: string) => {
  switch (type) {
    case 'case_created':
      return {
        icon: ICONS.Plus,
        color: 'text-green-500',
        bg: 'bg-green-100 dark:bg-green-900/30',
      };
    case 'comment_added':
      return {
        icon: ICONS.MessageSquare,
        color: 'text-blue-500',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
      };
    case 'status_changed':
      return {
        icon: ICONS.RefreshCw,
        color: 'text-purple-500',
        bg: 'bg-purple-100 dark:bg-purple-900/30',
      };
    case 'priority_changed':
      return {
        icon: ICONS.Flag,
        color: 'text-orange-500',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
      };
    case 'assigned_changed':
      return {
        icon: ICONS.UserCheck,
        color: 'text-indigo-500',
        bg: 'bg-indigo-100 dark:bg-indigo-900/30',
      };
    case 'category_changed':
      return {
        icon: ICONS.Edit,
        color: 'text-cyan-500',
        bg: 'bg-cyan-100 dark:bg-cyan-900/30',
      };
    case 'risk_score_changed':
      return {
        icon: ICONS.TrendingUp,
        color: 'text-red-500',
        bg: 'bg-red-100 dark:bg-red-900/30',
      };
    case 'evidence_added':
      return {
        icon: ICONS.Paperclip,
        color: 'text-teal-500',
        bg: 'bg-teal-100 dark:bg-teal-900/30',
      };
    case 'note_added':
      return {
        icon: ICONS.FileText,
        color: 'text-yellow-500',
        bg: 'bg-yellow-100 dark:bg-yellow-900/30',
      };
    case 'spectator_added':
      return {
        icon: ICONS.UserPlus,
        color: 'text-green-500',
        bg: 'bg-green-100 dark:bg-green-900/30',
      };
    case 'spectator_removed':
      return {
        icon: ICONS.UserMinus,
        color: 'text-red-500',
        bg: 'bg-red-100 dark:bg-red-900/30',
      };
    case 'case_resolved':
      return {
        icon: ICONS.CheckCircle,
        color: 'text-green-500',
        bg: 'bg-green-100 dark:bg-green-900/30',
      };
    case 'case_escalated':
      return {
        icon: ICONS.AlertTriangle,
        color: 'text-orange-500',
        bg: 'bg-orange-100 dark:bg-orange-900/30',
      };
    case 'case_closed':
      return {
        icon: ICONS.CheckSquare,
        color: 'text-gray-500',
        bg: 'bg-gray-100 dark:bg-gray-900/30',
      };
    case 'case_reopened':
      return {
        icon: ICONS.RefreshCw,
        color: 'text-blue-500',
        bg: 'bg-blue-100 dark:bg-blue-900/30',
      };
    default:
      return {
        icon: ICONS.Activity,
        color: 'text-gray-500',
        bg: 'bg-gray-100 dark:bg-gray-900/30',
      };
  }
};

const formatDateTime = (dateString: string): string => {
  if (!dateString || dateString.startsWith('0001')) return 'N/A';
  const date = new Date(dateString);
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  const hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 || 12;
  return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} at ${hour12}:${minutes} ${ampm}`;
};

const getRelativeTime = (dateString: string): string => {
  if (!dateString || dateString.startsWith('0001')) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return formatDateTime(dateString);
};

const formatDisplayValue = (value: unknown): string => {
  if (value === null || value === undefined) return 'N/A';

  const strValue = String(value);

  const valueMap: Record<string, string> = {
    pending_review: 'Pending Review',
    in_progress: 'In Progress',
    escalated: 'Escalated',
    closed: 'Closed',
    resolved: 'Resolved',
    reopened: 'Reopened',
    open: 'Open',
    sar_filed: 'SAR Filed',
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    kyc: 'KYC',
    aml: 'AML',
    fraud: 'Fraud',
    geo: 'Geolocation',
    sar: 'SAR',
    ctr: 'CTR',
    other: 'Other',
  };

  if (valueMap[strValue.toLowerCase()]) {
    return valueMap[strValue.toLowerCase()];
  }

  return strValue
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

const DEFAULT_PAGE_SIZE = 10;

const ActivityLogsPage = () => {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;

  const [data, setData] = useState<WorklogTimelineResponse | null>(null);
  const [caseTitle, setCaseTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(DEFAULT_PAGE_SIZE);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getWorklogTimeline(caseId, page, pageSize);
      setData(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching worklog timeline:', err);
      setError('Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  }, [caseId, page, pageSize]);

  const fetchCaseTitle = useCallback(async () => {
    try {
      const caseData = await getCaseById(caseId);
      setCaseTitle(caseData.title);
    } catch (err) {
      console.error('Error fetching case title:', err);
    }
  }, [caseId]);

  useEffect(() => {
    fetchTimeline();
    fetchCaseTitle();
  }, [fetchTimeline, fetchCaseTitle]);

  if (loading && !data) {
    return (
      <div className="relative h-96">
        <LoadingOverlay loadingText="Loading activity logs..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ICONS.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-semibold mb-2">
            Error loading activity logs
          </p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={fetchTimeline}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push(`/cases/${caseId}`)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
        >
          <ICONS.ChevronLeft size={20} />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Activity Logs</h1>
          {caseTitle && (
            <p className="text-sm text-muted-foreground mt-1">
              Case: {caseTitle}
            </p>
          )}
        </div>
      </div>

      {/* Activity Timeline Card */}
      <div className="bg-card rounded-xl shadow border border-panel-border p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <ICONS.History size={20} className="text-muted-foreground" />
            <span className="text-lg font-semibold text-foreground">
              {data?.total_count || 0}{' '}
              {(data?.total_count || 0) === 1 ? 'Activity' : 'Activities'}
            </span>
          </div>
          <button
            onClick={fetchTimeline}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ICONS.RefreshCw size={14} />
            Refresh
          </button>
        </div>

        {/* Timeline */}
        {data && data.worklogs.length > 0 ? (
          <>
            <div className="relative">
              {/* Vertical line */}
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>

              <div className="space-y-4">
                {data.worklogs.map((entry: WorklogEntry, index: number) => {
                  const { icon: Icon, color, bg } = getWorklogIcon(entry.type);
                  const isLast = index === data.worklogs.length - 1;

                  return (
                    <div key={entry.id} className="relative flex gap-4">
                      {/* Icon */}
                      <div
                        className={`relative z-10 flex items-center justify-center w-10 h-10 rounded-full ${bg} ring-4 ring-card`}
                      >
                        <Icon size={18} className={color} />
                      </div>

                      {/* Content */}
                      <div
                        className={`flex-1 pb-4 ${isLast ? '' : 'border-b border-gray-100 dark:border-gray-800'}`}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-foreground">
                              {entry.title}
                            </p>

                            {/* User info */}
                            {entry.user?.full_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                by{' '}
                                <span className="font-medium">
                                  {entry.user.full_name}
                                </span>
                                {entry.user.email && (
                                  <span className="text-gray-400">
                                    {' '}
                                    ({entry.user.email})
                                  </span>
                                )}
                              </p>
                            )}

                            {/* Related user info for assignment changes */}
                            {entry.related_user?.full_name && (
                              <p className="text-xs text-muted-foreground mt-1">
                                Assigned to:{' '}
                                <span className="font-medium">
                                  {entry.related_user.full_name}
                                </span>
                              </p>
                            )}

                            {/* Content details */}
                            {entry.content &&
                              Object.keys(entry.content).length > 0 && (
                                <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                                  {Object.entries(entry.content).map(
                                    ([key, value]) => (
                                      <div
                                        key={key}
                                        className="text-xs text-muted-foreground"
                                      >
                                        <span className="font-medium capitalize">
                                          {key.replaceAll('_', ' ')}:
                                        </span>{' '}
                                        <span>{formatDisplayValue(value)}</span>
                                      </div>
                                    ),
                                  )}
                                </div>
                              )}
                          </div>

                          {/* Timestamp */}
                          <div className="text-right shrink-0">
                            <p className="text-xs font-medium text-muted-foreground">
                              {getRelativeTime(entry.created_at)}
                            </p>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {formatDateTime(entry.created_at)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pagination */}
            {/* {data.pagination.total_pages > 1 && ( */}
            <div className="mt-6">
              <PaginationControls
                currentPage={page}
                totalPages={data.pagination.total_pages}
                pageSize={pageSize}
                totalRecords={data.total_count}
                onPageChange={(newPage) => setPage(newPage)}
                onPageSizeChange={(newSize) => {
                  setPageSize(newSize);
                  setPage(1);
                }}
                pageSizeOptions={[10, 20, 50]}
              />
            </div>
            {/* )} */}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <ICONS.History size={48} className="mb-4 opacity-50" />
            <p className="text-lg font-medium">No Activity Yet</p>
            <p className="text-sm">
              Activity will appear here as actions are taken on this case.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ActivityLogsPage;
