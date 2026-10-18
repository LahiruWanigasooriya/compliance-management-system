import React from 'react';
import { ICONS } from '../../../constants/constants';
import { getSeverityColor, getTrendColor } from '../../../utils/helpers';

type GeoRiskPanelProps = {
    geoRiskData: {
        country: string;
        amount: string;
        alerts: string;
        blocked: string;
        trend: string;
        risk: string;
    }[]
}

const GeoRiskPanel = ({ geoRiskData }: GeoRiskPanelProps) => {
    return (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6 w-full">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Geographic Risk Analysis</h3>
                <button className="text-sm text-gray-700 hover:text-black font-semibold flex items-center space-x-1">
                    <ICONS.MapPin size={14} />
                    <span>View Map</span>
                </button>
            </div>
            <div className="space-y-2">
                {geoRiskData.map((geo, idx) => {
                    const TrendIcon = geo.trend.includes('+') ? ICONS.ArrowUpRight : geo.trend.includes('-') ? ICONS.ArrowDownRight : null;
                    return (
                        <div key={idx} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:border-gray-500 transition-colors bg-white">
                            <div className="flex items-center space-x-3 flex-1">
                                <ICONS.Globe className="h-5 w-5 text-gray-600" />
                                <div className="flex-1">
                                    <div className="flex items-center justify-between">
                                        <p className="text-sm font-semibold text-gray-900">{geo.country}</p>
                                        <p className="text-sm font-bold text-gray-900">{geo.amount}</p>
                                    </div>
                                    <div className="flex items-center justify-between mt-1">
                                        <p className="text-xs text-gray-500">{geo.alerts} flagged transactions</p>
                                        <p className="text-xs text-black font-medium">Blocked: {geo.blocked}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="ml-4 flex items-center space-x-3">
                                <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(geo.risk)}`}>
                                    {geo.risk}
                                </span>
                                <div className={`flex items-center text-xs font-semibold ${getTrendColor(geo.trend)}`}>
                                    {TrendIcon && <TrendIcon size={14} />}
                                    {geo.trend}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};

export default GeoRiskPanel;