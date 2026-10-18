'use client';

import { useState, useEffect, useMemo } from 'react';
import { ICONS } from '@/constants/constants';
import { HeatmapDataPoint } from '@/types/cases.types';
import { getCasesHeatmap } from '@/actions/cases.actions';
import LoadingOverlay from '@/components/layout/LoadingOverlay';
import { getRiskBadgeClasses } from '@/utils/kyc/badgeClasses';

interface CaseHeatmapProps {
  className?: string;
}

const RISK_LEVELS = ['low', 'medium', 'high', 'critical'] as const;

const getRiskLevelLabel = (level: string): string => {
  const labels: Record<string, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };
  return labels[level] || level;
};

const getHeatmapColor = (
  count: number,
  maxCount: number,
  riskLevel: string,
): string => {
  if (count === 0) {
    return 'rgb(245, 245, 245)'; // Light gray for zero
  }

  // Risk level-based colors
  switch (riskLevel) {
    case 'critical':
      return 'rgb(220, 38, 38)'; // Red
    case 'high':
      return 'rgb(30, 64, 175)'; // Dark blue
    case 'medium':
      return 'rgb(147, 197, 253)'; // Light blue
    case 'low':
      return 'rgb(156, 163, 175)'; // Gray
    default:
      return 'rgb(245, 245, 245)';
  }
};

const getTextColor = (count: number, riskLevel: string): string => {
  if (count === 0) return 'text-gray-400';
  // Use white text for dark backgrounds (critical, high, low), dark text for light blue (medium)
  if (riskLevel === 'medium') {
    return 'text-gray-800';
  }
  return 'text-white';
};

