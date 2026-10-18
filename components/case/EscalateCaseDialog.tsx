'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ICONS } from '@/constants/constants';
import { getComplianceOfficers, ComplianceOfficer } from '@/actions/cases.actions';
import { SearchableDropdown } from '@/components/common/dropdown/SearchableDropdown';

interface EscalateCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string, assignedFor: string) => Promise<void>;
  isLoading: boolean;
}

const ESCALATION_REASONS = [
  'High risk case requiring senior review',
  'Complex investigation beyond analyst scope',
  'SLA breach - requires immediate attention',
  'Critical priority case',
  'Customer is PEP or sanctioned entity',
  'Large transaction amount exceeds threshold',
  'Multiple red flags detected',
  'Requires executive decision',
  'Inter-departmental coordination needed',
  'Potential regulatory reporting required',
  'Other',
];

export const EscalateCaseDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: EscalateCaseDialogProps) => {
  const [officers, setOfficers] = useState<ComplianceOfficer[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(true);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadOfficers();
    }
  }, [isOpen]);

  const loadOfficers = async () => {
    try {
      setLoadingOfficers(true);
      const response = await getComplianceOfficers();
      if (response.success && response.data) {
        setOfficers(response.data);
      }
    } catch (error) {
      console.error('Error loading officers:', error);
      toast.error('Failed to load officers');
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleOfficerSelect = (officer: ComplianceOfficer) => {
    setSelectedOfficer(officer.id);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedOfficer) {
      setError('Please select an officer to assign the escalated case');
      return;
    }

    const finalReason =
      selectedReason === 'Other' ? customReason : selectedReason;

    if (!finalReason.trim()) {
      setError('Please select or enter an escalation reason');
      return;
    }

    if (finalReason.length > 500) {
      setError('Reason must not exceed 500 characters');
      return;
    }

    await onSubmit(finalReason, selectedOfficer);
    handleClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedOfficer('');
      setSelectedReason('');
      setCustomReason('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full border border-panel-border max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-panel-border sticky top-0 bg-card z-10">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ICONS.AlertTriangle className="text-yellow-600" size={24} />
            Escalate Case
          </h2>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ICONS.X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <p className="text-sm text-muted-foreground">
            Please select an officer to assign this escalated case to and provide a reason for escalation.
          </p>

          {/* Assign To Dropdown */}
          {loadingOfficers ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <SearchableDropdown
              options={officers}
              value={selectedOfficer}
              onChange={handleOfficerSelect}
              getOptionLabel={(officer) => `${officer.full_name} (${officer.email})`}
              getOptionValue={(officer) => officer.id}
              placeholder="Select an officer"
              searchPlaceholder="Search officers..."
              label="Assign To"
              required
              disabled={isLoading}
            />
          )}

          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Escalation Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isLoading}
              className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
            >
              <option value="">Select a reason...</option>
              {ESCALATION_REASONS.map((reason) => (
                <option key={reason} value={reason}>
                  {reason}
                </option>
              ))}
            </select>
          </div>

          {/* Custom Reason Textarea */}
          {selectedReason === 'Other' && (
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Custom Reason <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Enter custom escalation reason (max 500 characters)"
                rows={4}
                maxLength={500}
                disabled={isLoading}
                className="w-full p-2 rounded-lg border border-input bg-background text-foreground placeholder:text-muted-foreground resize-y"
              />
              <p className="text-xs text-muted-foreground mt-1">
                {customReason.length}/500 characters
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <ICONS.AlertCircle size={16} className="text-red-600 dark:text-red-400 mt-0.5" />
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Info Message */}
          <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
            <ICONS.Info size={16} className="text-blue-600 dark:text-blue-400 mt-0.5" />
            <p className="text-xs text-blue-700 dark:text-blue-300">
              Escalated cases will be assigned to the selected officer for review. Both the current and new assignee will be notified of this action.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-input rounded-lg text-foreground hover:bg-gray-100 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || loadingOfficers}
              className="flex-1 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Escalating...
                </>
              ) : (
                <>
                  <ICONS.AlertTriangle size={18} />
                  Escalate Case
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
