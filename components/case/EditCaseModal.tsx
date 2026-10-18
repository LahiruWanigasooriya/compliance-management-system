'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Case, CasePriority, CaseCategory } from '@/types/cases.types';
import { ICONS } from '@/constants/constants';
import { updateCase } from '@/actions/cases.actions';

interface EditCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  caseData: Case;
  onSuccess: () => void;
}

export const EditCaseModal = ({
  isOpen,
  onClose,
  caseData,
  onSuccess,
}: EditCaseModalProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<CasePriority>('medium');
  const [category, setCategory] = useState<CaseCategory>('other');
  const [riskScore, setRiskScore] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && caseData) {
      setTitle(caseData.title);
      setDescription(caseData.description);
      setPriority(caseData.priority);
      setCategory(caseData.category);
      setRiskScore(caseData.risk_score);
    }
  }, [isOpen, caseData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast.error('Title is required');
      return;
    }

    if (!description.trim()) {
      toast.error('Description is required');
      return;
    }

    if (riskScore < 0 || riskScore > 100) {
      toast.error('Risk score must be between 0 and 100');
      return;
    }

    try {
      setLoading(true);
      await updateCase(caseData.id, {
        title: title.trim(),
        description: description.trim(),
        priority,
        category,
        risk_score: riskScore,
        status: caseData.status,
      });
      toast.success('Case updated successfully');
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error updating case:', error);
      toast.error(error.message || 'Failed to update case');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-xs bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-card rounded-xl shadow-lg p-6 max-w-2xl w-full overflow-y-auto mx-4 max-h-[90vh] border border-panel-border">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-foreground">Edit Case</h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer disabled:cursor-not-allowed"
          >
            <ICONS.X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Case ID (Read-only) */}
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-1">
              Case ID
            </label>
            <input
              type="text"
              value={caseData.id}
              disabled
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-gray-100 dark:bg-slate-800 text-muted-foreground cursor-not-allowed"
            />
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter case title"
              disabled={loading}
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          {/* Category and Priority Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as CaseCategory)}
                disabled={loading}
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="kyc">KYC</option>
                <option value="aml">AML</option>
                <option value="fraud">Fraud</option>
                <option value="geo">Geo</option>
                <option value="sar">SAR</option>
                <option value="ctr">CTR</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium text-foreground mb-1">
                Priority <span className="text-red-500">*</span>
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as CasePriority)}
                disabled={loading}
                className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
          </div>

          {/* Risk Score */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Risk Score (0-100) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={riskScore}
              onChange={(e) => {
                const val = parseInt(e.target.value);
                if (val >= 0 && val <= 100) setRiskScore(val);
              }}
              disabled={loading}
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter risk score (0-100)"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter case description"
              rows={4}
              disabled={loading}
              className="w-full px-3 py-2 border border-panel-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={loading}
              className="px-4 py-2 border border-panel-border rounded-lg hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors text-foreground cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
