'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { RefreshCw } from 'lucide-react';
import { ICONS } from '@/constants/constants';
import { exportSingleProfile } from '@/actions/customer-risk.actions';
import {
  CustomerProfileDetailResponse,
  RiskDashboardProfileAPI,
  CustomerRiskProfile,
  IndividualCustomer,
  CorporateCustomer,
  RiskCategory,
  GeolocationHistoryAPI,
  KYCOverviewAPI,
  KYCChecklistItem,
} from '@/types/customer-risk.types';

import RiskScoreGauge from '@/app/(dashboard)/customer-risk/components/RiskScoreGauge';
import KYCOverviewSection from '@/app/(dashboard)/customer-risk/components/KYCOverviewSection';
import WatchlistSection from '@/app/(dashboard)/customer-risk/components/WatchlistSection';
import GeolocationSectionWithAPI from '@/app/(dashboard)/customer-risk/components/GeolocationSectionWithAPI';
import LocationRequestSection from '@/app/(dashboard)/customer-risk/components/LocationRequestSection';
import AlertHistorySectionWithAPI from '@/app/(dashboard)/customer-risk/components/AlertHistorySectionWithAPI';
import EDDSection from '@/components/customer-risk/edd/EDDSection';
import RiskFactorsTable from '@/components/customer-risk/RiskFactorsTable';
import CaseHistorySection from '@/components/customer-risk/CaseHistorySection';
import RiskHistoryChart from '@/components/customer-risk/RiskHistoryChart';
import CopyableText from '@/components/common/copyable-text/CopyableText';
import { useCustomerProfile } from '@/hooks/useCustomerRisk';
import { usePermissions } from '@/hooks/usepermissions';
import {
  getRiskBadgeClasses,
  getScoreBadgeClasses,
} from '@/utils/kyc/badgeClasses';
import { formatPhoneNumber } from '@/utils/format';

interface CustomerProfileDetailProps {
  profileId: string;
  initialData: CustomerProfileDetailResponse;
}

// Transform KYC checklist from API format to component format
const transformKYCChecklist = (
  apiChecklist: KYCOverviewAPI['kyc_checklist'] | undefined,
): KYCChecklistItem[] => {
  if (!apiChecklist || !Array.isArray(apiChecklist)) {
    return [];
  }
  return apiChecklist.map((item) => ({
    id: item.id,
    name: item.name,
    completed: item.completed,
    completedAt: item.completed_at,
  }));
};

