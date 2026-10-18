import React from 'react';
import { ICONS } from '../../constants/constants';
import {
  CaseTrendAnalysis,
  AlertsBreakdown,
  CasesMetrics,
} from '@/types/dashboard.types';

type ComplianceMetricCardProps = {
  title: string;
  value: string;
  detail: string;
  detailColor?: string;
  bgColor?: string;
  borderColor?: string;
};
const ComplianceMetricCard = ({
  title,
  value,
  detail,
  detailColor,
}: ComplianceMetricCardProps) => (
  <div className={`p-4 bg-card-second rounded-lg border border-border`}>
    <p className="text-xs text-primary-foreground font-medium mb-2">{title}</p>
    <p className="text-2xl font-bold text-foreground">{value}</p>
    <p className={`text-xs mt-1 ${detailColor || 'text-primary-foreground'}`}>
      {detail}
    </p>
  </div>
);

type ComplianceMetricsPanelProps = {
  complianceMetrics: any;
  geoRiskData: any[];
  transactionTypes: any[];
  fraudData: any;
  expandedMetrics: boolean;
  setExpandedMetrics: any;
  caseTrends?: CaseTrendAnalysis | null;
  complianceRate?: number;
  rateChangeVsLastMonth?: number;
  alertsBreakdown?: AlertsBreakdown | null;
  casesMetrics?: CasesMetrics | null;
};

