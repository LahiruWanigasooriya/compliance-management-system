'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Case, WorklogEntry, WorklogTimelineResponse } from '@/types/cases.types';
import { ICONS } from '@/constants/constants';
import { CaseNotes } from './CaseNotes';
import { CaseEvidence } from './CaseEvidence';
import { CaseComments } from './CaseComments';
import { CaseSpectators } from './CaseSpectators';
import { getWorklogTimeline, getComments } from '@/actions/cases.actions';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

interface CaseWorklogProps {
  caseData: Case;
  onRefresh: () => void;
  isViewOnly?: boolean;
}

type TabType = 'activity' | 'notes' | 'evidence' | 'comments' | 'spectators';

const getWorklogIcon = (type: string) => {
  switch (type) {
    case 'case_created':
      return { icon: ICONS.Plus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    case 'comment_added':
      return { icon: ICONS.MessageSquare, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    case 'status_changed':
      return { icon: ICONS.RefreshCw, color: 'text-purple-500', bg: 'bg-purple-100 dark:bg-purple-900/30' };
    case 'priority_changed':
      return { icon: ICONS.Flag, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    case 'assigned_changed':
      return { icon: ICONS.UserCheck, color: 'text-indigo-500', bg: 'bg-indigo-100 dark:bg-indigo-900/30' };
    case 'category_changed':
      return { icon: ICONS.Edit, color: 'text-cyan-500', bg: 'bg-cyan-100 dark:bg-cyan-900/30' };
    case 'risk_score_changed':
      return { icon: ICONS.TrendingUp, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
    case 'evidence_added':
      return { icon: ICONS.Paperclip, color: 'text-teal-500', bg: 'bg-teal-100 dark:bg-teal-900/30' };
    case 'note_added':
      return { icon: ICONS.FileText, color: 'text-yellow-500', bg: 'bg-yellow-100 dark:bg-yellow-900/30' };
    case 'spectator_added':
      return { icon: ICONS.UserPlus, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    case 'spectator_removed':
      return { icon: ICONS.UserMinus, color: 'text-red-500', bg: 'bg-red-100 dark:bg-red-900/30' };
    case 'case_resolved':
      return { icon: ICONS.CheckCircle, color: 'text-green-500', bg: 'bg-green-100 dark:bg-green-900/30' };
    case 'case_escalated':
      return { icon: ICONS.AlertTriangle, color: 'text-orange-500', bg: 'bg-orange-100 dark:bg-orange-900/30' };
    case 'case_closed':
      return { icon: ICONS.CheckSquare, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' };
    case 'case_reopened':
      return { icon: ICONS.RefreshCw, color: 'text-blue-500', bg: 'bg-blue-100 dark:bg-blue-900/30' };
    default:
      return { icon: ICONS.Activity, color: 'text-gray-500', bg: 'bg-gray-100 dark:bg-gray-900/30' };
  }
};

const formatDateTime = (dateString: string): string => {
  if (!dateString || dateString.startsWith('0001')) return 'N/A';
  const date = new Date(dateString);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
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

  // Map of known values to their display names
  const valueMap: Record<string, string> = {
    // Status values
    pending_review: 'Pending Review',
    in_progress: 'In Progress',
    escalated: 'Escalated',
    closed: 'Closed',
    resolved: 'Resolved',
    reopened: 'Reopened',
    open: 'Open',
    sar_filed: 'SAR Filed',
    // Priority values
    critical: 'Critical',
    high: 'High',
    medium: 'Medium',
    low: 'Low',
    // Category values
    kyc: 'KYC',
    aml: 'AML',
    fraud: 'Fraud',
    geo: 'Geolocation',
    sar: 'SAR',
    ctr: 'CTR',
    other: 'Other',
    // Risk categories
    critical_risk: 'Critical Risk',
    high_risk: 'High Risk',
    medium_risk: 'Medium Risk',
    low_risk: 'Low Risk',
  };

  // Check if the value exists in our map
  if (valueMap[strValue.toLowerCase()]) {
    return valueMap[strValue.toLowerCase()];
  }

  // Otherwise, convert snake_case to Title Case
  return strValue
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

interface ActivityTimelineProps {
  caseId: string;
  limit?: number;
  showViewMore?: boolean;
}

const PREVIEW_LIMIT = 5;

const ActivityTimeline = ({ caseId, limit = PREVIEW_LIMIT, showViewMore = true }: ActivityTimelineProps) => {
  const router = useRouter();
  const [data, setData] = useState<WorklogTimelineResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      const response = await getWorklogTimeline(caseId, 1, limit);
      setData(response);
      setError(null);
    } catch (err) {
      console.error('Error fetching worklog timeline:', err);
      setError('Failed to load activity timeline');
    } finally {
      setLoading(false);
    }
  }, [caseId, limit]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  if (loading && !data) {
    return (
      <div className="relative py-12 min-h-[120px]">
        <LoadingOverlay />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-red-500">
        <ICONS.AlertTriangle size={32} className="mb-2" />
        <p>{error}</p>
        <button
          onClick={fetchTimeline}
          className="mt-4 px-4 py-2 text-sm bg-primary text-white rounded-lg hover:bg-primary/90 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (!data || data.worklogs.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
        <ICONS.History size={48} className="mb-4 opacity-50" />
        <p className="text-lg font-medium">No Activity Yet</p>
        <p className="text-sm">Activity will appear here as actions are taken on this case.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Timeline Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ICONS.History size={18} className="text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {data.total_count} {data.total_count === 1 ? 'activity' : 'activities'}
          </span>
        </div>
        <button
          onClick={fetchTimeline}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <ICONS.RefreshCw size={14} />
          Refresh
        </button>
      </div>

      {/* Timeline */}
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
                <div className={`flex-1 pb-4 ${isLast ? '' : 'border-b border-gray-100 dark:border-gray-800'}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">{entry.title}</p>

                      {/* User info */}
                      {entry.user && entry.user.full_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          by <span className="font-medium">{entry.user.full_name}</span>
                          {entry.user.email && (
                            <span className="text-gray-400"> ({entry.user.email})</span>
                          )}
                        </p>
                      )}

                      {/* Related user info for assignment changes */}
                      {entry.related_user && entry.related_user.full_name && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Assigned to: <span className="font-medium">{entry.related_user.full_name}</span>
                        </p>
                      )}

                      {/* Content details */}
                      {entry.content && Object.keys(entry.content).length > 0 && (
                        <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                          {Object.entries(entry.content).map(([key, value]) => (
                            <div key={key} className="text-xs text-muted-foreground">
                              <span className="font-medium capitalize">{key.replaceAll('_', ' ')}:</span>{' '}
                              <span>{formatDisplayValue(value)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Timestamp */}
                    <div className="text-right flex-shrink-0">
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

      {/* View More Button */}
      {showViewMore && data.total_count > limit && (
        <div className="flex items-center justify-center pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => router.push(`/cases/${caseId}/activity`)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[#1A5276] dark:text-blue-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors cursor-pointer"
          >
            <span>View All {data.total_count} Activities</span>
            <ICONS.ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
};

export const CaseWorklog = ({ caseData, onRefresh, isViewOnly = false }: CaseWorklogProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('activity');
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    const fetchCommentsCount = async () => {
      try {
        const comments = await getComments(caseData.id);
        setCommentsCount(comments.length);
      } catch (error) {
        console.error('Error fetching comments count:', error);
      }
    };
    fetchCommentsCount();
  }, [caseData.id]);

  const tabs = [
    {
      id: 'activity' as TabType,
      label: 'Activity',
      icon: ICONS.History,
      count: 0,
    },
    {
      id: 'notes' as TabType,
      label: 'Notes',
      icon: ICONS.FileText,
      count: caseData.notes?.length || 0,
    },
    {
      id: 'evidence' as TabType,
      label: 'Evidence',
      icon: ICONS.Paperclip,
      count: caseData.evidences?.length || 0,
    },
    {
      id: 'comments' as TabType,
      label: 'Comments',
      icon: ICONS.MessageSquare,
      count: commentsCount,
    },
    {
      id: 'spectators' as TabType,
      label: 'Spectators',
      icon: ICONS.Users,
      count: caseData.spectators?.length || 0,
    },
  ];

  return (
    <div className="bg-card rounded-xl shadow border border-panel-border">
      {/* Tabs Header */}
      <div className="border-b border-panel-border">
        <div className="flex space-x-1 p-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === tab.id
                    ? 'bg-[#1A5276] dark:bg-blue-600 text-white'
                    : 'text-muted-foreground hover:bg-gray-100 dark:hover:bg-slate-800'
                }`}
              >
                <Icon size={18} />
                <span className="font-medium">{tab.label}</span>
                {tab.count > 0 && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full ${
                      activeTab === tab.id
                        ? 'bg-white/20 text-white'
                        : 'bg-gray-200 dark:bg-slate-700'
                    }`}
                  >
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'activity' && <ActivityTimeline caseId={caseData.id} />}
        {activeTab === 'notes' && <CaseNotes caseData={caseData} onRefresh={onRefresh} isViewOnly={isViewOnly} />}
        {activeTab === 'evidence' && <CaseEvidence caseData={caseData} onRefresh={onRefresh} isViewOnly={isViewOnly} />}
        {activeTab === 'comments' && <CaseComments caseData={caseData} onRefresh={onRefresh} isViewOnly={isViewOnly} />}
        {activeTab === 'spectators' && <CaseSpectators caseData={caseData} onRefresh={onRefresh} isViewOnly={isViewOnly} />}
      </div>
    </div>
  );
};