// Transform API data to component-expected format
const transformToCustomerProfile = (
  apiProfile: RiskDashboardProfileAPI,
  kycOverview?: KYCOverviewAPI,
): CustomerRiskProfile => {
  const baseProfile = {
    id: apiProfile.id,
    tenantId: apiProfile.tenant_id,
    customerId: apiProfile.customer_id,
    accountNumber: apiProfile.account_number || '',
    entityType: apiProfile.entity_type as any,
    customerStatus: apiProfile.customer_status as any,
    customerTier: apiProfile.customer_tier,
    dateOfEstablishment: apiProfile.date_of_establishment,
    lastRecordedActivity: apiProfile.updated_at,
    createdAt: apiProfile.created_at,
    updatedAt: apiProfile.updated_at,
    primaryPhoneNumber: apiProfile.primary_phone_number || '',
    emailAddress: apiProfile.email_address || '',
    residentialAddress: apiProfile.residential_address || '',
    countryOfResidence: apiProfile.country_of_residence || '',
    riskScore: apiProfile.risk_score,
    riskCategory: apiProfile.risk_category as RiskCategory,
    previousRiskScore: apiProfile.previous_risk_score,
    previousRiskCategory: apiProfile.previous_risk_category as RiskCategory,
    riskLastCalculated: apiProfile.updated_at,
    totalTransactions: apiProfile.total_transactions,
    totalVolume: apiProfile.total_volume,
    flaggedTransactions: apiProfile.flagged_transactions,
    watchlistMatches: apiProfile.watchlist_matches || null,
    screeningStatus: apiProfile.screening_status as any,
    isPep: apiProfile.is_pep,
    hasAdverseMedia: apiProfile.has_adverse_media,
    hasSanctions: apiProfile.has_sanctions,
    requiresEdd: apiProfile.requires_edd,
    eddNotes: apiProfile.edd_notes || '',
    eddDocuments: [],
    kycStatus: kycOverview?.kyc_status || (apiProfile.kyc_status as any),
    kycCompletionStage: kycOverview?.kyc_completion_stage ?? 0,
    kycChecklist: transformKYCChecklist(kycOverview?.kyc_checklist),
    identificationType:
      kycOverview?.identification_type || apiProfile.identification_type || '',
    identificationNumber:
      kycOverview?.identification_number ||
      apiProfile.identification_number ||
      '',
    idIssuingCountry:
      kycOverview?.id_issuing_country || apiProfile.id_issuing_country || '',
    idIssueDate: kycOverview?.id_issue_date || null,
    idExpiryDate: kycOverview?.id_expiry_date || null,
    location: apiProfile.location || '',
    locationCompliance: apiProfile.location_compliance as any,
    isSyntheticProfile: apiProfile.is_synthetic,
    syntheticScore: apiProfile.synthetic_score || 0,
    syntheticStatus: apiProfile.synthetic_status || 'not_checked',
    syntheticAnomalies: Array.isArray(apiProfile.synthetic_flags)
      ? apiProfile.synthetic_flags
      : apiProfile.synthetic_flags
        ? [apiProfile.synthetic_flags]
        : [],
  };

  // Return as Individual customer (you can enhance this to detect corporate)
  const fullName = apiProfile.full_name || '';
  return {
    ...baseProfile,
    fullName,
    firstName: fullName.split(' ')[0] || '',
    lastName: fullName.split(' ').slice(1).join(' ') || '',
    dateOfBirth: apiProfile.date_of_birth || '',
    age: 0,
    gender: '',
    occupation: '',
    employerName: '',
    employmentType: 'Salaried' as any,
    monthlyIncomeRange: '',
    sourceOfFunds: '',
    sourceOfWealth: '',
  } as IndividualCustomer;
};

