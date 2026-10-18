import React from 'react';
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
}
const SummaryCard = ({ title, value, trend, trendColor, icon: Icon, mainColor, bottomLabel, bottomBadge }: SummeryCardProps) => {
    const TrendIcon = trend && (trend.includes('+') ? ICONS.TrendingUp : ICONS.TrendingDown);

    return (
        <div className={`bg-gradient-to-br from-white to-${mainColor}-50 rounded-xl p-6 border border-${mainColor}-100 transition-shadow hover:shadow-lg`}>
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    <p className={`text-4xl font-bold text-${mainColor}-600 mt-2`}>{value}</p>
                </div>
                <div className={`h-14 w-14 bg-${mainColor}-100 rounded-xl flex items-center justify-center border border-${mainColor}-300`}>
                    <Icon className={`h-8 w-8 text-${mainColor}-600 ${title.includes('Alerts') ? 'animate-pulse' : ''}`} />
                </div>
            </div>
            <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">{bottomLabel}</span>
                {trend && (
                    <div className={`flex items-center text-${trendColor}-600 text-sm font-semibold`}>
                        {TrendIcon && <TrendIcon size={16} className="mr-1" />}
                        {trend}
                    </div>
                )}
                {bottomBadge}
            </div>
        </div>
    );
};

export default SummaryCard;