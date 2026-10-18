import React from 'react';
import ActionButton from '../../preUi/ActionButton';
import Badge from '../../preUi/Badge';
import { ICONS } from '../../../constants/constants';
import { getSeverityColor, getStatusColor, getRiskIndicatorColor } from '../../../utils/helpers';

type AlertItemProps = {
    alert: any;
    isSelected: boolean;
    onClick: () => void;
    handleCaseAction: (alertId: string, action: string) => void;
}

const AlertItem = ({ alert, isSelected, onClick, handleCaseAction }: AlertItemProps) => {
    return (
        <div
            className="p-6 bg-third hover:bg-primary transition-colors cursor-pointer"
            onClick={onClick}
        >
            <div className="flex-col">
                <div className="flex items-start space-x-4 flex-1">
                    <input
                        type="checkbox"
                        className="mt-1 h-4 w-4 rounded border-gray-400 bg-white text-gray-500 focus:ring-gray-600"
                        onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-3">
                            <span className="font-mono text-sm font-bold text-gray-500">{alert.id}</span>
                            <Badge colorClass={getSeverityColor(alert.severity)}>{alert.severity}</Badge>
                            <Badge colorClass={getStatusColor(alert.status)}>{alert.status}</Badge>
                            {alert.assignedTo && (
                                <span className="px-2 py-1 bg-gray-200 text-gray-800 rounded text-xs font-medium flex items-center">
                                    <ICONS.User size={12} className="mr-1" />
                                    {alert.assignedTo}
                                </span>
                            )}
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                            {/* Metadata Blocks */}
                            <div><p className="text-xs text-gray-400 mb-1">Amount</p><p className="text-sm font-bold text-foreground">{alert.amount} {alert.currency}</p></div>
                            <div><p className="text-xs text-gray-400 mb-1">Type</p><p className="text-sm font-semibold text-foreground">{alert.type}</p></div>
                            <div><p className="text-xs text-gray-400 mb-1">Location</p><div className="flex items-center"><ICONS.MapPin className="h-3 w-3 text-foreground mr-1" /><p className="text-sm font-medium text-foreground">{alert.location}</p></div></div>
                            <div><p className="text-xs text-gray-400 mb-1">Time</p><p className="text-sm font-medium text-foreground">{alert.time}</p></div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-3">
                            {/* Counterparties */}
                            <div><p className="text-xs text-gray-400 mb-1">Sender</p><p className="text-sm font-medium text-foreground">{alert.sender}</p><p className="text-xs text-foreground">{alert.senderAccount} • KYC: {alert.senderKYC}</p></div>
                            <div><p className="text-xs text-gray-400 mb-1">Recipient</p><p className="text-sm font-medium text-foreground">{alert.recipient}</p><p className="text-xs text-foreground">{alert.recipientAccount} • KYC: {alert.recipientKYC}</p></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
                            {/* Risk/Confidence */}
                            <div className="flex items-center space-x-4">
                                <span className="text-xs text-gray-400">AI Risk Score:</span>
                                <span className={`text-sm font-bold text-foreground ${getRiskIndicatorColor(alert.riskScore)}`}> {alert.riskScore}/100 </span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <span className="text-xs text-gray-400">Confidence:</span>
                                <span className="text-sm font-semibold text-foreground">{alert.aiConfidence}%</span>
                            </div>
                        </div>

                        {/* Expanded Details */}
                        {isSelected && (
                            <div className="mt-4 pt-4 border-t border-gray-300 space-y-3">
                                <div className="bg-gray-200 p-3 rounded-lg border border-gray-500">
                                    <p className="text-xs font-semibold text-gray-600 mb-2">AML Rule Violations</p>
                                    <ul className="space-y-1">
                                        {alert.amlViolations.map((v: any, idx: number) => (<li key={idx} className="text-sm text-gray-500 flex items-start"><span className="text-gray-500 mr-2">•</span>{v}</li>))}
                                    </ul>
                                </div>
                                <div className="bg-gray-100 p-3 rounded-lg border border-gray-300">
                                    <p className="text-xs font-semibold text-gray-600 mb-1">Behavioral Anomaly</p>
                                    <p className="text-sm text-gray-800">{alert.behavioralAnomaly}</p>
                                </div>
                                <div className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                                    <p className="text-xs font-semibold text-gray-500 mb-1">AI Pattern Match</p>
                                    <p className="text-sm text-gray-600">{alert.fraudPattern}</p>
                                </div>
                                <div className="flex items-center space-x-2 text-xs text-gray-500"><ICONS.Clock size={12} /><span>Timestamp: {alert.timestamp}</span></div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className={`mt-4 pt-4 border-t border-gray-200 flex flex-row gap-2 ${isSelected ? 'justify-start' : 'justify-end'}`}>
                    <ActionButton
                        onClick={(e) => { e.stopPropagation(); handleCaseAction(alert.id, 'review'); }}
                        icon={ICONS.Eye} label="Review"
                    />
                    <ActionButton
                        onClick={(e) => { e.stopPropagation(); handleCaseAction(alert.id, 'escalate'); }}
                        icon={ICONS.ArrowUpRight} label="Escalate"
                    />
                    <ActionButton
                        onClick={(e) => { e.stopPropagation(); handleCaseAction(alert.id, 'file-sar'); }}
                        icon={ICONS.Send} label="File SAR" isPrimary={true}
                    />
                    <ActionButton
                        onClick={(e) => { e.stopPropagation(); handleCaseAction(alert.id, 'dismiss'); }}
                        label="Dismiss"
                    />
                </div>
            </div>
        </div>
    );
};

export default AlertItem;