export const CaseHeatmap = ({ className = '' }: CaseHeatmapProps) => {
  const [data, setData] = useState<HeatmapDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    location: string;
    risk: string;
  } | null>(null);
  const [isExpanded, setIsExpanded] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const heatmapData = await getCasesHeatmap();
        setData(heatmapData);
        setError(null);
      } catch (err) {
        console.error('Error fetching heatmap data:', err);
        setError('Failed to load heatmap data');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const { locations, heatmapMatrix, maxCount, locationTotals } = useMemo(() => {
    const uniqueLocations = [
      ...new Set(data.map((d) => d.location || 'Unknown')),
    ].sort();

    const matrix: Record<string, Record<string, number>> = {};
    const totals: Record<string, Record<string, number>> = {};
    let max = 0;

    uniqueLocations.forEach((loc) => {
      matrix[loc] = {};
      totals[loc] = { total: 0, low: 0, medium: 0, high: 0, critical: 0 };
      RISK_LEVELS.forEach((risk) => {
        matrix[loc][risk] = 0;
      });
    });

    data.forEach((point) => {
      const loc = point.location || 'Unknown';
      const risk = point.risk_category || 'low';
      if (
        matrix[loc] &&
        RISK_LEVELS.includes(risk as (typeof RISK_LEVELS)[number])
      ) {
        matrix[loc][risk] = point.count;
        totals[loc][risk] = point.count;
        totals[loc].total += point.count;
        if (point.count > max) max = point.count;
      }
    });

    return {
      locations: uniqueLocations,
      heatmapMatrix: matrix,
      maxCount: max,
      locationTotals: totals,
    };
  }, [data]);

  const getHoveredCellData = () => {
    if (!hoveredCell) return null;
    const { location, risk } = hoveredCell;
    const count = heatmapMatrix[location]?.[risk] || 0;
    const total = locationTotals[location]?.total || 0;
    return {
      location,
      risk,
      count,
      total,
      breakdown: locationTotals[location],
    };
  };

  // Generate color scale for legend - now showing risk levels
  const colorScaleSteps = useMemo(() => {
    return [
      { label: 'Critical', color: 'rgb(220, 38, 38)' },
      { label: 'High', color: 'rgb(30, 64, 175)' },
      { label: 'Medium', color: 'rgb(147, 197, 253)' },
      { label: 'Low', color: 'rgb(156, 163, 175)' },
    ];
  }, []);

  if (loading) {
    return (
      <div
        className={`bg-card rounded-xl shadow p-6 border border-panel-border ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <ICONS.Globe size={20} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Geographic Risk Heatmap Matrix
          </h2>
        </div>
        <div className="relative h-48">
          <LoadingOverlay />
        </div>
      </div>
    );
  }

  if (error || locations.length === 0) {
    return (
      <div
        className={`bg-card rounded-xl shadow p-6 border border-panel-border ${className}`}
      >
        <div className="flex items-center gap-2 mb-4">
          <ICONS.Globe size={20} className="text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">
            Geographic Risk Heatmap Matrix
          </h2>
        </div>
        <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
          <ICONS.Globe size={48} className="mb-2 opacity-50" />
          <p>No geographic data available</p>
        </div>
      </div>
    );
  }

  const hoveredData = getHoveredCellData();
  const cellSize = 64;

  return (
    <div
      className={`bg-card rounded-xl shadow border border-panel-border ${className}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors rounded-t-xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <ICONS.Globe size={20} className="text-blue-500" />
          <h2 className="text-lg font-semibold text-foreground">
            Geographic Risk Heatmap Matrix
          </h2>
        </div>
        <button className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors cursor-pointer">
          {isExpanded ? (
            <ICONS.ChevronUp size={20} />
          ) : (
            <ICONS.ChevronDown size={20} />
          )}
        </button>
      </div>

      {isExpanded && (
        <div className="p-4 pt-0">
          {/* Heatmap Container */}
          <div className="flex gap-4">
            {/* Main Heatmap Grid */}
            <div className="flex-1 overflow-x-auto">
              <div className="inline-block min-w-fit">
                {/* Title */}
                <div className="text-center text-sm font-medium text-muted-foreground">
                  Case Distribution by Location and Risk Level
                </div>

                <div className="flex">
                  {/* Y-axis labels (Risk levels) */}
                  <div className="flex flex-col justify-center pr-2">
                    <div className="text-xs font-bold text-muted-foreground mb-2 -rotate-0 transform origin-center">
                      Risk
                    </div>
                    {[...RISK_LEVELS].reverse().map((riskLevel) => (
                      <div
                        key={riskLevel}
                        className="flex items-center justify-end pr-2 text-xs font-medium text-muted-foreground"
                        style={{ height: cellSize }}
                      >
                        {getRiskLevelLabel(riskLevel)}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap cells */}
                  <div>
                    {/* Grid */}
                    <div
                      className="grid gap-[2px] mt-6"
                      style={{
                        gridTemplateColumns: `repeat(${locations.length}, ${cellSize}px)`,
                      }}
                    >
                      {[...RISK_LEVELS].reverse().map((riskLevel) =>
                        locations.map((location) => {
                          const count =
                            heatmapMatrix[location]?.[riskLevel] || 0;
                          const isHovered =
                            hoveredCell?.location === location &&
                            hoveredCell?.risk === riskLevel;
                          const bgColor = getHeatmapColor(
                            count,
                            maxCount,
                            riskLevel,
                          );

                          return (
                            <div
                              key={`${location}-${riskLevel}`}
                              className={`flex items-center justify-center cursor-pointer transition-all duration-150 ${
                                isHovered
                                  ? 'ring-2 ring-gray-800 dark:ring-white z-10 scale-105'
                                  : ''
                              }`}
                              style={{
                                width: cellSize,
                                height: cellSize,
                                backgroundColor: bgColor,
                              }}
                              onMouseEnter={() =>
                                setHoveredCell({ location, risk: riskLevel })
                              }
                              onMouseLeave={() => setHoveredCell(null)}
                            >
                              <span
                                className={`text-sm font-semibold ${getTextColor(count, riskLevel)}`}
                              >
                                {count}
                              </span>
                            </div>
                          );
                        }),
                      )}
                    </div>

                    {/* X-axis labels (Locations) - rotated */}
                    <div
                      className="grid mt-2"
                      style={{
                        gridTemplateColumns: `repeat(${locations.length}, ${cellSize}px)`,
                      }}
                    >
                      {locations.map((location) => (
                        <div
                          key={location}
                          className="flex justify-center"
                          style={{ width: cellSize }}
                        >
                          <span
                            className="text-xs font-medium text-muted-foreground whitespace-nowrap origin-top-left translate-y-1"
                            title={location}
                          >
                            {location.length > 12
                              ? `${location.substring(0, 12)}...`
                              : location}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* X-axis title */}
                    <div
                      className="text-center text-xs font-bold text-muted-foreground"
                      style={{
                        marginTop: locations.some((l) => l.length > 8)
                          ? '40px'
                          : '20px',
                      }}
                    >
                      Locations
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Color Scale Legend */}
            <div className="flex flex-col items-center ml-4">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                Risk Level
              </div>
              <div className="flex flex-col gap-1">
                {colorScaleSteps.map((step, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded"
                      style={{ backgroundColor: step.color }}
                    />
                    <span className="text-xs text-muted-foreground">
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Hover Tooltip */}
          {hoveredData && (
            <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-semibold text-foreground flex items-center gap-2">
                  <ICONS.MapPin size={16} className="text-blue-500" />
                  {hoveredData.location}
                </h3>
                <span className={getRiskBadgeClasses(hoveredData.risk)}>
                  {getRiskLevelLabel(hoveredData.risk)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Selected Cell Cases
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {hoveredData.count}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">
                    Total Cases in Region
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {hoveredData.total}
                  </p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <p className="text-xs text-muted-foreground mb-2">
                  Cases by Risk Level
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: 'rgb(156, 163, 175)' }}
                    ></span>
                    <span className="text-xs text-muted-foreground">Low:</span>
                    <span className="text-xs font-medium text-foreground">
                      {hoveredData.breakdown?.low || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: 'rgb(147, 197, 253)' }}
                    ></span>
                    <span className="text-xs text-muted-foreground">
                      Medium:
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {hoveredData.breakdown?.medium || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: 'rgb(30, 64, 175)' }}
                    ></span>
                    <span className="text-xs text-muted-foreground">High:</span>
                    <span className="text-xs font-medium text-foreground">
                      {hoveredData.breakdown?.high || 0}
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span
                      className="w-3 h-3 rounded"
                      style={{ backgroundColor: 'rgb(220, 38, 38)' }}
                    ></span>
                    <span className="text-xs text-muted-foreground">
                      Critical:
                    </span>
                    <span className="text-xs font-medium text-foreground">
                      {hoveredData.breakdown?.critical || 0}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CaseHeatmap;