export default function CustomerProfileDetail({
  profileId,
  initialData,
}: CustomerProfileDetailProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const fromCaseId = searchParams.get('fromCase');
  const fromKycAlerts = searchParams.get('fromKycAlerts');
  const [exporting, setExporting] = useState(false);

  // Use React Query for real-time updates with polling
  const {
    data: profileData,
    isRefetching,
    dataUpdatedAt,
    refresh,
  } = useCustomerProfile({
    profileId,
    initialData,
    pollingInterval: 30000, // 30 seconds
  });

  // Destructure the data (use initial data as fallback)
  const {
    profile,
    case_summary,
    alert_summary,
    risk_factors,
    risk_history,
    geolocation_summary,
    kyc_overview,
  } = profileData || initialData;

  const [showExportModal, setShowExportModal] = useState(false);

  // Transform API profile to component format
  const customer = transformToCustomerProfile(profile, kyc_overview);
  const permissions = usePermissions();
  const handleExport = async (type: 'pdf' | 'csv' | 'json') => {
    if (!profile) return;

    setExporting(true);
    setShowExportModal(false);
    try {
      const response = await exportSingleProfile(profile.id, type);

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
        link.download = `customer-${profile.customer_id}-report.${type}`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        globalThis.URL.revokeObjectURL(url);
      } else {
        alert(`Failed to export profile: ${response.message}`);
      }
    } catch (error) {
      console.error('Error exporting profile:', error);
      alert('An error occurred while exporting the profile');
    } finally {
      setExporting(false);
    }
  };

  const toTitleCase = (str: string | null | undefined): string => {
    if (!str) return 'N/A';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // const getRiskBadgeClasses = (risk: string) => {
  //   const normalized = risk.toLowerCase();
  //   const styles = {
  //     low: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800",
  //     medium:
  //       "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900/30 dark:text-yellow-300 dark:border-yellow-800",
  //     high: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
  //     critical:
  //       "bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800",
  //   };
  //   return `px-3 py-1.5 rounded-full text-sm font-semibold border ${
  //     styles[normalized as keyof typeof styles] || styles.low
  //   }`;
  // };

  const formatDate = (dateString: string | null) => {
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

  const formatDateTime = (dateString: string | null) => {
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCustomerName = () => {
    if (customer.entityType === 'Corporate') {
      return toTitleCase((customer as CorporateCustomer).businessName);
    }
    return toTitleCase((customer as IndividualCustomer).fullName);
  };

  const isIndividual = customer.entityType !== 'Corporate';
  const individualCustomer = customer as IndividualCustomer;
  const corporateCustomer = customer as CorporateCustomer;

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
        <div className="flex flex-col ">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-foreground dark:text-gray-100">
              Customer 360&deg; Profile
            </h1>
            {dataUpdatedAt > 0 && (
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                {isRefetching && (
                  <RefreshCw size={10} className="animate-spin" />
                )}
                <span className="hidden sm:inline">
                  Updated {new Date(dataUpdatedAt).toLocaleTimeString()}
                </span>
              </span>
            )}
          </div>

          <div className="flex items-start gap-3 mt-8">
            <button
              onClick={() => {
                if (fromCaseId) {
                  router.push(`/cases/${fromCaseId}`);
                } else if (fromKycAlerts) {
                  router.push('/kyc/alerts');
                } else {
                  router.push('/customer-risk');
                }
              }}
              className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors mt-1 cursor-pointer"
            >
              <ICONS.ChevronLeft size={20} />
            </button>
            <div>
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-2xl font-bold text-foreground">
                  {getCustomerName()}
                </h1>
                <span className={getRiskBadgeClasses(customer.riskCategory)}>
                  {toTitleCase(customer.riskCategory)}
                </span>
                <span className={getScoreBadgeClasses()}>
                  Score: {customer.riskScore}
                </span>
                {customer.isPep && (
                  <span className="px-3 py-1.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border border-purple-300 rounded-full text-sm font-semibold">
                    PEP
                  </span>
                )}
                {customer.hasSanctions && (
                  <span className="px-3 py-1.5 bg-red-200 text-red-800 dark:bg-red-900 dark:text-red-200 border rounded-full text-sm font-semibold">
                    SANCTIONED
                  </span>
                )}
              </div>
              <div className="text-muted-foreground flex items-center gap-1 flex-wrap">
                {customer.customerId && (
                  <>
                    <CopyableText
                      text={customer.customerId}
                      textClassName="text-muted-foreground"
                    />
                    <span>|</span>
                  </>
                )}
                {customer.accountNumber && (
                  <>
                    <CopyableText
                      text={customer.accountNumber}
                      textClassName="text-muted-foreground"
                    />
                    <span>|</span>
                  </>
                )}
                <span>{toTitleCase(customer.entityType)}</span>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 ml-11 lg:ml-0">
          {/* Manual refresh button */}
          <button
            onClick={refresh}
            disabled={isRefetching}
            className="p-2 rounded-lg border border-panel-border bg-card hover:bg-card/70 transition-colors disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              size={16}
              className={`text-muted-foreground ${isRefetching ? 'animate-spin' : ''}`}
            />
          </button>
          {permissions.canExportCRPC && (
            <button
              onClick={() => setShowExportModal(true)}
              disabled={exporting}
              className="flex items-center cursor-pointer gap-2 px-4 py-2 bg-[#1A5276] dark:bg-blue-600 text-white rounded-lg hover:bg-[#001F3F] dark:hover:bg-blue-500 transition-colors text-sm font-medium shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
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
          )}
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Risk Score Section */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Target size={20} />
              Risk Assessment
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <RiskScoreGauge
                score={customer.riskScore}
                category={customer.riskCategory}
                previousScore={customer.previousRiskScore}
              />
              <div className="space-y-3">
                <div className="flex justify-between items-center py-2 border-b border-panel-border">
                  <span className="text-muted-foreground">Previous Score</span>
                  <span className="font-medium">
                    {customer.previousRiskScore}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-panel-border">
                  <span className="text-muted-foreground">
                    Previous Category
                  </span>
                  <span className="font-medium">
                    {toTitleCase(customer.previousRiskCategory)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-panel-border">
                  <span className="text-muted-foreground">Last Calculated</span>
                  <span className="font-medium">
                    {formatDateTime(customer.riskLastCalculated)}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-muted-foreground">Requires EDD</span>
                  <span
                    className={`font-medium ${
                      customer.requiresEdd ? 'text-red-600' : 'text-green-600'
                    }`}
                  >
                    {customer.requiresEdd ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
            </div>
            {customer.isSyntheticProfile && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-red-700 dark:text-red-300">
                    <ICONS.AlertTriangle size={18} />
                    <span className="font-semibold">
                      Synthetic Profile Detected
                    </span>
                  </div>
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      customer.syntheticStatus === 'confirmed'
                        ? 'bg-red-200 text-red-800 dark:bg-red-800 dark:text-red-200'
                        : customer.syntheticStatus === 'flagged'
                          ? 'bg-orange-200 text-orange-800 dark:bg-orange-800 dark:text-orange-200'
                          : customer.syntheticStatus === 'cleared'
                            ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200'
                            : 'bg-gray-200 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                    }`}
                  >
                    {toTitleCase(customer.syntheticStatus?.replace('_', ' ')) ||
                      'Flagged'}
                  </span>
                </div>

                {/* Synthetic Score Display */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-3">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                    <p className="text-xs text-muted-foreground mb-1">
                      Synthetic Risk Score
                    </p>
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-2xl font-bold ${
                          (customer.syntheticScore ?? 0) >= 80
                            ? 'text-red-600'
                            : (customer.syntheticScore ?? 0) >= 60
                              ? 'text-orange-600'
                              : (customer.syntheticScore ?? 0) >= 40
                                ? 'text-yellow-600'
                                : 'text-green-600'
                        }`}
                      >
                        {customer.syntheticScore ?? 0}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        / 100
                      </span>
                    </div>
                    <div className="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          (customer.syntheticScore ?? 0) >= 80
                            ? 'bg-red-500'
                            : (customer.syntheticScore ?? 0) >= 60
                              ? 'bg-orange-500'
                              : (customer.syntheticScore ?? 0) >= 40
                                ? 'bg-yellow-500'
                                : 'bg-green-500'
                        }`}
                        style={{ width: `${customer.syntheticScore ?? 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                    <p className="text-xs text-muted-foreground mb-1">
                      Review Status
                    </p>
                    <p className="font-semibold text-foreground">
                      {toTitleCase(
                        customer.syntheticStatus?.replace('_', ' '),
                      ) || 'Pending Review'}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {customer.syntheticStatus === 'confirmed'
                        ? 'This profile has been confirmed as synthetic'
                        : customer.syntheticStatus === 'cleared'
                          ? 'This profile has been cleared after review'
                          : 'Requires manual review by compliance team'}
                    </p>
                  </div>
                </div>

                {/* Detected Anomalies */}
                {customer.syntheticAnomalies &&
                  customer.syntheticAnomalies.length > 0 && (
                    <div className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-red-200 dark:border-red-700">
                      <p className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
                        Detected Anomalies
                      </p>
                      <ul className="space-y-1">
                        {customer.syntheticAnomalies.map((anomaly, idx) => (
                          <li
                            key={idx}
                            className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400"
                          >
                            <ICONS.AlertCircle
                              size={14}
                              className="mt-0.5 flex-shrink-0"
                            />
                            <span>{anomaly}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Basic Customer Data */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              {isIndividual ? (
                <ICONS.User size={20} />
              ) : (
                <ICONS.Building size={20} />
              )}
              {isIndividual ? 'Personal Information' : 'Business Information'}
            </h2>

            {isIndividual ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Full Name:
                  </p>
                  <p className="font-medium">
                    {toTitleCase(individualCustomer.fullName)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Date of Birth:
                  </p>
                  <p className="font-medium">
                    {formatDate(individualCustomer.dateOfBirth || 'N/A')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Customer Tier:
                  </p>
                  <p className="font-medium">
                    {toTitleCase(customer.customerTier)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Account Status:
                  </p>
                  <p
                    className={`font-medium ${
                      customer.customerStatus?.toLowerCase() === 'active'
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {toTitleCase(customer.customerStatus)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Account Opened:
                  </p>
                  <p className="font-medium">
                    {formatDate(customer.dateOfEstablishment || 'N/A')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Business Name:
                  </p>
                  <p className="font-medium">
                    {toTitleCase(corporateCustomer.businessName)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Registration Number:
                  </p>
                  <p className="font-medium">
                    {toTitleCase(corporateCustomer.registrationNumber)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Country of Incorporation:
                  </p>
                  <p className="font-medium">
                    {toTitleCase(corporateCustomer.countryOfIncorporation)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Date of Incorporation:
                  </p>
                  <p className="font-medium">
                    {formatDate(corporateCustomer.dateOfIncorporation || 'N/A')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Legal Form:
                  </p>
                  <p className="font-medium">
                    {toTitleCase(corporateCustomer.legalForm)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Nature of Business:
                  </p>
                  <p className="font-medium">
                    {toTitleCase(corporateCustomer.natureOfBusiness)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tax ID / VAT Number:
                  </p>
                  <p className="font-medium">
                    {toTitleCase(corporateCustomer.taxIdVatNumber)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Annual Turnover:
                  </p>
                  <p className="font-medium">
                    {toTitleCase(corporateCustomer.annualTurnover)}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Contact Information */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Mail size={20} />
              Contact Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Email Address:
                </p>
                <p className="font-medium">{customer.emailAddress || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Phone Number:
                </p>
                <p className="font-medium">
                  {formatPhoneNumber(customer.primaryPhoneNumber)}
                </p>
              </div>
              <div className="md:col-span-2">
                <p className="text-sm text-muted-foreground mb-1">
                  Residential Address:
                </p>
                <p className="font-medium">
                  {toTitleCase(customer.residentialAddress)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Country of Residence:
                </p>
                <p className="font-medium">{customer.countryOfResidence}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">
                  Location Compliance:
                </p>
                <p
                  className={`font-medium ${
                    customer.locationCompliance === 'Compliant'
                      ? 'text-green-600'
                      : customer.locationCompliance === 'Non-Compliant'
                        ? 'text-red-600'
                        : 'text-yellow-600'
                  }`}
                >
                  {toTitleCase(customer.locationCompliance)}
                </p>
              </div>
            </div>
          </div>

          {/* Corporate Structure for Corporate customers */}
          {!isIndividual && corporateCustomer.directors && (
            <>
              {/* Directors */}
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ICONS.Users size={20} />
                  Directors
                </h2>
                <div className="space-y-3">
                  {corporateCustomer.directors?.map((director, idx) => (
                    <div
                      key={idx}
                      className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">
                            {toTitleCase(director.name)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {toTitleCase(director.position)}
                          </p>
                        </div>
                        <div className="text-right text-sm">
                          <p className="text-muted-foreground">
                            {toTitleCase(director.nationality)}
                          </p>
                          <p className="text-muted-foreground">
                            Since{' '}
                            {formatDate(director.appointmentDate || 'N/A')}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Beneficial Owners */}
              {corporateCustomer.beneficialOwners &&
                corporateCustomer.beneficialOwners.length > 0 && (
                  <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <ICONS.UserCheck size={20} />
                      Beneficial Owners (UBO)
                    </h2>
                    <div className="space-y-3">
                      {corporateCustomer.beneficialOwners.map((owner, idx) => (
                        <div
                          key={idx}
                          className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg flex justify-between items-center"
                        >
                          <div>
                            <p className="font-medium">
                              {toTitleCase(owner.name)}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {toTitleCase(owner.nationality)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">
                              {owner.ownershipPercentage || 0}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Ownership
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </>
          )}

          {/* Risk Factors */}
          <RiskFactorsTable riskFactors={risk_factors} profileId={profile.id} />

          {/* Risk History Chart */}
          <RiskHistoryChart riskHistory={risk_history} />

          {/* Transaction Data */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Activity size={20} />
              Transaction Data
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
                <p className="text-3xl font-bold text-blue-600">
                  {customer.totalTransactions}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Transactions
                </p>
              </div>
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg text-center">
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(customer.totalVolume)}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Volume
                </p>
              </div>
              <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-center">
                <p className="text-3xl font-bold text-red-600">
                  {customer.flaggedTransactions}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Flagged Transactions
                </p>
              </div>
            </div>
            {!isIndividual && (
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center p-3 border border-panel-border rounded-lg">
                  <p className="text-xl font-bold">
                    {corporateCustomer.sarsFiledCount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">SARs Filed</p>
                </div>
                <div className="text-center p-3 border border-panel-border rounded-lg">
                  <p className="text-xl font-bold">
                    {corporateCustomer.ctrsFiledCount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">CTRs Filed</p>
                </div>
                <div className="text-center p-3 border border-panel-border rounded-lg">
                  <p className="text-xl font-bold">
                    {corporateCustomer.mtlsFiledCount || 0}
                  </p>
                  <p className="text-xs text-muted-foreground">MTLs Filed</p>
                </div>
              </div>
            )}
          </div>

          {/* KYC Overview */}
          <KYCOverviewSection customer={customer} />

          {/* EDD Section */}
          <EDDSection
            profileId={profile.id}
            customerId={profile.customer_id}
            requiresEdd={profile.requires_edd}
            canUpdateCRPC={permissions.canUpdateCRPC}
          />

          {/* Geolocation Section */}
          <GeolocationSectionWithAPI profileId={profile.id} />

          {/* Login Activity Section */}
          {geolocation_summary?.recent_locations &&
            geolocation_summary.recent_locations.filter(
              (loc: GeolocationHistoryAPI) => loc.event_type === 'login',
            ).length > 0 && (
              <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
                <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <ICONS.Activity size={20} />
                  Login Activity
                </h2>
                <div className="space-y-4">
                  {geolocation_summary.recent_locations
                    .filter(
                      (loc: GeolocationHistoryAPI) =>
                        loc.event_type === 'login',
                    )
                    .slice(0, 3)
                    .map((login: GeolocationHistoryAPI) => (
                      <div
                        key={login.id}
                        className="border border-panel-border rounded-lg p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {formatDateTime(login.created_at)}
                          </span>
                          <div className="flex items-center gap-2">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                login.risk_level === 'critical'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'
                                  : login.risk_level === 'high'
                                    ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300'
                                    : login.risk_level === 'medium'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                                      : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                              }`}
                            >
                              {toTitleCase(login.risk_level)} Risk
                            </span>
                            {login.is_compliant ? (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                Compliant
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                                Non-Compliant
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              IP Address
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {login.ip_address || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Country
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {login.country || login.country_iso || 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Risk Score
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {login.risk_score}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Device ID
                            </p>
                            <p className="text-sm font-medium text-foreground truncate">
                              {login.device_id
                                ? login.device_id.substring(0, 8) + '...'
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Location
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {login.latitude !== 0 || login.longitude !== 0
                                ? `${login.latitude.toFixed(2)}, ${login.longitude.toFixed(2)}`
                                : 'N/A'}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">
                              Blocked
                            </p>
                            <p className="text-sm font-medium text-foreground">
                              {login.is_blocked ? 'Yes' : 'No'}
                            </p>
                          </div>
                        </div>
                        {/* Security Flags */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-panel-border">
                          {login.is_vpn && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              VPN
                            </span>
                          )}
                          {login.is_proxy && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300">
                              Proxy
                            </span>
                          )}
                          {login.is_tor && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300">
                              TOR
                            </span>
                          )}
                          {login.is_hosting && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">
                              Hosting
                            </span>
                          )}
                          {login.is_location_change && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                              Location Change
                            </span>
                          )}
                          {login.is_country_change && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                              Country Change
                            </span>
                          )}
                          {login.is_device_change && (
                            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-300">
                              Device Change
                            </span>
                          )}
                          {!login.is_vpn &&
                            !login.is_proxy &&
                            !login.is_tor &&
                            !login.is_hosting &&
                            !login.is_location_change &&
                            !login.is_country_change &&
                            !login.is_device_change && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
                                No Flags
                              </span>
                            )}
                        </div>
                      </div>
                    ))}
                </div>
                {geolocation_summary.recent_locations.filter(
                  (loc: GeolocationHistoryAPI) => loc.event_type === 'login',
                ).length > 3 && (
                  <button
                    onClick={() =>
                      router.push(`/customer-risk/${profile.id}/login-activity`)
                    }
                    className="w-full mt-4 text-center text-sm text-blue-600 hover:underline cursor-pointer"
                  >
                    View All (
                    {
                      geolocation_summary.recent_locations.filter(
                        (loc: GeolocationHistoryAPI) =>
                          loc.event_type === 'login',
                      ).length
                    }{' '}
                    login events)
                  </button>
                )}
              </div>
            )}

          {/* Case History */}
          <CaseHistorySection profileId={profile.id} />

          {/* Alert History */}
          <AlertHistorySectionWithAPI profileId={profile.id} />
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.BarChart3 size={20} />
              Quick Stats
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Last Activity</span>
                <span className="font-medium text-sm">
                  {formatDateTime(customer.lastRecordedActivity)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Account Age</span>
                <span className="font-medium">
                  {(() => {
                    const now = new Date().getTime();
                    const established = new Date(
                      customer.dateOfEstablishment,
                    ).getTime();
                    const totalMonths = Math.floor(
                      (now - established) / (1000 * 60 * 60 * 24 * 30),
                    );
                    const years = Math.floor(totalMonths / 12);
                    const months = totalMonths % 12;
                    if (years === 0) {
                      return `${months} month${months !== 1 ? 's' : ''}`;
                    }
                    if (months === 0) {
                      return `${years} year${years !== 1 ? 's' : ''}`;
                    }
                    return `${years} year${years !== 1 ? 's' : ''}, ${months} month${months !== 1 ? 's' : ''}`;
                  })()}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Active Alerts</span>
                <span className="font-medium text-red-600">
                  {alert_summary.pending_alerts +
                    alert_summary.in_progress_alerts}
                </span>
              </div>
            </div>
          </div>

          {/* Location Request Section */}
          <LocationRequestSection
            customerId={profile.customer_id}
            customerEmail={profile.email_address}
            customerPhone={profile.primary_phone_number}
          />

          {/* Watchlist Screening */}
          <WatchlistSection customer={customer} />

          {/* Case Summary */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.FileText size={20} />
              Case Summary
            </h2>

            {/* By Status */}
            <div className="space-y-3 mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase">
                By Status
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Total Cases
                </span>
                {/* <span className="font-medium">{case_summary.total_cases}</span> */}
                <span className="px-2 py-0.5 bg-gray-100 text-black dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-xs font-semibold">
                  {case_summary.total_cases}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Pending Review
                </span>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-semibold">
                  {case_summary.pending_review_cases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  In Progress
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-semibold">
                  {case_summary.in_progress_cases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Escalated</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-semibold">
                  {case_summary.escalated_cases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Closed</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-semibold">
                  {case_summary.closed_cases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">SAR Filed</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-semibold">
                  {case_summary.sar_filed_cases}
                </span>
              </div>
            </div>

            {/* By Category */}
            <div className="space-y-3 mb-4  border-t border-panel-border pt-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                By Category
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Fraud Cases
                </span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-semibold">
                  {case_summary.fraud_cases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">KYC Cases</span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-semibold">
                  {case_summary.kyc_cases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Geo Cases</span>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-semibold">
                  {case_summary.geo_cases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">AML Cases</span>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-xs font-semibold">
                  {case_summary.aml_cases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">SAR Cases</span>
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-semibold">
                  {case_summary.sar_cases}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">CTR Cases</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-semibold">
                  {case_summary.ctr_cases}
                </span>
              </div>
            </div>
          </div>

          {/* Alert Summary */}
          <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
            <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <ICONS.Bell size={20} />
              Alert Summary
            </h2>

            {/* By Type */}
            <div className="space-y-3 mb-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                By Type
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Fraud Alerts
                </span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-semibold">
                  {alert_summary.fraud_alerts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  AML Alerts
                </span>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-xs font-semibold">
                  {alert_summary.aml_alerts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Geo Alerts
                </span>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-semibold">
                  {alert_summary.geo_alerts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  KYC Alerts
                </span>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 rounded-full text-xs font-semibold">
                  {alert_summary.kyc_alerts}
                </span>
              </div>
            </div>

            {/* By Severity */}
            <div className="space-y-3 mb-4  border-t border-panel-border pt-4">
              <h3 className="text-xs font-bold text-muted-foreground uppercase mb-3">
                By Severity
              </h3>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Critical</span>
                <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-semibold">
                  {alert_summary.critical_alerts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">High</span>
                <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded-full text-xs font-semibold">
                  {alert_summary.high_alerts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Medium</span>
                <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-semibold">
                  {alert_summary.medium_alerts}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Low</span>
                <span className="px-2 py-0.5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-semibold">
                  {alert_summary.low_alerts}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Export Modal */}
      {permissions.canExportCRPC && showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-xl border border-panel-border shadow-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-foreground">
                Export Customer Profile
              </h3>
              <button
                onClick={() => setShowExportModal(false)}
                className="text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ICONS.X size={20} />
              </button>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Select the format to export customer profile:
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
}
