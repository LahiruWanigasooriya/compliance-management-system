'use client';

import { useState } from 'react';
import { ICONS } from '@/constants/constants';

interface RejectCaseDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (reason: string) => Promise<void>;
  isLoading: boolean;
}

const REJECTION_REASONS = [
  'True violation - requires SAR filing',
  'High risk transaction confirmed',
  'Customer failed to provide adequate documentation',
  'Watchlist match confirmed - PEP/Sanctions',
  'Pattern of suspicious activity detected',
  'Unable to verify source of funds',
  'Transaction structure indicates money laundering',
  'Customer non-responsive to inquiries',
  'Other',
];

export const RejectCaseDialog = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
}: RejectCaseDialogProps) => {
  const [selectedReason, setSelectedReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const finalReason =
      selectedReason === 'Other' ? customReason : selectedReason;

    if (!finalReason.trim()) {
      setError('Please select or enter a rejection reason');
      return;
    }

    if (finalReason.length > 500) {
      setError('Reason must not exceed 500 characters');
      return;
    }

    await onSubmit(finalReason);
    handleClose();
  };

  const handleClose = () => {
    if (!isLoading) {
      setSelectedReason('');
      setCustomReason('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card rounded-xl shadow-xl max-w-md w-full border border-panel-border">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-panel-border">
          <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
            <ICONS.AlertTriangle className="text-red-600" size={24} />
            Reject Case
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
            Please provide a reason for rejecting this case. This will be recorded in the audit trail.
          </p>

          {/* Reason Dropdown */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Rejection Reason <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedReason}
              onChange={(e) => setSelectedReason(e.target.value)}
              disabled={isLoading}
              className="w-full p-2 rounded-lg border border-input bg-background text-foreground"
            >
              <option value="">Select a reason...</option>
              {REJECTION_REASONS.map((reason) => (
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
                placeholder="Enter custom rejection reason (max 500 characters)"
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
              disabled={isLoading}
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Rejecting...
                </>
              ) : (
                <>
                  <ICONS.X size={18} />
                  Reject Case
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
