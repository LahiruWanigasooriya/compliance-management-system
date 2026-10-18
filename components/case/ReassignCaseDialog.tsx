'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ICONS } from '@/constants/constants';
import { getComplianceOfficers, ComplianceOfficer } from '@/actions/cases.actions';
import { SearchableDropdown } from '@/components/common/dropdown/SearchableDropdown';

interface ReassignCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentAssignee: string;
  currentAssigneeName: string;
  onSubmit: (newAssigneeId: string, reason: string) => Promise<void>;
  isLoading: boolean;
}

const REASSIGNMENT_REASONS = [
  'Workload balancing',
  'Specialized expertise required',
  'Officer unavailable',
  'Case complexity requires different skill set',
  'Team restructuring',
  'Original officer requested reassignment',
  'Performance improvement',
  'Other',
];


export const ReassignCaseDialog = ({
  isOpen,
  onClose,
  currentAssignee,
  currentAssigneeName,
  onSubmit,
  isLoading,
}: ReassignCaseDialogProps) => {
  const [officers, setOfficers] = useState<ComplianceOfficer[]>([]);
  const [loadingOfficers, setLoadingOfficers] = useState(true);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [selectedOfficerObj, setSelectedOfficerObj] = useState<ComplianceOfficer | null>(null);
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
        // Filter out current assignee
        const filtered = response.data.filter((o) => o.id !== currentAssignee);
        setOfficers(filtered);
      }
    } catch (error: any) {
      console.error('Error loading officers:', error);
      toast.error('Failed to load officers');
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!selectedOfficer) {
      setError('Please select an officer to assign');
      return;
    }

    if (!selectedReason) {
      setError('Please select a reassignment reason');
      return;
    }

    const finalReason =
      selectedReason === 'Other' ? customReason : selectedReason;

    if (!finalReason.trim()) {
      setError('Please provide a reason for reassignment');
      return;
    }

    if (finalReason.length > 500) {
      setError('Reason must not exceed 500 characters');
      return;
    }

    await onSubmit(selectedOfficer, finalReason);
    handleClose();
  };

  const handleOfficerSelect = (officer: ComplianceOfficer) => {
    setSelectedOfficerObj(officer);
    setSelectedOfficer(officer.id);
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedOfficer('');
      setSelectedOfficerObj(null);
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
            <ICONS.Users size={24} />
            Reassign Case
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
          {/* Current Assignee */}
          <div className="p-3 bg-gray-100 dark:bg-slate-800 rounded-lg">
            <p className="text-xs text-muted-foreground mb-1">Currently Assigned To:</p>
            <p className="text-sm font-medium text-foreground">{currentAssigneeName}</p>
          </div>

          {/* New Officer Selection */}
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
              Reason for Reassignment <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isLoading}
              className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
            >
              <option value="">Select a reason...</option>
              {REASSIGNMENT_REASONS.map((reason) => (
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
                placeholder="Enter custom reassignment reason (max 500 characters)"
                rows={3}
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
              Both the current and new assignee will be notified of this change. The reassignment will be recorded in the audit trail.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="flex-1 px-4 py-2 border border-panel-border rounded-lg text-foreground hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || loadingOfficers}
              className="flex-1 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Reassigning...' : 'Reassign Case'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
