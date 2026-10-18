'use client';

import { ICONS } from '@/constants/constants';
import { Customer } from '@/types/customer-risk.types';
import CopyableText from '@/components/common/copyable-text/CopyableText';
import LoadingOverlay from '@/components/layout/LoadingOverlay';
import { Button } from '@/components/ui/button';
import {
  getRiskBadgeClasses,
  getScoreBadgeClasses,
  getStatusBadgeClasses,
} from '@/utils/kyc/badgeClasses';
import { getStatusWithIcon } from '@/utils/statusHelpers';

interface CustomerRiskListProps {
  customers: Customer[];
  onViewProfile: (customerId: string) => void;
  loading?: boolean;
}

export default function CustomerRiskList({
  customers,
  onViewProfile,
  loading = false,
}: CustomerRiskListProps) {

  if (loading) {
    return (
      <div className="relative bg-card rounded-xl border border-panel-border shadow-sm p-8 mb-4 min-h-[120px]">
        <LoadingOverlay loadingText="Loading profiles..." />
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="bg-card rounded-xl border border-panel-border shadow-sm p-8">
        <p className="text-center text-muted-foreground">
          No customers found matching your filters.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
      <div className="lg:col-span-12 space-y-3">
        {customers.map((customer) => {
          const customerStatus = customer.customerStatus || 'unknown';
          const customerKycStatus = customer.kycStatus || 'unknown';
          const riskLevelKey = (customer.riskLevel || 'Low').toLowerCase();
          return (
            <div
              key={customer.id}
              className="bg-card rounded-xl border border-panel-border shadow-sm p-5 hover:shadow-md transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                    <span className="text-foreground font-semibold text-lg capitalize">
                      {customer.customerName}
                    </span>
                  <span
                    className={
                      customer.riskScore === 0
                        ? 'px-2.5 py-1 rounded-full text-xs font-semibold border bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800'
                        : getRiskBadgeClasses(riskLevelKey)
                    }
                  >
                    {customer.riskScore === 0
                      ? 'Undetermined'
                      : customer.riskLevel.toUpperCase()}
                  </span>
                  <span className={getScoreBadgeClasses()}>
                    Score:{' '}
                    {customer.riskScore === 0
                      ? 'Undetermined'
                      : customer.riskScore}
                  </span>
                  <span className={getStatusBadgeClasses(customerStatus.toLowerCase())}>
                    {getStatusWithIcon(customerStatus)}
                  </span>
                  {customer.pep && (
                    <span className="px-2.5 py-1 uppercase bg-chart-1 text-red-700 dark:text-red-300 border rounded-full text-xs font-semibold">
                      PEP
                    </span>
                  )}
                  {customer.adverseMedia && (
                    <span className="px-2.5 py-1 uppercase bg-chart-2 text-orange-700 dark:text-orange-300 border rounded-full text-xs font-semibold">
                      Adverse Media
                    </span>
                  )}
                  {customer.watchlistMatches > 0 && (
                    <span className="px-2.5 py-1 uppercase bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-800 rounded-full text-xs font-semibold">
                      {customer.watchlistMatches} Watchlist Match
                      {customer.watchlistMatches > 1 ? 'es' : ''}
                    </span>
                  )}
                  {customer.isSynthetic && (
                    <span className="px-2.5 py-1 uppercase bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-800 rounded-full text-xs font-semibold">
                      SYNTHETIC
                    </span>
                  )}
                </div>
                <h3 className="text-foreground font-medium text-xs mb-2">
                  <CopyableText
                    text={customer.customer_id}
                    textClassName="text-foreground font-medium text-xs"
                    iconClassName='!translate-y-0'
                  />
                </h3>
                <div className="flex items-center space-x-4 text-sm text-muted-foreground flex-wrap gap-y-1">
                  <span className="flex items-center">
                    <ICONS.CreditCard size={14} className="mr-1" />
                    {customer.accountNumber}
                  </span>
                  <span className="flex items-center">
                    <ICONS.MapPin size={14} className="mr-1" />
                    {customer.jurisdiction}
                  </span>
                  <span className="flex items-center">
                    <ICONS.User size={14} className="mr-1" />
                    {customer.customerType}
                  </span>
                  <span className="flex items-center">
                    <ICONS.Calendar size={14} className="mr-1" />
                    Created: {customer.createdAt}
                  </span>
                  <span className="flex items-center text-xs">
                    <ICONS.Clock size={14} className="mr-1" />
                    Age: {customer.accountAge}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-4">
              <div className="bg-card rounded-lg p-3 border border-panel-border">
                <div className="text-primary-foreground text-xs mb-1 font-medium">
                  Transactions
                </div>
                <div className="text-foreground font-bold text-lg">
                  {customer.transactionCount}
                </div>
              </div>
              <div className="bg-card rounded-lg p-3 border border-panel-border">
                <div className="text-primary-foreground text-xs mb-1 font-medium">
                  Total Volume
                </div>
                <div className="text-foreground font-semibold text-sm">
                  {customer.transactionVolume}
                </div>
              </div>
              <div className="bg-card rounded-lg p-3 border border-panel-border">
                <div className="text-primary-foreground text-xs mb-1 font-medium">
                  Flagged
                </div>
                <div
                  className={`font-bold text-lg ${
                    customer.flaggedTransactions > 10
                      ? 'text-red-600'
                      : customer.flaggedTransactions > 5
                        ? 'text-orange-600'
                        : 'text-green-600'
                  }`}
                >
                  {customer.flaggedTransactions}
                </div>
              </div>
              <div className="bg-card rounded-lg p-3 border border-panel-border">
                <div className="text-primary-foreground text-xs mb-1 font-medium">
                  KYC Status
                </div>
                <div className={getStatusBadgeClasses(customerKycStatus.toLowerCase())}>
                  {getStatusWithIcon(customerKycStatus)}
                </div>
              </div>
              <div className="bg-card rounded-lg p-3 border border-panel-border">
                <div className="text-primary-foreground text-xs mb-1 font-medium">
                  Last Activity
                </div>
                <div className="text-foreground text-xs">
                  {customer.lastActivity}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <Button
                onClick={() => onViewProfile(customer.id)}
                className="px-4 py-2 cursor-pointer bg-[#1A5276] text-white rounded-lg hover:bg-[#143F5C] transition-all text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <ICONS.Eye size={16} />
                <span>View Profile</span>
              </Button>
              {customer.flaggedTransactions > 0 && (
                <Button
                  variant="ghost"
                  className="px-4 py-2 cursor-pointer bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-800 rounded-lg hover:bg-orange-200 dark:hover:bg-orange-900/40 transition-all text-sm font-medium"
                >
                  View Alerts
                </Button>
              )}
              {(customer.riskLevel === 'Critical' ||
                customer.riskLevel === 'High') && (
                <Button
                  variant="ghost"
                  className="px-4 py-2 cursor-pointer bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 rounded-lg hover:bg-red-200 dark:hover:bg-red-900/40 transition-all text-sm font-medium"
                >
                  Enhanced Review
                </Button>
              )}
            </div>
          </div>
        );
      })}
      </div>
    </div>
  );
}
