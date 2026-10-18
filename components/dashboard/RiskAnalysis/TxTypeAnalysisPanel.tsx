import React from 'react';
import { ICONS } from '../../../constants/constants';
import { getSeverityColor, getRiskIndicatorColor } from '../../../utils/helpers';
type TxType = {
    transactionTypes: {
        type: string;
        amount: string;
        count: number;
        avgRisk: number;
        blocked: string;
        risk: string;
    }[]
}
const TxTypeAnalysisPanel = ({ transactionTypes }: TxType) => {
    return (
        <div className="bg-gray-50 rounded-xl border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-gray-900">Transaction Type Analysis</h3>
                <button className="text-sm text-gray-700 hover:text-black font-semibold">
                    View Details
                </button>
            </div>
            <div className="space-y-3">
                {transactionTypes.map((txType, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-gray-100 transition-colors border border-gray-200">
                        <div className="flex items-center space-x-3 flex-1">
                            <ICONS.CreditCard className="h-5 w-5 text-gray-600" />
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-900">{txType.type}</p>
                                    <p className="text-sm font-bold text-gray-900">{txType.amount}</p>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                    <p className="text-xs text-gray-500">{txType.count} transactions</p>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-xs text-gray-500">Avg Risk:</span>
                                        <span className={`text-xs font-bold ${getRiskIndicatorColor(txType.avgRisk)}`}>
                                            {txType.avgRisk}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="ml-4 flex items-center space-x-3">
                            <div className="text-right">
                                <p className="text-xs text-gray-500">Blocked</p>
                                <p className="text-sm font-bold text-black">{txType.blocked}</p>
                            </div>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(txType.risk)}`}>
                                {txType.risk}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default TxTypeAnalysisPanel;