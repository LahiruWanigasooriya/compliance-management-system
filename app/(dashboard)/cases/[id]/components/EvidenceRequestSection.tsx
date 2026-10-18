'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ICONS } from '@/constants/constants';
import {
  createEvidenceRequest,
  getEvidences,
  getTenantUsers,
  TenantUser,
} from '@/actions/cases.actions';
import type { Evidence, EvidenceRequestPriority } from '@/types/cases.types';
import LoadingOverlay from '@/components/layout/LoadingOverlay';
import { toast } from 'sonner';
import { useTenant } from '@/components/providers/tenant.provider';

interface EvidenceRequestSectionProps {
  caseId: string;
}

const MAX_DISPLAY_REQUESTS = 2;

const EvidenceRequestSection = ({ caseId }: EvidenceRequestSectionProps) => {
  const router = useRouter();
  const { selectedTenantId } = useTenant();
  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Tenant users
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);

  // Form state
  const [documentName, setDocumentName] = useState('');
  const [priority, setPriority] = useState<EvidenceRequestPriority>('medium');
  const [selectedUserId, setSelectedUserId] = useState('');
  const [dueDays, setDueDays] = useState(7);

  const fetchEvidences = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEvidences(caseId);
      // Filter to show only requested evidence (type = 'requested')
      const requestedEvidences = Array.isArray(data)
        ? data.filter((e: Evidence) => e.type === 'requested')
        : [];
      setEvidences(requestedEvidences);
    } catch (error) {
      console.error('Error fetching evidences:', error);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  const fetchUsers = useCallback(async () => {
    if (!selectedTenantId) return;

    setLoadingUsers(true);
    try {
      const response = await getTenantUsers(selectedTenantId);
      if (response.success && response.data) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error('Error fetching tenant users:', error);
    } finally {
      setLoadingUsers(false);
    }
  }, [selectedTenantId]);

  useEffect(() => {
    fetchEvidences();
  }, [fetchEvidences]);

  useEffect(() => {
    if (showCreateForm && users.length === 0 && selectedTenantId) {
      fetchUsers();
    }
  }, [showCreateForm, users.length, selectedTenantId, fetchUsers]);

  const handleCreateRequest = async () => {
    if (!documentName.trim()) {
      toast.error('Document name is required');
      return;
    }
    if (!selectedUserId) {
      toast.error('Please select a team member to request evidence from');
      return;
    }

    const selectedUser = users.find((u) => u.id === selectedUserId);
    if (!selectedUser || !selectedUser.email) {
      toast.error('Selected team member does not have an email');
      return;
    }

    // Calculate due date in the future
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    setCreating(true);
    try {
      const response = await createEvidenceRequest({
        case_id: caseId,
        document_name: documentName.trim(),
        priority,
        due_date: dueDate.toISOString(),
        request_from: [
          {
            email: selectedUser.email,
            first_name: selectedUser.full_name.split(' ')[0],
          },
        ],
      });

      if (response.success) {
        setShowCreateForm(false);
        setDocumentName('');
        setPriority('medium');
        setSelectedUserId('');
        fetchEvidences();
        toast.success('Evidence request sent successfully');
      } else {
        toast.error(`Failed to create request: ${response.message}`);
      }
    } catch (error) {
      console.error('Error creating evidence request:', error);
      toast.error('An error occurred while creating the request');
    } finally {
      setCreating(false);
    }
  };

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusBadge = (status?: string) => {
    const styles: Record<string, string> = {
      pending:
        'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      uploaded:
        'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    };
    return `px-2 py-0.5 rounded-full text-xs font-semibold ${styles[status || 'pending'] || styles.pending}`;
  };

  const getPriorityBadge = (prio?: string): string => {
    const styles: Record<string, string> = {
      low: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
      medium:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
      high: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    };
    return `px-2 py-0.5 rounded-full text-xs font-semibold ${styles[prio || 'medium'] || styles.medium}`;
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const hasMoreRequests = evidences.length > MAX_DISPLAY_REQUESTS;
  const displayEvidences = hasMoreRequests
    ? evidences.slice(0, MAX_DISPLAY_REQUESTS)
    : evidences;

  const handleViewMore = () => {
    router.push(`/cases/${caseId}/evidence-requests`);
  };

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ICONS.FileText size={20} />
          Evidence Requests
        </h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer"
        >
          <ICONS.Plus size={16} />
          Request Evidence
        </button>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-panel-border">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
            <ICONS.Send size={16} />
            Request Evidence from Team Member
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Document Name */}
            <div className="md:col-span-2">
              <label
                htmlFor="document-name"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Document Name *
              </label>
              <input
                id="document-name"
                type="text"
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="e.g., Proof of Address, Bank Statement, ID Document"
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Request From (Team Member) */}
            <div className="md:col-span-2">
              <label
                htmlFor="request-from"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Request From (Team Member) *
              </label>
              <select
                id="request-from"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                disabled={loadingUsers}
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
              >
                <option value="">
                  {loadingUsers
                    ? 'Loading team members...'
                    : 'Select a team member'}
                </option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                    {user.email ? ` (${user.email})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Priority */}
            <div>
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) =>
                  setPriority(e.target.value as EvidenceRequestPriority)
                }
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>

            {/* Due Date */}
            <div>
              <label
                htmlFor="due-days"
                className="block text-sm font-medium text-muted-foreground mb-1"
              >
                Due In
              </label>
              <select
                id="due-days"
                value={dueDays}
                onChange={(e) => setDueDays(Number(e.target.value))}
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value={1}>1 day</option>
                <option value={3}>3 days</option>
                <option value={7}>1 week</option>
                <option value={14}>2 weeks</option>
                <option value={30}>1 month</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={handleCreateRequest}
              disabled={creating || loadingUsers}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Sending...</span>
                </>
              ) : (
                <>
                  <ICONS.Send size={16} />
                  <span>Send Request</span>
                </>
              )}
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-4 py-2 border border-panel-border rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Evidence List */}
      {loading ? (
        <div className="relative py-8 min-h-25">
          <LoadingOverlay loadingText="Loading evidence requests..." />
        </div>
      ) : evidences.length === 0 ? (
        <div className="text-center py-8">
          <ICONS.FileText size={40} className="mx-auto mb-2 opacity-30" />
          <p className="text-muted-foreground">No evidence requests yet</p>
          <p className="text-sm text-muted-foreground mt-1">
            Click &quot;Request Evidence&quot; to request a document from a team
            member
          </p>
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {displayEvidences.map((evidence) => (
              <div
                key={evidence.id}
                className={`p-4 rounded-lg border ${
                  evidence.status === 'uploaded'
                    ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'
                    : 'border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900/10'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <ICONS.FileText size={14} />
                    <span className="font-medium">
                      {evidence.document_name || 'Evidence Request'}
                    </span>
                    <span className={getStatusBadge(evidence.status)}>
                      {(evidence.status || 'pending').toUpperCase()}
                    </span>
                    {evidence.priority && (
                      <span className={getPriorityBadge(evidence.priority)}>
                        {evidence.priority.toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Created:</span>
                    <p className="font-medium">
                      {formatDateTime(evidence.created_at)}
                    </p>
                  </div>
                  {evidence.due_date && (
                    <div>
                      <span className="text-muted-foreground">Due:</span>
                      <p className="font-medium">
                        {formatDateTime(evidence.due_date)}
                      </p>
                    </div>
                  )}
                  {evidence.uploaded_at && (
                    <div>
                      <span className="text-muted-foreground">Uploaded:</span>
                      <p className="font-medium">
                        {formatDateTime(evidence.uploaded_at)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Show uploaded evidence details */}
                {evidence.status === 'uploaded' && (
                  <div className="mt-3 p-3 bg-white dark:bg-gray-900 rounded-lg border border-green-200 dark:border-green-700">
                    <h4 className="text-sm font-semibold text-green-700 dark:text-green-300 mb-2 flex items-center gap-2">
                      <ICONS.CheckCircle size={14} />
                      Evidence Uploaded
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      {evidence.content_type && (
                        <div>
                          <span className="text-muted-foreground">Type:</span>
                          <p className="font-medium">{evidence.content_type}</p>
                        </div>
                      )}
                      {evidence.size && (
                        <div>
                          <span className="text-muted-foreground">Size:</span>
                          <p className="font-medium">
                            {formatFileSize(evidence.size)}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {hasMoreRequests && (
            <div className="mt-4 flex items-center justify-center">
              <button
                onClick={handleViewMore}
                className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
              >
                View All {evidences.length} Evidence Requests
                <ICONS.ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EvidenceRequestSection;
