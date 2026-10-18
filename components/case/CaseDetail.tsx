'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { updateCaseStatus } from '@/actions/cases.actions';
import { updateAlertStatus } from '@/actions/kyc.actions';
import { ICONS } from '@/constants/constants';
import KYCStatusModal from '@/components/kyc/KYCStatusModal';
import { KycStatus } from '@/enums/kyc/kycStatus';
import { AlertStatus } from '@/enums/kyc/AlertStatus';
import type { KYCAlertsRecord } from '@/types/kyc/alerts.types';
import type { Case } from '@/types/cases.types';
import {
  formatPriority,
  getSLAStatus,
  ResolutionNoteDialog,
  CaseWorklog,
  EditCaseModal,
  RejectCaseDialog,
  EscalateCaseDialog,
  ReassignCaseDialog,
} from '@/components/case';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import CopyableText from '@/components/common/copyable-text/CopyableText';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useAuth } from '@/components/providers/auth.provider';
import { useCaseDetail } from '@/hooks/useCases';
import { isSpectator } from '@/utils/helpers';
import { Button } from '@/components/ui/button';
import {
  getRiskBadgeClasses,
  getStatusBadgeClasses,
} from '@/utils/kyc/badgeClasses';
import { getStatusOptionLabel, getStatusWithIcon } from '@/utils/statusHelpers';
import { usePermissions } from '@/hooks/usepermissions';

interface CaseDetailProps {
  caseId: string;
  initialData: Case;
}

