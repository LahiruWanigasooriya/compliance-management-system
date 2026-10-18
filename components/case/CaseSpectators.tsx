'use client';

import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Case } from '@/types/cases.types';
import { ICONS } from '@/constants/constants';
import {
  addSpectator,
  removeSpectator,
  getComplianceOfficers,
  ComplianceOfficer,
} from '@/actions/cases.actions';
import { getTimeAgo } from './utils';
import CopyableText from '@/components/common/copyable-text/CopyableText';

interface CaseSpectatorsProps {
  caseData: Case;
  onRefresh: () => void;
  isViewOnly?: boolean;
}

export const CaseSpectators = ({
  caseData,
  onRefresh,
  isViewOnly = false,
}: CaseSpectatorsProps) => {
  const [loading, setLoading] = useState(false);
  const [availableOfficers, setAvailableOfficers] = useState<
    ComplianceOfficer[]
  >([]);
  const [selectedOfficer, setSelectedOfficer] = useState('');
  const [loadingOfficers, setLoadingOfficers] = useState(true);

  useEffect(() => {
    loadOfficers();
  }, []);

  const loadOfficers = async () => {
    try {
      setLoadingOfficers(true);
      const response = await getComplianceOfficers();
      if (response.success && response.data) {
        // Filter out officers who are already spectators or assigned officer
        const existingUserIds = [
          ...(caseData.spectators?.map((s) => s.user_id) || []),
          caseData.assigned_for,
        ];
        const filtered = response.data.filter((officer) => {
          return !existingUserIds.includes(officer.id);
        });
        setAvailableOfficers(filtered);
      }
    } catch (error: any) {
      console.error('Error loading officers:', error);
      toast.error('Failed to load available officers');
    } finally {
      setLoadingOfficers(false);
    }
  };

  const handleAddSpectator = async () => {
    if (!selectedOfficer) {
      toast.error('Please select an officer');
      return;
    }

    try {
      setLoading(true);
      await addSpectator({
        case_id: caseData.id,
        user_id: selectedOfficer,
      });
      toast.success('Spectator added successfully');
      setSelectedOfficer('');
      onRefresh();
      await loadOfficers(); // Reload to update available officers
    } catch (error: any) {
      console.error('Error adding spectator:', error);
      toast.error(error.message || 'Failed to add spectator');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveSpectator = async (userId: string) => {
    try {
      setLoading(true);
      await removeSpectator({
        case_id: caseData.id,
        user_id: userId,
      });
      toast.success('Spectator removed successfully');
      onRefresh();
      await loadOfficers(); // Reload to update available officers
    } catch (error: any) {
      console.error('Error removing spectator:', error);
      toast.error(error.message || 'Failed to remove spectator');
    } finally {
      setLoading(false);
    }
  };

  const spectators = caseData.spectators || [];

  return (
    <div className="space-y-6">
      {/* Add Spectator Section */}
      {!isViewOnly && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-foreground">
            Add Spectator
          </label>
          <p className="text-xs text-muted-foreground">
            Spectators can view case details but cannot edit or take actions.
          </p>
          <div className="flex gap-2">
            <select
              value={selectedOfficer}
              onChange={(e) => setSelectedOfficer(e.target.value)}
              disabled={loading || loadingOfficers}
              className="flex-1 p-2 rounded-lg border border-input bg-background text-foreground"
            >
              <option value="">
                {loadingOfficers
                  ? 'Loading officers...'
                  : 'Select an officer to add'}
              </option>
              {availableOfficers.map((officer) => (
                <option key={officer.id} value={officer.id}>
                  {officer.full_name} ({officer.email})
                </option>
              ))}
            </select>
            <button
              onClick={handleAddSpectator}
              disabled={loading || !selectedOfficer || loadingOfficers}
              className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
            >
              <ICONS.UserPlus size={18} />
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </div>
      )}

      {/* Spectators List */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground">
          Current Spectators ({spectators.length})
        </h3>

        {spectators.length === 0 ? (
          <div className="text-center py-8">
            <ICONS.Users className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
            <p className="text-sm text-muted-foreground">
              No spectators added yet. Add team members to allow them to view
              this case.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {spectators.map((spectator) => (
              <div
                key={spectator.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-slate-700"
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                    <ICONS.User
                      size={20}
                      className="text-[#1A5276] dark:text-blue-600"
                    />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground">
                        {spectator.spectator?.full_name || 'Unknown'}
                      </p>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        (
                        <CopyableText
                          text={spectator.user_id}
                          textClassName="text-xs text-muted-foreground"
                          truncate
                        />
                        )
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {spectator.spectator?.email || 'No email'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Added {getTimeAgo(spectator.created_at)}
                    </p>
                  </div>
                </div>
                {!isViewOnly && (
                  <button
                    onClick={() => handleRemoveSpectator(spectator.user_id)}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-sm transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Remove spectator"
                  >
                    <ICONS.UserMinus size={14} />
                    Remove
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Message */}
      <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <ICONS.Info
          size={16}
          className="text-blue-600 dark:text-blue-400 mt-0.5"
        />
        <div className="text-xs text-blue-700 dark:text-blue-300">
          <p className="font-medium mb-1">About Spectators:</p>
          <ul className="list-disc list-inside space-y-1">
            <li>Spectators have view-only access to the case</li>
            <li>They receive notifications about major case updates</li>
            <li>Maximum 4 spectators can be added per case</li>
            <li>Assigned officer cannot be added as a spectator</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
