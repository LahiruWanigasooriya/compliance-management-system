'use client';

import { ICONS } from '@/constants/constants';
import { CustomerRiskProfile } from '@/types/customer-risk.types';

interface WatchlistSectionProps {
  customer: CustomerRiskProfile;
}

const WatchlistSection = ({ customer }: WatchlistSectionProps) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getScreeningStatusColor = (status: string) => {
    switch (status) {
      case 'Clear':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'Potential Match':
        return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300';
      case 'True Positive':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      case 'False Positive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
      default:
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    }
  };

  return (
    <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <ICONS.Shield size={20} />
          Watchlist Screening
        </h2>
        {customer.screeningStatus && (
          <span
            className={`px-3 py-1 rounded-full text-sm font-semibold ${getScreeningStatusColor(customer.screeningStatus)}`}
          >
            {customer.screeningStatus}
          </span>
        )}
      </div>

      {/* Status Indicators */}
      <div className="space-y-3 mb-4">
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <ICONS.User size={16} className="text-muted-foreground" />
            <span className="text-sm">PEP Status</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              customer.isPep
                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            }`}
          >
            {customer.isPep ? 'PEP Match' : 'Clear'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <ICONS.AlertTriangle size={16} className="text-muted-foreground" />
            <span className="text-sm">Sanctions</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              customer.hasSanctions
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            }`}
          >
            {customer.hasSanctions ? 'Sanctioned' : 'Clear'}
          </span>
        </div>

        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <div className="flex items-center gap-2">
            <ICONS.FileText size={16} className="text-muted-foreground" />
            <span className="text-sm">Adverse Media</span>
          </div>
          <span
            className={`px-2 py-0.5 rounded text-xs font-semibold ${
              customer.hasAdverseMedia
                ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
            }`}
          >
            {customer.hasAdverseMedia ? 'Found' : 'Clear'}
          </span>
        </div>
      </div>

      {/* PEP Details */}
      {customer.isPep && customer.pepDetails && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
          <h4 className="text-sm font-semibold text-purple-700 dark:text-purple-300 mb-2">
            PEP Details
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Position:</span>{' '}
              {customer.pepDetails.position}
            </p>
            <p>
              <span className="text-muted-foreground">Country:</span>{' '}
              {customer.pepDetails.country}
            </p>
            <p>
              <span className="text-muted-foreground">Source:</span>{' '}
              {customer.pepDetails.source}
            </p>
          </div>
        </div>
      )}

      {/* Sanctions Details */}
      {customer.hasSanctions && customer.sanctionsDetails && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <h4 className="text-sm font-semibold text-red-700 dark:text-red-300 mb-2">
            Sanctions Details
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">List:</span>{' '}
              {customer.sanctionsDetails.listName}
            </p>
            <p>
              <span className="text-muted-foreground">Country:</span>{' '}
              {customer.sanctionsDetails.country}
            </p>
            <p>
              <span className="text-muted-foreground">Source:</span>{' '}
              {customer.sanctionsDetails.source}
            </p>
            <p>
              <span className="text-muted-foreground">Added:</span>{' '}
              {formatDate(customer.sanctionsDetails.addedDate)}
            </p>
          </div>
        </div>
      )}

      {/* Adverse Media Details */}
      {customer.hasAdverseMedia && customer.adverseMediaDetails && (
        <div className="mb-4 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg">
          <h4 className="text-sm font-semibold text-orange-700 dark:text-orange-300 mb-2">
            Adverse Media
          </h4>
          <div className="space-y-1 text-sm">
            <p>
              <span className="text-muted-foreground">Headline:</span>{' '}
              {customer.adverseMediaDetails.headline}
            </p>
            <p>
              <span className="text-muted-foreground">Source:</span>{' '}
              {customer.adverseMediaDetails.source}
            </p>
            <p>
              <span className="text-muted-foreground">Date:</span>{' '}
              {formatDate(customer.adverseMediaDetails.date)}
            </p>
            <p>
              <span className="text-muted-foreground">Severity:</span>{' '}
              <span
                className={`font-semibold ${
                  customer.adverseMediaDetails.severity === 'Critical'
                    ? 'text-red-600'
                    : customer.adverseMediaDetails.severity === 'High'
                      ? 'text-orange-600'
                      : customer.adverseMediaDetails.severity === 'Medium'
                        ? 'text-yellow-600'
                        : 'text-green-600'
                }`}
              >
                {customer.adverseMediaDetails.severity}
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Watchlist Matches */}
      {customer.watchlistMatches && customer.watchlistMatches.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold text-foreground mb-3">
            Watchlist Matches ({customer.watchlistMatches.length})
          </h4>
          <div className="space-y-2">
            {customer.watchlistMatches.map((match) => (
              <div
                key={match.id}
                className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium text-sm">{match.source}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-semibold ${getScreeningStatusColor(match.status)}`}
                  >
                    {match.status}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                  <p>Field: {match.matchingField}</p>
                  <p>Score: {match.matchScore}%</p>
                  <p className="col-span-2">
                    Date: {formatDate(match.matchDate)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Status Message */}
      {customer.screeningStatus === 'Clear' &&
        !customer.watchlistMatches?.length && (
          <div className="text-center py-4">
            <ICONS.CheckCircle
              className="mx-auto text-green-500 mb-2"
              size={32}
            />
            <p className="text-sm text-green-600 font-medium">
              No watchlist matches found
            </p>
          </div>
        )}
    </div>
  );
};

export default WatchlistSection;
