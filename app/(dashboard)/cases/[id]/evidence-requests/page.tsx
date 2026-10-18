'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ICONS } from '@/constants/constants';
import { Evidence } from '@/types/cases.types';
import { getEvidences, getCaseById } from '@/actions/cases.actions';
import PaginationControls, {
  getTotalPages,
} from '@/components/ui/PaginationControls';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

export default function EvidenceRequestsPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;

  const [evidences, setEvidences] = useState<Evidence[]>([]);
  const [caseTitle, setCaseTitle] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = useMemo(
    () => getTotalPages(evidences.length, pageSize),
    [evidences.length, pageSize],
  );

  const paginatedEvidences = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return evidences.slice(startIndex, startIndex + pageSize);
  }, [evidences, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [evidenceData, caseData] = await Promise.all([
        getEvidences(caseId),
        getCaseById(caseId),
      ]);

      // Filter to show only requested evidence (type = 'requested')
      const requestedEvidences = Array.isArray(evidenceData)
        ? evidenceData.filter((e: Evidence) => e.type === 'requested')
        : [];

      setEvidences(requestedEvidences);
      setCaseTitle(caseData?.title || 'Case');
    } catch (err) {
      setError('An error occurred while loading evidence requests');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caseId]);

  useEffect(() => {
    if (caseId) {
      fetchData();
    }
  }, [caseId, fetchData]);

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

  if (loading) {
    return (
      <div className="relative h-96">
        <LoadingOverlay loadingText="Loading evidence requests..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ICONS.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-semibold mb-2">Error</p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 cursor-pointer"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/cases/${caseId}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <ICONS.ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Evidence Requests
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {caseTitle} - {evidences.length} request
              {evidences.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Evidence Requests List */}
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        {evidences.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ICONS.FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No evidence requests found for this case.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {paginatedEvidences.map((evidence) => (
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

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
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
        )}

        {evidences.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalRecords={evidences.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <ICONS.Info
            size={18}
            className="text-blue-600 dark:text-blue-400 mt-0.5"
          />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">About Evidence Requests</p>
            <p>
              Evidence requests are sent to team members to collect necessary
              documents for case investigation. Each request has a priority
              level and due date. Once uploaded, the evidence becomes available
              for review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