const CASE_STATUS_OPTIONS = [
  { value: 'pending_review', label: 'Pending Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'escalated', label: 'Escalated' },
  { value: 'sar_filed', label: 'SAR Filed' },
  { value: 'closed', label: 'Closed' },
];

export const CaseDetail = ({ caseId, initialData }: CaseDetailProps) => {
  const router = useRouter();
  const { user } = useAuth();
  const permissions = usePermissions();

  const toTitleCase = (str: string | null | undefined): string => {
    if (!str) return 'N/A';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toSentenceCase = (str: string | null | undefined): string => {
    if (!str) return 'N/A';
    const normalized = str.trim().replaceAll(/[_-]+/g, ' ');
    return (
      normalized.charAt(0).toUpperCase() + normalized.slice(1).toLowerCase()
    );
  };

  const formatDate = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
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
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
  };

  const formatDateTime = (dateString: string | null | undefined): string => {
    if (!dateString) return 'N/A';
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
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hour12}:${minutes} ${ampm}`;
  };

  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [showCloseDialog, setShowCloseDialog] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showRejectDialog, setShowRejectDialog] = useState<boolean>(false);
  const [showEscalateDialog, setShowEscalateDialog] = useState<boolean>(false);
  const [showReassignDialog, setShowReassignDialog] = useState<boolean>(false);
  const [exporting, setExporting] = useState<boolean>(false);
  const [showExportModal, setShowExportModal] = useState<boolean>(false);
  const [showKYCStatusModal, setShowKYCStatusModal] = useState<boolean>(false);

  // Use React Query for case details with polling and initial data from server
  const {
    caseData,
    isRefetching,
    refresh: handleRefresh,
  } = useCaseDetail({
    caseId,
    initialData,
    pollingInterval: 30000, // 30 seconds
  });

  // Use initialData as fallback if caseData is undefined during hydration
  const currentCase = caseData ?? initialData;

  const isUserSpectator = isSpectator(currentCase?.spectators, user?.id);

  const getKYCAlertRecordFromCase = (): KYCAlertsRecord | null => {
    if (!currentCase?.source?.kyc_id) return null;

    return {
      id: currentCase.source.id,
      kycId: currentCase.source.kyc_id,
      kyc: {
        id: currentCase.source.kyc_id,
        forwardReference: currentCase.source.kyc_id,
        status:
          (currentCase.customer?.kyc_status as KycStatus) || KycStatus.UNKNOWN,
        warnings: null,
        reference: currentCase.source.kyc_id,
        tenantId: currentCase.tenant_id || '',
        firstName: '',
        middleName: '',
        lastName: '',
        dob: '',
        fullAddress: '',
        email: '',
        idVerified: false,
        addressVerified: false,
        faceVerified: false,
        proofs: [],
        declinedReason: '',
        otherReason: '',
        acceptedReason: '',
        callbackUrl: '',
        redirectUrl: '',
        location: '',
        identityHash: '',
        requiredDocumentCount: 0,
        isFaceVerificationRequired: false,
        isAddressVerificationRequired: false,
        supportedDocumentTypes: [],
        createdAt: currentCase.source.created_at,
        updatedAt: currentCase.source.updated_at,
        alerts: null,
      },
      tenantId: currentCase.tenant_id || '',
      alertType: 'kyc',
      alertText: currentCase.source.alert_text,
      risk: currentCase.source.risk,
      assignedFor: currentCase.source.assigned_for,
      status: currentCase.source.status as AlertStatus,
      createdAt: currentCase.source.created_at,
      updatedAt: currentCase.source.updated_at,
    };
  };

  const handleKYCStatusUpdated = () => {
    handleRefresh();
    setShowKYCStatusModal(false);
  };

  const getFormattedStatusName = (status: string): string => {
    const statusMap: { [key: string]: string } = {
      pending_review: 'Pending Review',
      in_progress: 'In Progress',
      escalated: 'Escalated',
      sar_filed: 'SAR Filed',
      closed: 'Closed',
      reopened: 'Reopened',
      open: 'Open',
      resolved: 'Resolved',
    };
    return statusMap[status] || status;
  };

  const handleStatusChange = async (
    status: string,
    action: string,
    note?: string
  ) => {
    try {
      setLoadingAction(action);
      await updateCaseStatus(caseId, status, note);
      handleRefresh();
      toast.success(
        `Case status updated to ${getFormattedStatusName(status)} successfully`
      );
    } catch (err: unknown) {
      console.error('Error updating case status:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to update case status';
      toast.error(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleCloseCase = async (resolutionNote: string) => {
    try {
      await handleStatusChange('closed', 'close', resolutionNote);

      // Auto-close attached KYC alert
      if (
        currentCase?.source_type === 'kyc_alert' &&
        currentCase?.source?.id
      ) {
        try {
          await updateAlertStatus({
            alertId: currentCase.source.id,
            status: AlertStatus.CLOSED,
            reason: `Case closed: ${resolutionNote}`,
          });
        } catch (alertErr) {
          console.error('Failed to close attached alert:', alertErr);
          toast.warning('Case closed, but failed to auto-close attached alert');
        }
      }

      setShowCloseDialog(false);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to close case';
      toast.error(errorMessage);
    }
  };

  const handleEscalate = async (reason: string, assignedFor: string) => {
    try {
      setLoadingAction('escalate');
      await updateCaseStatus(caseId, 'escalated', reason, assignedFor);
      handleRefresh();
      toast.success('Case status updated to Escalated successfully');
      setShowEscalateDialog(false);
    } catch (err: unknown) {
      console.error('Error escalating case:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to escalate case';
      toast.error(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReject = async (reason: string) => {
    try {
      setLoadingAction('reject');
      await updateCaseStatus(caseId, 'pending_review', reason);
      handleRefresh();
      toast.success('Case status updated to Pending Review successfully');
    } catch (err: unknown) {
      console.error('Error rejecting case:', err);
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to reject case';
      toast.error(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReassign = async (newAssigneeId: string, reason: string) => {
    try {
      setLoadingAction('reassign');
      const { updateCase } = await import('@/actions/cases.actions');
      await updateCase(caseId, {
        assigned_for: newAssigneeId,
        status: currentCase?.status,
      });
      handleRefresh();
      toast.success(`Case reassigned successfully. Reason: ${reason}`);
    } catch (err: unknown) {
      console.error('Error reassigning case:', err);
      const error = err as { response?: { data?: { message?: string; error?: string } }; message?: string };
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        'Failed to reassign case';
      toast.error(errorMessage);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    if (!currentCase) return;

    setExporting(true);
    setShowExportModal(false);
    try {
      const exportData = {
        id: currentCase.id,
        title: currentCase.title,
        description: currentCase.description,
        status: currentCase.status,
        priority: currentCase.priority,
        category: currentCase.category,
        risk_score: currentCase.risk_score,
        risk_category: currentCase.risk_category || '',
        customer_name: currentCase.customer?.full_name || '',
        customer_id: currentCase.customer?.customer_id || '',
        customer_email: currentCase.customer?.email_address || '',
        customer_phone: currentCase.customer?.primary_phone_number || '',
        customer_country: currentCase.customer?.country_of_residence || '',
        assigned_to: currentCase.assigned_user?.full_name || '',
        assigned_email: currentCase.assigned_user?.email || '',
        source_type: currentCase.source_type || '',
        created_at: currentCase.created_at,
        updated_at: currentCase.updated_at,
        sla_ends: currentCase.sla_ends,
        closed_at: currentCase.closed_at || '',
        resolution_note: currentCase.resolution_note || '',
      };

      const filename = `case-${currentCase.id.substring(0, 8)}-${new Date().toISOString().split('T')[0]}`;

      if (format === 'csv') {
        const headers = Object.keys(exportData);
        const csvRows = [
          headers.join(','),
          headers
            .map((header) => {
              const value = exportData[header as keyof typeof exportData];
              const strValue = String(value ?? '');
              if (
                strValue.includes(',') ||
                strValue.includes('\n') ||
                strValue.includes('"')
              ) {
                return `"${strValue.replaceAll('"', '""')}"`;
              }
              return strValue;
            })
            .join(','),
        ];
        const blob = new Blob([csvRows.join('\n')], {
          type: 'text/csv;charset=utf-8;',
        });
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.csv`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
          type: 'application/json',
        });
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${filename}.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.URL.revokeObjectURL(url);
      } else if (format === 'pdf') {
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text('Case Export', 14, 22);
        doc.setFontSize(11);
        doc.text(`Case ID: ${currentCase.id}`, 14, 30);
        doc.text(`Generated on: ${new Date().toLocaleDateString()}`, 14, 36);

        const caseInfoData = [
          ['Title', currentCase.title || ''],
          ['Status', toTitleCase(currentCase.status)],
          ['Priority', toTitleCase(currentCase.priority)],
          ['Category', toTitleCase(currentCase.category)],
          ['Risk Score', `${currentCase.risk_score}/100`],
          ['Risk Category', toTitleCase(currentCase.risk_category)],
          [
            'Source Type',
            toTitleCase(currentCase.source_type?.replaceAll('_', ' ')),
          ],
          ['Created', formatDateTime(currentCase.created_at)],
          ['Last Updated', formatDateTime(currentCase.updated_at)],
          ['SLA Ends', formatDateTime(currentCase.sla_ends)],
        ];

        autoTable(doc, {
          head: [['Case Information', '']],
          body: caseInfoData,
          startY: 44,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [26, 82, 118] },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        });

        const customerInfoData = [
          ['Customer Name', currentCase.customer?.full_name || 'N/A'],
          ['Customer ID', currentCase.customer?.customer_id || 'N/A'],
          ['Email', currentCase.customer?.email_address || 'N/A'],
          ['Phone', currentCase.customer?.primary_phone_number || 'N/A'],
          ['Country', currentCase.customer?.country_of_residence || 'N/A'],
          ['Entity Type', toTitleCase(currentCase.customer?.entity_type)],
          ['KYC Status', toTitleCase(currentCase.customer?.kyc_status)],
        ];

        autoTable(doc, {
          head: [['Customer Information', '']],
          body: customerInfoData,
          startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [26, 82, 118] },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        });

        const assignmentInfoData = [
          [
            'Assigned Officer',
            currentCase.assigned_user?.full_name || 'Unassigned',
          ],
          ['Officer Email', currentCase.assigned_user?.email || 'N/A'],
          ['Officer Phone', currentCase.assigned_user?.phone || 'N/A'],
        ];

        autoTable(doc, {
          head: [['Assignment Information', '']],
          body: assignmentInfoData,
          startY: (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10,
          styles: { fontSize: 9 },
          headStyles: { fillColor: [26, 82, 118] },
          columnStyles: { 0: { fontStyle: 'bold', cellWidth: 50 } },
        });

        if (currentCase.description) {
          const descY = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 10;
          doc.setFontSize(11);
          doc.setFont('helvetica', 'bold');
          doc.text('Description', 14, descY);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(9);
          const splitDesc = doc.splitTextToSize(currentCase.description, 180);
          doc.text(splitDesc, 14, descY + 6);
        }

        doc.save(`${filename}.pdf`);
      }
    } catch (error) {
      console.error('Error exporting case:', error);
      toast.error('Failed to export case');
    } finally {
      setExporting(false);
    }
  };

  const slaStatus = getSLAStatus(currentCase.sla_ends);
  const currentStatusOption = CASE_STATUS_OPTIONS.find(
    (option) => option.value === currentCase.status
  );

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              Case Details
            </h1>
          </div>

          <div className="flex items-start gap-3 mt-8">
            <button
              onClick={() => {
                router.push('/cases');
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors mt-1 cursor-pointer"
            >
              <ICONS.ChevronLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {toTitleCase(currentCase.title)}
                </h1>
                {isUserSpectator && (
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                    View Only
                  </span>
                )}
                <span className={getRiskBadgeClasses(currentCase.priority)}>
                  {formatPriority(currentCase.priority)}
                </span>
                <span className={getStatusBadgeClasses(currentCase.status)}>
                  {getStatusWithIcon(currentCase.status)}
                </span>
              </div>
              <div className="text-muted-foreground flex items-center gap-1 flex-wrap">
                <strong>Case ID:</strong>{' '}
                <CopyableText
                  text={currentCase.id}
                  textClassName="text-muted-foreground"
                />
                <span>|</span>
                <span className="flex items-center gap-1">
                  <ICONS.Calendar size={14} />
                  Created: {formatDateTime(currentCase.created_at)}
                </span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col justify-end items-end gap-2">
          <div className="flex items-center gap-2">
            <Button
              onClick={handleRefresh}
              disabled={isRefetching}
              variant="ghost"
              size="icon"
              className="border cursor-pointer border-panel-border bg-card hover:bg-card/70 text-muted-foreground"
              title="Refresh data"
            >
              <RefreshCw
                size={16}
                className={isRefetching ? 'animate-spin' : ''}
              />
            </Button>
            <Button
              onClick={() => setShowExportModal(true)}
              disabled={exporting}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {exporting ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                  <span>Exporting...</span>
                </>
              ) : (
                <>
                  <ICONS.Download size={16} />
                  <span>Export</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Case Information Card */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.FileText size={20} />
              Case Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Category</p>
                <p className="text-sm font-medium text-foreground">
                  {toTitleCase(currentCase.category)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Risk Score</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-foreground">
                    {currentCase.risk_score}/100
                  </p>
                  {currentCase.risk_category && (
                    <span
                      className={getRiskBadgeClasses(currentCase.risk_category)}
                    >
                      {formatPriority(currentCase.risk_category)}
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">SLA Status</p>
                <p className={`text-sm font-medium ${slaStatus.color}`}>
                  {toTitleCase(slaStatus.status)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Source Type
                </p>
                <p className="text-sm font-medium text-foreground">
                  {currentCase.source_type
                    ? toTitleCase(currentCase.source_type.replaceAll('_', ' '))
                    : 'Manual'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Created Date
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDateTime(currentCase.created_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Last Updated
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDateTime(currentCase.updated_at)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">SLA Ends</p>
                <p className="text-sm font-medium text-foreground">
                  {formatDateTime(currentCase.sla_ends)}
                </p>
              </div>
            </div>
          </div>

          {/* Description Card */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex justify-start items-center gap-2">
              <ICONS.ArrowDownAZ size={20} />
              Description
            </h2>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {currentCase.source_type === 'kyc_alert' &&
              currentCase.source?.reason
                ? toSentenceCase(currentCase.source.reason)
                : currentCase.description || 'No description provided'}
            </p>
          </div>

          {/* Alert Source Card - Shown for escalated cases with source data */}
          {currentCase.source && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.AlertTriangle size={20} />
                Alert Source
              </h2>
              <div className="space-y-4">
                {/* Alert Text */}
                <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
                  <p className="text-sm text-muted-foreground mb-1">
                    Alert Message
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {currentCase.source.alert_text || 'No alert message'}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Alert ID
                    </p>
                    <CopyableText
                      text={currentCase.source.id}
                      textClassName="text-sm font-medium text-foreground"
                    />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Alert Risk Level
                    </p>
                    <span
                      className={getRiskBadgeClasses(
                        currentCase.source.risk ?? ''
                      )}
                    >
                      {toTitleCase(currentCase.source.risk)}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Alert Status
                    </p>
                    <span
                      className={getStatusBadgeClasses(
                        currentCase.source.status ?? ''
                      )}
                    >
                      {getStatusWithIcon(currentCase.source.status ?? '', {
                        labelPrefix: 'Alert:',
                      })}
                    </span>
                  </div>
                  {currentCase.source.kyc_id && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        KYC Status
                      </p>
                      <span
                        className={getStatusBadgeClasses(
                          currentCase.customer?.kyc_status ?? ''
                        )}
                      >
                        {getStatusWithIcon(
                          currentCase.customer?.kyc_status ?? '',
                          {
                            labelPrefix: 'KYC:',
                          }
                        )}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Source Type
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {currentCase.source_type
                        ? toTitleCase(
                            currentCase.source_type.replaceAll('_', ' ')
                          )
                        : 'N/A'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Alert Created
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(currentCase.source.created_at)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Alert Updated
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {formatDateTime(currentCase.source.updated_at)}
                    </p>
                  </div>
                  {currentCase.source.kyc_id && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">
                        KYC ID
                      </p>
                      <CopyableText
                        text={currentCase.source.kyc_id}
                        textClassName="text-sm font-medium text-foreground"
                      />
                    </div>
                  )}
                  {currentCase.source.kyc_id && permissions.canEditCase && (
                    <div className="col-span-2 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                      <button
                        onClick={() => setShowKYCStatusModal(true)}
                        disabled={loadingAction !== null}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1A5276] hover:bg-[#001F3F] text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <ICONS.RefreshCw size={16} />
                        Update KYC Status
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Customer Information Card */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.User size={20} />
              Customer Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Full Name</p>
                <p className="text-sm font-medium text-foreground">
                  {currentCase.customer?.full_name || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Customer ID
                </p>
                <div className="flex items-center gap-2">
                  {currentCase.customer?.customer_id ? (
                    <>
                      <CopyableText
                        text={currentCase.customer.customer_id}
                        textClassName="text-sm font-medium text-blue-600 dark:text-blue-400"
                        iconClassName="!translate-y-0.5"
                      />
                      <button
                        onClick={() =>
                          router.push(
                            `/customer-risk/${currentCase.customer?.id}?fromCase=${caseId}`
                          )
                        }
                        className="hover:opacity-70 transition-opacity cursor-pointer"
                        title="View customer profile in Risk Monitoring"
                      >
                        <ICONS.ExternalLink
                          size={12}
                          className="text-blue-600 dark:text-blue-400"
                        />
                      </button>
                    </>
                  ) : (
                    <span className="text-sm font-medium text-foreground">
                      N/A
                    </span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Account Number
                </p>
                <p className="text-sm font-medium text-foreground">
                  {currentCase.customer?.account_number || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Entity Type
                </p>
                <p className="text-sm font-medium text-foreground">
                  {toTitleCase(currentCase.customer?.entity_type)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Customer Status
                </p>
                <p className="text-sm font-medium text-foreground">
                  {toTitleCase(currentCase.customer?.customer_status)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Customer Tier
                </p>
                <p className="text-sm font-medium text-foreground">
                  {toTitleCase(currentCase.customer?.customer_tier)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Customer Risk
                </p>
                <p className="text-sm font-medium text-foreground">
                  {toTitleCase(currentCase.customer?.risk_category)} (
                  {currentCase.customer?.risk_score || 0})
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Date of Birth
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(currentCase.customer?.date_of_birth)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Date of Establishment
                </p>
                <p className="text-sm font-medium text-foreground">
                  {formatDate(currentCase.customer?.date_of_establishment)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Email</p>
                <p className="text-sm font-medium text-foreground">
                  {currentCase.customer?.email_address || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Phone Number
                </p>
                <p className="text-sm font-medium text-foreground">
                  {currentCase.customer?.primary_phone_number || 'N/A'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Country of Residence
                </p>
                <p className="text-sm font-medium text-foreground">
                  {toTitleCase(currentCase.customer?.country_of_residence)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">KYC Status</p>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    currentCase.customer?.kyc_status === 'verified'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                      : currentCase.customer?.kyc_status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                        : currentCase.customer?.kyc_status === 'rejected'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
                  }`}
                >
                  {toTitleCase(currentCase.customer?.kyc_status)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Actions & Assignment */}
        <div className="space-y-6">
          {/* Action Buttons Card */}
          {permissions.canEditCase && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center justify-start gap-2">
                  <ICONS.FerrisWheel size={20} />
                  <h2 className="text-lg font-semibold text-foreground">
                    Actions
                  </h2>
                </div>
                <button
                  onClick={() => setShowEditModal(true)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                  title="Edit case details"
                >
                  <ICONS.Edit size={18} className="text-muted-foreground" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label
                    htmlFor="case-status-select"
                    className="text-sm font-medium text-foreground mb-2 block"
                  >
                    Change Case Status
                  </label>
                  <Select
                    value={currentCase.status}
                    onValueChange={(newStatus) => {
                      if (newStatus === 'closed') {
                        setShowCloseDialog(true);
                      } else if (newStatus === 'escalated') {
                        setShowEscalateDialog(true);
                      } else {
                        handleStatusChange(newStatus, 'status_change');
                      }
                    }}
                    disabled={loadingAction !== null}
                  >
                    <SelectTrigger id="case-status-select" className="w-full">
                      <SelectValue placeholder="Select status">
                        {currentStatusOption
                          ? getStatusOptionLabel(
                              currentStatusOption.value,
                              currentStatusOption.label
                            )
                          : 'Select status'}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-card border border-panel-border z-50">
                      {CASE_STATUS_OPTIONS.map((option) => (
                        <SelectItem
                          key={option.value}
                          value={option.value}
                          className="cursor-pointer hover:bg-gray-100 dark:hover:bg-slate-800"
                        >
                          {getStatusOptionLabel(option.value, option.label)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          )}

          {/* Assignment Card */}
          {permissions.canEditCase && (
            <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
              <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                <ICONS.ShieldAlert size={20} />
                Assignment
              </h2>
              <div className="space-y-3">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Assigned Officer
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {currentCase.assigned_user?.full_name
                      ? toTitleCase(currentCase.assigned_user.full_name)
                      : 'Unassigned'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Officer Email
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {currentCase.assigned_user?.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Officer Phone
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {currentCase.assigned_user?.phone || 'N/A'}
                  </p>
                </div>
                <div
                  title={
                    currentCase.status === 'closed'
                      ? 'Cannot reassign a closed case'
                      : undefined
                  }
                  className="w-full text-black"
                >
                  <button
                    onClick={() => setShowReassignDialog(true)}
                    disabled={
                      loadingAction !== null || currentCase.status === 'closed'
                    }
                    className="w-full flex items-center justify-center gap-2 mt-3 px-4 py-2 border border-input rounded-lg text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ICONS.Users size={16} />
                    Reassign Case
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Additional Info Card */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Info size={20} />
              Additional Information
            </h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Spectators</p>
                <p className="text-sm font-medium text-foreground">
                  {currentCase.spectators && currentCase.spectators.length > 0
                    ? currentCase.spectators.length
                    : 'None'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Notes</p>
                <p className="text-sm font-medium text-foreground">
                  {currentCase.notes && currentCase.notes.length > 0
                    ? `${currentCase.notes.length} note(s)`
                    : 'No notes'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Evidence</p>
                <p className="text-sm font-medium text-foreground">
                  {currentCase.evidences && currentCase.evidences.length > 0
                    ? `${currentCase.evidences.length} file(s)`
                    : 'No evidence'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Investigation Worklog Section */}
      <div className="mt-6">
        <h2 className="text-xl font-bold text-foreground mb-4">
          Investigation Worklog
        </h2>
        <CaseWorklog
          caseData={currentCase}
          onRefresh={handleRefresh}
          isViewOnly={isUserSpectator}
        />
      </div>

      {/* Dialogs */}
      <ResolutionNoteDialog
        isOpen={showCloseDialog}
        onClose={() => setShowCloseDialog(false)}
        onSubmit={handleCloseCase}
        isLoading={loadingAction === 'close'}
      />

      {currentCase && (
        <>
          <EditCaseModal
            isOpen={showEditModal}
            onClose={() => setShowEditModal(false)}
            caseData={currentCase}
            onSuccess={handleRefresh}
          />

          <RejectCaseDialog
            isOpen={showRejectDialog}
            onClose={() => setShowRejectDialog(false)}
            onSubmit={handleReject}
            isLoading={loadingAction === 'reject'}
          />

          <EscalateCaseDialog
            isOpen={showEscalateDialog}
            onClose={() => setShowEscalateDialog(false)}
            onSubmit={handleEscalate}
            isLoading={loadingAction === 'escalate'}
          />

          <ReassignCaseDialog
            isOpen={showReassignDialog}
            onClose={() => setShowReassignDialog(false)}
            currentAssignee={currentCase.assigned_for}
            currentAssigneeName={
              currentCase.assigned_user?.full_name
                ? toTitleCase(currentCase.assigned_user.full_name)
                : 'Unassigned'
            }
            onSubmit={handleReassign}
            isLoading={loadingAction === 'reassign'}
          />
        </>
      )}

      {/* KYC Status Modal */}
      {showKYCStatusModal && currentCase?.source?.kyc_id && (
        <KYCStatusModal
          open={showKYCStatusModal}
          record={getKYCAlertRecordFromCase()}
          onClose={() => setShowKYCStatusModal(false)}
          onUpdated={handleKYCStatusUpdated}
        />
      )}

      {/* Export Modal */}
      {permissions.canExportCase && showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-panel-border shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Export Case
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ICONS.X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select the format to export this case:
            </p>
            <div className="space-y-2">
              {[
                { format: 'csv' as const, label: 'CSV', icon: ICONS.FileText },
                {
                  format: 'json' as const,
                  label: 'JSON',
                  icon: ICONS.FileText,
                },
                { format: 'pdf' as const, label: 'PDF', icon: ICONS.FileText },
              ].map(({ format, label, icon: Icon }) => (
                <button
                  key={format}
                  onClick={async () => {
                    await handleExport(format);
                  }}
                  disabled={exporting}
                  className="w-full px-4 py-3 bg-card border border-panel-border rounded-lg hover:bg-card/70 transition-all text-left flex items-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon size={20} className="text-muted-foreground" />
                  <span className="text-foreground font-medium">
                    Export as {label}
                  </span>
                </button>
              ))}
            </div>
            {exporting && (
              <div className="mt-4 text-center text-sm text-muted-foreground">
                Exporting...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
