import React from 'react';
import { ICONS } from '../../constants/constants';
import ActionButton from '../preUi/ActionButton';

type AIMetrics = {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    modelVersion: string;
    lastRetrained: string;
    trainingDataSize: string;
    detectionSpeed: string;
};

const AIMetricsPanel = ({ aiMetrics }: { aiMetrics: AIMetrics }) => {
    return (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div className="flex items-center space-x-2 mb-4">
                <ICONS.Zap className="h-6 w-6 text-purple-600" />
                <h3 className="text-lg font-bold text-gray-900">AI Model Performance</h3>
            </div>
            <div className="space-y-3">
                {Object.entries({ Accuracy: aiMetrics.accuracy, Precision: aiMetrics.precision, Recall: aiMetrics.recall, 'F1 Score': aiMetrics.f1Score }).map(([metricName, score], idx) => (
                    <div key={idx}>
                        <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium text-gray-600">{metricName}</span>
                            <span className="text-xs font-bold text-gray-900">{score}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            {/* Static colors used for clarity in the progress bars */}
                            <div className={`${metricName === 'Accuracy' ? 'bg-green-600' : metricName === 'Precision' ? 'bg-blue-600' : metricName === 'Recall' ? 'bg-purple-600' : 'bg-indigo-600'} h-2 rounded-full`} style={{ width: `${score}%` }}></div>
                        </div>
                    </div>
                ))}
            </div>
            <div className="mt-4 pt-4 border-t border-purple-200 space-y-2">
                <div className="flex items-center justify-between text-xs"><span className="text-gray-600">Model Version</span><span className="text-gray-900 font-semibold">{aiMetrics.modelVersion}</span></div>
                <div className="flex items-center justify-between text-xs"><span className="text-gray-600">Last Retrained</span><span className="text-gray-900 font-semibold">{aiMetrics.lastRetrained}</span></div>
                <div className="flex items-center justify-between text-xs"><span className="text-gray-600">Training Data</span><span className="text-gray-900 font-semibold">{aiMetrics.trainingDataSize}</span></div>
            </div>
            <ActionButton onClick={()=>{}} icon={ICONS.BarChart3} label="View Detailed Analytics" className="w-full mt-4" />
        </div>
    );
};

export default AIMetricsPanel;