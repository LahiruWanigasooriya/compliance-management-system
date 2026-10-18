'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { Case, Evidence, EvidenceRequestPriority } from '@/types/cases.types';
import { ICONS } from '@/constants/constants';
import {
  createEvidence,
  getEvidences,
  createEvidenceRequest,
  getTenantUsers,
  TenantUser,
} from '@/actions/cases.actions';
import { getTimeAgo } from './utils';
import CopyableText from '@/components/common/copyable-text/CopyableText';
import { useTenant } from '@/components/providers/tenant.provider';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

interface CaseEvidenceProps {
  caseData: Case;
  onRefresh: () => void;
  isViewOnly?: boolean;
}

type EvidenceTabType = 'requests' | 'uploaded';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_DISPLAY_REQUESTS = 5;

export const CaseEvidence = ({ caseData, onRefresh, isViewOnly = false }: CaseEvidenceProps) => {
  const router = useRouter();
  const { selectedTenantId } = useTenant();
  const [activeTab, setActiveTab] = useState<EvidenceTabType>('requests');
  const [uploading, setUploading] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState<Evidence[]>([]);
  const [loadingUrls, setLoadingUrls] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Evidence requests state
  const [requestedEvidences, setRequestedEvidences] = useState<Evidence[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);
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

  const fetchRequestedEvidences = useCallback(async () => {
    setLoadingRequests(true);
    try {
      const data = await getEvidences(caseData.id);
      const requested = Array.isArray(data)
        ? data.filter((e: Evidence) => e.type === 'requested')
        : [];
      setRequestedEvidences(requested);
    } catch (error) {
      console.error('Error fetching evidences:', error);
    } finally {
      setLoadingRequests(false);
    }
  }, [caseData.id]);

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
    fetchRequestedEvidences();
  }, [fetchRequestedEvidences]);

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

    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + dueDays);

    setCreating(true);
    try {
      const response = await createEvidenceRequest({
        case_id: caseData.id,
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
        fetchRequestedEvidences();
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

  const formatRequestDateTime = (dateString?: string) => {
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

  const hasMoreRequests = requestedEvidences.length > MAX_DISPLAY_REQUESTS;
  const displayRequestedEvidences = hasMoreRequests
    ? requestedEvidences.slice(0, MAX_DISPLAY_REQUESTS)
    : requestedEvidences;

  const handleViewMoreRequests = () => {
    router.push(`/cases/${caseData.id}/evidence-requests`);
  };

  const getAuthorName = (authorId: string): string | null => {
    if (caseData.assigned_user?.id === authorId) {
      return caseData.assigned_user.full_name;
    }
    const spectator = caseData.spectators?.find(
      (s) => s.user_id === authorId || s.spectator?.id === authorId,
    );
    if (spectator?.spectator?.full_name) {
      return spectator.spectator.full_name;
    }
    return null;
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast.error('File size must be less than 5MB');
      return;
    }

    try {
      setUploading(true);

      // Convert file to base64
      const base64 = await fileToBase64(file);

      // Upload evidence
      await createEvidence({
        case_id: caseData.id,
        evidence: base64,
      });

      toast.success('Evidence uploaded successfully');
      onRefresh();

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading evidence:', error);
      toast.error(error.message || 'Failed to upload evidence');
    } finally {
      setUploading(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64String = reader.result as string;
        // Remove the data:*/*;base64, prefix
        const base64Data = base64String.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleLoadUrls = async () => {
    try {
      setLoadingUrls(true);
      const urls = await getEvidences(caseData.id);
      setEvidenceUrls(urls);
    } catch (error: any) {
      console.error('Error loading evidence URLs:', error);
      toast.error(error.message || 'Failed to load evidence URLs');
    } finally {
      setLoadingUrls(false);
    }
  };

  const handleDownload = (evidenceId: string) => {
    const evidence = evidenceUrls.find((e) => e.id === evidenceId);
    if (evidence?.link) {
      window.open(evidence.link, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return ICONS.Image;
    if (contentType.includes('pdf')) return ICONS.FileText;
    return ICONS.Paperclip;
  };

  // const evidences = caseData.evidences || [];

  const evidences = [...(caseData.evidences || [])].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  );

  const evidenceTabs = [
    {
      id: 'requests' as EvidenceTabType,
      label: 'Requests',
      icon: ICONS.Send,
      count: requestedEvidences.length,
    },
    {
      id: 'uploaded' as EvidenceTabType,
      label: 'Uploaded Files',
      icon: ICONS.Paperclip,
      count: evidences.length,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Evidence Tabs */}
      <div className="flex space-x-1 border-b border-panel-border -mx-6 px-6">
        {evidenceTabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 -mb-px border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#1A5276] dark:border-blue-500 text-[#1A5276] dark:text-blue-400'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon size={16} />
              <span className="font-medium text-sm">{tab.label}</span>
              {tab.count > 0 && (
                <span
                  className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === tab.id
                      ? 'bg-[#1A5276] dark:bg-blue-600 text-white'
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

      {/* Requests Tab Content */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          {/* Create Request Button */}
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {isViewOnly ? 'Evidence requests for this case' : 'Request evidence documents from team members'}
            </p>
            {!isViewOnly && (
              <button
                onClick={() => setShowCreateForm(!showCreateForm)}
                className="flex items-center gap-2 px-3 py-1.5 text-sm bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer"
              >
                <ICONS.Plus size={16} />
                Request Evidence
              </button>
            )}
          </div>

          {/* Create Form */}
          {showCreateForm && !isViewOnly && (
            <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-panel-border">
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

          {/* Evidence Requests List */}
          {loadingRequests ? (
            <div className="relative py-8 min-h-[100px]">
              <LoadingOverlay loadingText="Loading evidence requests..." />
            </div>
          ) : requestedEvidences.length === 0 ? (
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
                {displayRequestedEvidences.map((evidence) => (
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
                          {formatRequestDateTime(evidence.created_at)}
                        </p>
                      </div>
                      {evidence.due_date && (
                        <div>
                          <span className="text-muted-foreground">Due:</span>
                          <p className="font-medium">
                            {formatRequestDateTime(evidence.due_date)}
                          </p>
                        </div>
                      )}
                      {evidence.uploaded_at && (
                        <div>
                          <span className="text-muted-foreground">Uploaded:</span>
                          <p className="font-medium">
                            {formatRequestDateTime(evidence.uploaded_at)}
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
                <div className="flex items-center justify-center">
                  <button
                    onClick={handleViewMoreRequests}
                    className="flex items-center cursor-pointer gap-2 px-4 py-2 text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                  >
                    View All {requestedEvidences.length} Evidence Requests
                    <ICONS.ChevronRight size={16} />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* Uploaded Files Tab Content */}
      {activeTab === 'uploaded' && (
        <div className="space-y-6">
          {/* Upload Section */}
          {!isViewOnly && (
            <div className="space-y-3">
              <label className="text-sm font-medium text-foreground">
                Upload Evidence
              </label>
              <div className="flex items-center gap-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="evidence-upload"
                  disabled={uploading}
                />
                <label
                  htmlFor="evidence-upload"
                  className={`flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer ${
                    uploading ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  <ICONS.Upload size={18} />
                  {uploading ? 'Uploading...' : 'Choose File'}
                </label>
                <span className="text-xs text-muted-foreground">
                  Max file size: 5MB
                </span>
              </div>
            </div>
          )}

          {/* Evidence List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground">
                Evidence Files ({evidences.length})
              </h3>
              {evidences.length > 0 && (
                <button
                  onClick={handleLoadUrls}
                  disabled={loadingUrls}
                  className="text-xs text-[#1A5276] dark:text-blue-600 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loadingUrls ? 'Loading URLs...' : 'Load Download URLs'}
                </button>
              )}
            </div>

            {evidences.length === 0 ? (
              <div className="text-center py-8">
                <ICONS.Paperclip className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-sm text-muted-foreground">
                  No evidence files yet. Upload your first evidence file above.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {evidences.map((evidence) => {
                  const FileIcon = getFileIcon(evidence.content_type);
                  const hasUrl = evidenceUrls.some((e) => e.id === evidence.id);

                  return (
                    <div
                      key={evidence.id}
                      className="p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <FileIcon
                            size={20}
                            className="text-muted-foreground mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-foreground truncate">
                              Evidence File
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <ICONS.User
                                size={14}
                                className="text-muted-foreground"
                              />
                              {getAuthorName(evidence.uploaded_by) ? (
                                <>
                                  <span className="text-xs font-medium text-foreground">
                                    {getAuthorName(evidence.uploaded_by)}
                                  </span>
                                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                                    (
                                    <CopyableText
                                      text={evidence.uploaded_by}
                                      textClassName="text-xs text-muted-foreground"
                                      truncate
                                    />
                                    )
                                  </span>
                                </>
                              ) : (
                                <CopyableText
                                  text={evidence.uploaded_by}
                                  textClassName="text-xs font-medium text-foreground"
                                  truncate
                                />
                              )}
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-muted-foreground">
                                {evidence.content_type}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {formatFileSize(evidence.size)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {getTimeAgo(evidence.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>
                        {hasUrl && (
                          <button
                            onClick={() => handleDownload(evidence.id)}
                            className="flex items-center gap-1 px-3 py-1.5 bg-[#1A5276] dark:bg-blue-600 text-white rounded text-sm hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer"
                          >
                            <ICONS.Download size={14} />
                            Download
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Info Message */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <ICONS.Info
              size={16}
              className="text-blue-600 dark:text-blue-400 mt-0.5"
            />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Evidence files are securely stored in S3. Download URLs expire after 5
              minutes for security.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
