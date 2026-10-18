'use client';

import { ICONS } from '@/constants/constants';
import { CustomerRiskProfile } from '@/types/customer-risk.types';

interface KYCOverviewSectionProps {
  customer: CustomerRiskProfile;
}

const KYCOverviewSection = ({ customer }: KYCOverviewSectionProps) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return null;
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const isIdExpiringSoon = () => {
    if (!customer.idExpiryDate) return false;
    const expiryDate = new Date(customer.idExpiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil(
      (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    return daysUntilExpiry <= 90 && daysUntilExpiry > 0;
  };

  const isIdExpired = () => {
    if (!customer.idExpiryDate) return false;
    return new Date(customer.idExpiryDate) < new Date();
  };

  // Check if any ID data exists (to determine whether to show the section or pending message)
  const hasAnyIdData = Boolean(
    customer.identificationType ||
    customer.identificationNumber ||
    customer.idIssuingCountry
  );

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ICONS.FileCheck size={20} />
          KYC Overview
        </h2>
        <span
          className={`px-3 py-1 rounded-full text-sm font-semibold ${
            customer.kycStatus === 'Complete'
              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
              : customer.kycStatus === 'Incomplete'
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                : customer.kycStatus === 'Under Review'
                  ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                  : customer.kycStatus === 'Expired'
                    ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                    : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
          }`}
        >
          {customer.kycStatus || 'Pending'}
        </span>
      </div>

      {/* KYC Completion Progress */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm text-muted-foreground">
            Completion Progress
          </span>
          <span className="text-sm font-semibold">
            {customer.kycCompletionStage}%
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${
              customer.kycCompletionStage === 100
                ? 'bg-green-500'
                : customer.kycCompletionStage >= 75
                  ? 'bg-blue-500'
                  : customer.kycCompletionStage >= 50
                    ? 'bg-yellow-500'
                    : 'bg-orange-500'
            }`}
            style={{ width: `${customer.kycCompletionStage}%` }}
          />
        </div>
      </div>

      {/* KYC Checklist */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold text-foreground mb-3">
          Verification Checklist
        </h3>
        <div className="space-y-2">
          {customer.kycChecklist.map((item) => (
            <div
              key={item.id}
              className={`flex items-center justify-between p-2 rounded-lg ${
                item.completed
                  ? 'bg-green-50 dark:bg-green-900/10'
                  : 'bg-orange-50 dark:bg-orange-900/10 border border-orange-200 dark:border-orange-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {item.completed ? (
                  <ICONS.CheckCircle className="text-green-500" size={18} />
                ) : (
                  <ICONS.AlertCircle className="text-orange-500" size={18} />
                )}
                <span
                  className={`text-sm ${
                    item.completed
                      ? 'text-green-700 dark:text-green-300'
                      : 'text-orange-700 dark:text-orange-300 font-medium'
                  }`}
                >
                  {item.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.completedAt && (
                  <span className="text-xs text-muted-foreground">
                    {formatDate(item.completedAt)}
                  </span>
                )}
                {!item.completed && (
                  <span className="text-xs px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 rounded font-medium">
                    Incomplete
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ID Information */}
      <div className="border-t border-panel-border pt-4">
        <h3 className="text-sm font-semibold text-foreground mb-4">
          ID Document Information
        </h3>

        {/* Show pending message if no ID data exists */}
        {!hasAnyIdData ? (
          <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-lg border border-blue-200 dark:border-blue-800">
            <ICONS.Clock className="text-blue-500" size={20} />
            <div>
              <p className="font-medium text-sm text-blue-700 dark:text-blue-300">
                ID Verification Pending
              </p>
              <p className="text-xs text-blue-600 dark:text-blue-400">
                Customer has not yet submitted ID documents for verification.
              </p>
            </div>
          </div>
        ) : (
          /* Show ID data when available */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Identification Type:
              </p>
              <p className="font-medium">{customer.identificationType}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">
                Identification Number:
              </p>
              <p className="font-medium">{customer.identificationNumber}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground mb-1">Issuing Country:</p>
              <p className="font-medium">{customer.idIssuingCountry}</p>
            </div>
            {customer.idIssueDate && (
              <div>
                <p className="text-sm text-muted-foreground mb-1">Issue Date:</p>
                <p className="font-medium">{formatDate(customer.idIssueDate)}</p>
              </div>
            )}
            {customer.idExpiryDate && (
              <div className={customer.idIssueDate ? '' : 'md:col-span-2'}>
                <p className="text-sm text-muted-foreground mb-1">Expiry Date:</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      isIdExpired()
                        ? 'text-red-600'
                        : isIdExpiringSoon()
                          ? 'text-orange-600'
                          : ''
                    }`}
                  >
                    {formatDate(customer.idExpiryDate)}
                  </span>
                  {isIdExpired() && (
                    <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 text-xs rounded font-medium">
                      EXPIRED
                    </span>
                  )}
                  {isIdExpiringSoon() && !isIdExpired() && (
                    <span className="px-2 py-0.5 bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300 text-xs rounded font-medium">
                      EXPIRING SOON
                    </span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default KYCOverviewSection;
