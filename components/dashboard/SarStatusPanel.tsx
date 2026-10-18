import React from 'react';
import ActionButton from '../preUi/ActionButton';
import { ICONS } from '../../constants/constants';
import { getStatusColor } from '../../utils/helpers';

type SarStatus = {
    id: string;
    status: string;
    date: string;
    priority: string;
    daysOpen: number;
    transactionId: string;
    suspicionType: string;
    amount: string;
    submissionDate?: string;
    acknowledgment?: string;
    regulatoryDeadline?: string;
    officer?: string;
}
const SarStatusPanel = ({ sarStatus }: { sarStatus: SarStatus[] }) => {
    return (
        <div className="bg-white rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">Regulatory Filings</h2>
                <p className="text-sm text-gray-600 mt-1">SAR, CTR & MTL tracking</p>
            </div>
            <div className="p-6 space-y-3">
                {sarStatus.map((sar) => (
                    <div key={sar.id} className="border-2 border-gray-200 rounded-lg p-4 hover:border-gray-500 transition-colors cursor-pointer bg-white">
                        <div className="flex items-center justify-between mb-3">
                            <span className="font-mono text-sm font-bold text-gray-900">{sar.id}</span>
                            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(sar.status)}`}>
                                {sar.status}
                            </span>
                        </div>
                        <div className="space-y-2">
                            {/* Priority badge relies on dynamic color, ensuring utility classes are loaded */}
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Priority:</span>
                                <span className={`px-2 py-0.5 rounded ${sar.priority === 'Critical' ? 'bg-black text-white' : sar.priority === 'High' ? 'bg-gray-700 text-white' : sar.priority === 'Medium' ? 'bg-gray-500 text-gray-900' : 'bg-gray-300 text-gray-700'} font-semibold`}>
                                    {sar.priority}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-gray-500">Officer:</span>
                                <span className="text-gray-900 font-medium">{sar.officer}</span>
                            </div>
                            {sar.regulatoryDeadline && (
                                <div className="flex items-center text-xs text-black bg-gray-200 p-2 rounded mt-2 border border-gray-400">
                                    <ICONS.Clock size={12} className="mr-1" />
                                    <span>Deadline: {sar.regulatoryDeadline}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center space-x-2 mt-3">
                            <ActionButton onClick={() => {}} icon={ICONS.Edit} label="Edit" isPrimary={true} className="flex-1 text-xs px-3 py-1.5" />
                            <ActionButton onClick={() => {}} icon={ICONS.Eye} label="View" className="flex-1 text-xs px-3 py-1.5" />
                        </div>
                    </div>
                ))}
                <button className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm font-semibold text-gray-600 hover:border-[#1A5276] hover:text-[#1A5276] transition-colors flex items-center justify-center space-x-2">
                    <ICONS.Plus size={16} />
                    <span>Create New Filing</span>
                </button>
            </div>
        </div>
    );
};

export default SarStatusPanel;