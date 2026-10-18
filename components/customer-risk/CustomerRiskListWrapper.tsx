'use client';

import { useRouter } from 'next/navigation';
import { useState, useCallback } from 'react';
import { Customer } from '@/types/customer-risk.types';
import CustomerRiskList from './CustomerRiskList';
import { CustomerRiskControls } from './CustomerRiskControls';
import { ICONS } from '@/constants/constants';
import {
  getRiskDashboardProfiles,
  RiskDashboardProfile,
  RiskDashboardFilters,
} from '@/actions/cases.actions';
import {
  exportRiskProfiles,
  ExportProfilesFilters,
} from '@/actions/customer-risk.actions';
import {
  calculateAccountAge,
  formatCurrency,
  capitalizeRiskLevel,
  formatKYCStatus,
  formatLastActivity,
  formatCustomerStatus,
  formatCreatedDate,
} from './utils';

interface CustomerRiskListWrapperProps {
  initialCustomers: Customer[];
}

export default function CustomerRiskListWrapper({
  initialCustomers,
}: CustomerRiskListWrapperProps) {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [filters, setFilters] = useState<RiskDashboardFilters>({});

  const handleViewProfile = (customerId: string) => {
    router.push(`/customer-risk/${customerId}`);
  };

  const mapProfileToCustomer = (profile: RiskDashboardProfile): Customer => ({
    id: profile.id || 'N/A',
    customer_id: profile.customer_id || 'N/A',
    customerName: profile.full_name || 'Unknown',
    accountNumber: profile.account_number || 'N/A',
    riskScore: profile.risk_score || 0,
    riskLevel: capitalizeRiskLevel(profile.risk_category || 'low'),
    customerType:
      profile.entity_type === 'individual' ? 'Individual' : 'Corporate',
    customerStatus: formatCustomerStatus(profile.customer_status || 'active'),
    jurisdiction: profile.country_of_residence || 'Unknown',
    accountAge: calculateAccountAge(profile.created_at),
    createdAt: formatCreatedDate(profile.created_at),
    transactionCount: profile.total_transactions || 0,
    transactionVolume: formatCurrency(profile.total_volume || 0),
    flaggedTransactions: profile.flagged_transactions || 0,
    kycStatus: formatKYCStatus(profile.kyc_status || ''),
    lastActivity: formatLastActivity(profile.updated_at),
    pep: profile.is_pep || false,
    sanctioned: profile.has_sanctions || false,
    adverseMedia: profile.has_adverse_media || false,
    watchlistMatches: Array.isArray(profile.watchlist_matches)
      ? profile.watchlist_matches.length
      : (typeof profile.watchlist_matches === 'number' ? profile.watchlist_matches : 0),
    isSynthetic: profile.is_synthetic || false,
    syntheticScore: profile.synthetic_score || 0,
  });

  const fetchProfiles = useCallback(
    async (newFilters: RiskDashboardFilters) => {
      setLoading(true);
      try {
        const response = await getRiskDashboardProfiles(newFilters);
        if (response.success && response.data) {
          const mappedCustomers = response.data.profiles.map(mapProfileToCustomer);
          setCustomers(mappedCustomers);
        }
      } catch (error) {
        console.error('Error fetching profiles:', error);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  const handleFilterChange = useCallback(
    (newFilters: RiskDashboardFilters) => {
      setFilters(newFilters);
      fetchProfiles(newFilters);
    },
    [fetchProfiles]
  );

  const handleExport = async (format: 'csv' | 'json' | 'pdf') => {
    setExporting(true);
    setShowExportModal(false);
    try {
      const exportFilters: ExportProfilesFilters = {
        format,
        risk_category: filters.risk_category,
        entity_type: filters.entity_type,
        status: filters.status,
        date_preset: filters.date_preset,
      };

      const response = await exportRiskProfiles(exportFilters);

      if (response.success && response.data) {
        // Convert base64 to Blob on client side
        const byteCharacters = atob(response.data.base64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: response.data.mimeType });

        // Create download link
        const url = globalThis.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `risk-profiles-${new Date().toISOString().split('T')[0]}.${format}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting profiles:', error);
    } finally {
      setExporting(false);
    }
  };

  return (
    <>
      {/* Header */}
      <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
            Customer Risk
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5 dark:text-gray-400">
            Real-time monitoring of customer risk profiles
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowExportModal(true)}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {exporting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <ICONS.Download size={16} />
                <span>Export</span>
              </>
            )}
          </button>
        </div>
      </div>

      <CustomerRiskControls
        onFilterChange={handleFilterChange}
        loading={loading}
      />
      <CustomerRiskList
        customers={customers}
        onViewProfile={handleViewProfile}
        loading={loading}
      />

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-panel-border shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">Export Profiles</h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ICONS.X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select the format to export customer risk profiles:
            </p>
            <div className="space-y-2">
              {[
                { format: 'csv' as const, label: 'CSV', icon: ICONS.FileText },
                { format: 'json' as const, label: 'JSON', icon: ICONS.FileText },
                { format: 'pdf' as const, label: 'PDF', icon: ICONS.FileText },
              ].map(({ format, label, icon: Icon }) => (
                <button
                  key={format}
                  onClick={async () => {
                    await handleExport(format);
                  }}
                  disabled={exporting}
                  className="w-full px-4 py-3 bg-card border border-panel-border rounded-lg hover:bg-card/70 transition-all text-left flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Icon size={20} className="text-muted-foreground" />
                  <span className="text-foreground font-medium">Export as {label}</span>
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
    </>
  );
}
