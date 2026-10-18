'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ICONS } from '@/constants/constants';
import { RiskFactor } from '@/types/customer-risk.types';
import { getRiskDashboardProfileById } from '@/actions/customer-risk.actions';
import PaginationControls, {
  getTotalPages,
} from '@/components/ui/PaginationControls';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

export default function RiskFactorsPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  const [riskFactors, setRiskFactors] = useState<RiskFactor[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const totalPages = useMemo(
    () => getTotalPages(riskFactors.length, pageSize),
    [riskFactors.length, pageSize],
  );

  const paginatedFactors = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return riskFactors.slice(startIndex, startIndex + pageSize);
  }, [riskFactors, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getRiskDashboardProfileById(profileId);
        if (response.success && response.data) {
          setRiskFactors(response.data.risk_factors || []);
          setCustomerName(response.data.profile?.full_name || 'Customer');
        } else {
          setError('Failed to load risk factors');
        }
      } catch (err) {
        setError('An error occurred while loading risk factors');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchData();
    }
  }, [profileId]);

  const toTitleCase = (str: string | null | undefined): string => {
    if (!str) return 'N/A';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
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

  const formatFactorType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600 dark:text-red-400';
    if (score >= 60) return 'text-orange-600 dark:text-orange-400';
    if (score >= 40) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 dark:bg-red-900/20';
    if (score >= 60) return 'bg-orange-100 dark:bg-orange-900/20';
    if (score >= 40) return 'bg-yellow-100 dark:bg-yellow-900/20';
    return 'bg-green-100 dark:bg-green-900/20';
  };

  if (loading) {
    return (
      <div className="relative h-96">
        <LoadingOverlay loadingText="Loading risk factors..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ICONS.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-semibold mb-2">Error</p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/customer-risk/${profileId}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ICONS.ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Risk Factors</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {toTitleCase(customerName)} - {riskFactors.length} factor
              {riskFactors.length !== 1 ? 's' : ''} identified
            </p>
          </div>
        </div>
      </div>

      {/* Risk Factors Table */}
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        {riskFactors.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ICONS.BarChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No risk factors have been identified for this profile.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-panel-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Factor Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Factor Name
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                    Score
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                    Weight
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Source
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Last Evaluated
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedFactors.map((factor, index) => (
                  <tr
                    key={factor.id || index}
                    className="border-b border-panel-border hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-foreground">
                        {formatFactorType(factor.factor_type)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div>
                        <span className="text-sm text-foreground">
                          {toTitleCase(factor.factor_name)}
                        </span>
                        {factor.details && (
                          <p className="text-xs text-muted-foreground mt-1">
                            {factor.details}
                          </p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-sm font-semibold ${getScoreBgColor(
                          factor.score,
                        )} ${getScoreColor(factor.score)}`}
                      >
                        {factor.score.toFixed(1)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="text-sm font-medium text-foreground">
                        {factor.weight.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">
                        {toTitleCase(factor.source_service)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-xs text-muted-foreground">
                        {formatDate(factor.last_evaluated)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {riskFactors.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalRecords={riskFactors.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <ICONS.Info
            size={18}
            className="text-blue-600 dark:text-blue-400 mt-0.5"
          />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">About Risk Factors</p>
            <p>
              Risk factors are individual components that contribute to the
              overall risk score. Each factor has a score (0-100) and a weight
              that determines its impact on the final risk score. Higher scores
              indicate greater risk, and factors are evaluated periodically by
              various monitoring services.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
