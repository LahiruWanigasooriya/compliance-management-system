'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { ICONS } from '../../constants/constants';

type SummeryCardProps = {
  title: string;
  value: number | string;
  trend?: string | null;
  trendColor?: string;
  icon: any;
  mainColor: string;
  bottomLabel?: string;
  bottomBadge?: React.ReactNode;
  expandedContent?: React.ReactNode;
};

const SummaryCard = ({
  title,
  value,
  trend,
  trendColor,
  icon: Icon,
  mainColor,
  bottomLabel,
  bottomBadge,
  expandedContent,
}: SummeryCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const TrendIcon =
    trend && (trend.includes('+') ? ICONS.TrendingUp : ICONS.TrendingDown);

  return (
    <div
      className={`bg-card w-full from-third to-${mainColor}-50 rounded-xl border transition-shadow hover:bg-gray-50 dark:bg-[#011613] dark:border-[#1b3b2d] dark:shadow-[0_0_0_1px_rgba(27,59,45,0.35)] overflow-hidden`}
    >
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p
              className={`text-4xl font-bold text-${mainColor}-600 mt-2 dark:text-gray-300`}
            >
              {value !== null ? value : '-'}
            </p>
          </div>
          <div
            className={`h-14 w-14 bg-${mainColor}-100 rounded-xl flex items-center justify-center border border-${mainColor}-300 dark:bg-green-950 dark:border-green-800`}
          >
            <Icon
              className={`h-8 w-8 text-${mainColor}-600 dark:text-green-400 ${
                title.includes('Alerts') ? 'animate-pulse' : ''
              }`}
            />
          </div>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">{bottomLabel}</span>
          {/* {trend && (
            <div
              className={`flex items-center text-${trendColor}-600 text-sm font-semibold dark:text-${trendColor}-400`}
            >
              {TrendIcon && <TrendIcon size={16} className="mr-1" />}
              {trend}
            </div>
          )} */}
          {bottomBadge && !expandedContent && bottomBadge}
          {expandedContent && (
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className={`flex items-center gap-1 text-sm font-medium cursor-pointer text-${mainColor}-600 dark:text-${mainColor}-400 opacity-70 hover:opacity-100 transition-opacity`}
            >
              <span>{isExpanded ? 'Less' : 'Details'}</span>
              <ChevronDown
                size={16}
                className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}
              />
            </button>
          )}
        </div>
      </div>

      {/* Expandable content */}
      {expandedContent && (
        <div
          className={`overflow-hidden transition-all duration-300 ease-out ${
            isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
          }`}
        >
          <div className="px-6 pb-6 pt-2 border-t border-panel-border/50">
            {expandedContent}
          </div>
        </div>
      )}
    </div>
  );
};

export default SummaryCard;