const ComplianceMetricsPanel = ({
  complianceMetrics,
  geoRiskData,
  transactionTypes,
  fraudData,
  expandedMetrics,
  setExpandedMetrics,
  caseTrends,
  complianceRate,
  rateChangeVsLastMonth,
  alertsBreakdown,
  casesMetrics,
}: ComplianceMetricsPanelProps) => {
  // Format hours to days
  const formatClosureSpeed = (hours?: number): string => {
    if (!hours) return '0 days';
    if (hours < 24) return `${Math.round(hours)} hours`;
    const days = Math.round(hours / 24);
    return `${days} day${days !== 1 ? 's' : ''}`;
  };

  // Format trend with arrow
  const formatTrendChange = (
    value?: number,
  ): { text: string; color: string } => {
    if (!value) return { text: '0%', color: 'text-muted-foreground' };
    const isPositive = value > 0;
    const arrow = isPositive ? '↑' : '↓';
    return {
      text: `${arrow} ${Math.abs(value).toFixed(1)}%`,
      color: isPositive
        ? 'text-green-600 dark:text-green-400'
        : 'text-red-600 dark:text-red-400',
    };
  };

  // Calculate total alerts and cases
  const totalAlerts = alertsBreakdown?.total_alerts ?? 0;
  const totalCases = casesMetrics?.total_active ?? 0;
  const displayComplianceRate = complianceRate ?? 0;
  return (
    <div className="mt-6 bg-card rounded-xl border border-border p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-foreground">
          Regulatory Compliance Metrics
        </h2>
        <button
          onClick={() => setExpandedMetrics(!expandedMetrics)}
          className="text-sm font-semibold text-primary-foreground  hover:text-primary-foreground/70 flex items-center space-x-1 cursor-pointer"
        >
          <span>{expandedMetrics ? 'Collapse' : 'Expand Details'}</span>
          <ICONS.ChevronDown
            className={`h-4 w-4 transition-transform ${
              expandedMetrics ? 'rotate-180' : ''
            }`}
          />
        </button>
      </div>

      <div className="">
        <div>
          {/* <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-primary-foreground">
              High-Risk Jurisdictions
            </p>
            <ICONS.PieChart className="h-5 w-5 text-primary-foreground" />
          </div> */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
            <ComplianceMetricCard
              title="Total Alerts"
              value={totalAlerts.toString()}
              detail={`${alertsBreakdown?.elevated_count ?? 0} elevated, ${alertsBreakdown?.high_risk_count ?? 0} high risk`}
            />
            <ComplianceMetricCard
              title="Total Cases"
              value={totalCases.toString()}
              detail={`${casesMetrics?.escalated_cases ?? 0} escalated, ${casesMetrics?.pending_review ?? 0} pending review`}
            />
            <ComplianceMetricCard
              title="Compliance Rate"
              value={`${displayComplianceRate.toFixed(1)}%`}
              detail={
                formatTrendChange(rateChangeVsLastMonth).text +
                ' from last month'
              }
              detailColor={formatTrendChange(rateChangeVsLastMonth).color}
            />
          </div>
        </div>

        {/* <div>
                    <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold text-gray-700">Transaction Risk Categories</p><ICONS.BarChart3 className="h-5 w-5 text-gray-500" /></div>
                    <div className="space-y-2">
                        {transactionTypes.slice(0, 3).map((type, idx) => (
                            <div key={idx} className="flex items-center justify-between p-2 bg-white rounded border border-gray-200">
                                <span className="text-sm text-gray-700">{type.type}</span>
                                <div className="flex items-center space-x-2">
                                    <span className="text-sm font-bold text-gray-900">{type.count}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${getSeverityColor(type.risk)}`}>
                                        {type.risk}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div> */}

        {/* <div>
                    <div className="flex items-center justify-between mb-3"><p className="text-sm font-semibold text-gray-700">Filing Performance</p><ICONS.Activity className="h-5 w-5 text-gray-500" /></div>
                    <div className="space-y-2">
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"><span className="text-sm text-gray-700">SAR Filing Rate</span><span className="text-sm font-bold text-gray-600">{complianceMetrics.sarFilingRate}%</span></div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"><span className="text-sm text-gray-700">CTR Filing Rate</span><span className="text-sm font-bold text-gray-600">{complianceMetrics.ctrFilingRate}%</span></div>
                        <div className="flex items-center justify-between p-2 bg-white rounded border border-gray-200"><span className="text-sm text-gray-700">On-Time Filing</span><span className="text-sm font-bold text-gray-600">{complianceMetrics.onTimeFilingRate}%</span></div>
                    </div>
                </div> */}
      </div>

      {expandedMetrics && (
        <div className="mt-6 pt-6 border-t border-border">
          <h3 className="text-lg font-bold text-foreground mb-4">
            Detailed Compliance Metrics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center"><ICONS.FileCheck className="h-4 w-4 mr-2 text-gray-600" />Investigation Quality</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between"><span className="text-xs text-gray-600">Avg Investigation Time</span><span className="text-sm font-bold text-gray-900">{complianceMetrics.avgInvestigationTime}</span></div>
                                <div className="flex items-center justify-between"><span className="text-xs text-gray-600">Document Completeness</span><span className="text-sm font-bold text-gray-600">{complianceMetrics.documentCompleteness}%</span></div>
                                <div className="flex items-center justify-between"><span className="text-xs text-gray-600">False Positive Reduction</span><span className="text-sm font-bold text-gray-600">{complianceMetrics.falsePositiveReduction}</span></div>
                            </div>
                        </div> */}
            {/* <div className="space-y-3 p-4 bg-white rounded-lg border border-gray-200">
                            <h4 className="text-sm font-semibold text-gray-700 flex items-center"><ICONS.Shield className="h-4 w-4 mr-2 text-gray-600" />Regulatory Filing</h4>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between"><span className="text-xs text-gray-600">SAR Filing Rate</span><span className="text-sm font-bold text-gray-600">{complianceMetrics.sarFilingRate}%</span></div>
                                <div className="flex items-center justify-between"><span className="text-xs text-gray-600">CTR Filing Rate</span><span className="text-sm font-bold text-gray-600">{complianceMetrics.ctrFilingRate}%</span></div>
                                <div className="flex items-center justify-between"><span className="text-xs text-gray-600">On-Time Filing</span><span className="text-sm font-bold text-gray-600">{complianceMetrics.onTimeFilingRate}%</span></div>
                            </div>
                        </div> */}
            {/* <div className="space-y-3 p-4 bg-card-second rounded-lg border border-border">
              <h4 className="text-sm font-semibold text-foreground flex items-center">
                <ICONS.Target className="h-4 w-4 mr-2 text-foreground" />
                Customer Screening
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Screening Rate
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {complianceMetrics.customerScreeningRate}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Watchlist Matches
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {fraudData.watchlistMatches}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">
                    Audit Score
                  </span>
                  <span className="text-sm font-bold text-foreground">
                    {complianceMetrics.auditScore}%
                  </span>
                </div>
              </div>
            </div> */}
          </div>

          <div className="p-4 bg-card-second rounded-lg border border-border">
            <div className="flex space-x-3">
              <div className="h-8 w-8 bg-gray-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <ICONS.History className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-bold text-foreground mb-2">
                  Case Trend Analysis
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Cases Opened This Month
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {caseTrends?.cases_opened_this_month ?? 0}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Cases Closed This Month
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {caseTrends?.cases_closed_this_month ?? 0}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Average Closure Speed
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {formatClosureSpeed(
                        caseTrends?.average_closure_speed_hours,
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs text-muted-foreground mb-1">
                      Closure Rate
                    </p>
                    <p className="text-lg font-bold text-foreground">
                      {caseTrends?.closure_rate_percentage?.toFixed(1) ?? 0}%
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ComplianceMetricsPanel;
