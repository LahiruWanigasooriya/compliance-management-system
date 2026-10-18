import React from 'react';
import ActionButton from '../../preUi/ActionButton';
import AlertItem from './AlertItem';
import { ICONS } from '../../../constants/constants';

const AlertsPanel = ({ filteredAlerts, selectedFilters, setSelectedFilters, selectedAlert, setSelectedAlert, handleCaseAction }: any) => {
    const handleFilterChange = (key: string, value: string) => {
        setSelectedFilters((prev: any) => ({ ...prev, [key]: value }));
    };

    return (
        <div className="bg-third rounded-xl border border-gray-200">
            <div className="p-6 border-b border-gray-200 ">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-xl font-bold text-gray-500">High-Priority Fraud Alerts</h2>
                        <p className="text-sm text-gray-500 mt-1">AI-powered real-time transaction monitoring</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <ActionButton onClick={()=>{}} icon={ICONS.Filter} label="Sort by Risk" className="px-3 py-1.5 text-gray-400" />
                        <ActionButton onClick={()=>{}} icon={ICONS.CheckSquare} label="Bulk Actions" isPrimary={true} className="px-3 py-1.5" />
                    </div>
                </div>

                <div className="grid grid-cols-4 gap-3">
                    <select value={selectedFilters.severity} onChange={(e) => handleFilterChange('severity', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 bg-gray-500 text-gray-900">
                        <option value="all">All Severity</option>
                        <option value="Critical">Critical</option>
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                    </select>
                    <select value={selectedFilters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 bg-gray-500 text-gray-900">
                        <option value="all">All Status</option>
                        <option value="Pending Review">Pending Review</option>
                        <option value="Under Investigation">Under Investigation</option>
                        <option value="Escalated">Escalated</option>
                    </select>
                    <select value={selectedFilters.type} onChange={(e) => handleFilterChange('type', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 bg-gray-500 text-gray-900">
                        <option value="all">All Types</option>
                        <option value="Wire Transfer">Wire Transfer</option>
                        <option value="Crypto">Crypto</option>
                        <option value="SWIFT">SWIFT</option>
                        <option value="ACH">ACH</option>
                        <option value="Card">Card</option>
                    </select>
                    <select value={selectedFilters.jurisdiction} onChange={(e) => handleFilterChange('jurisdiction', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-1 focus:ring-gray-600 bg-gray-500 text-gray-900">
                        <option value="all">All Jurisdictions</option>
                        <option value="high-risk">High-Risk Only</option>
                    </select>
                </div>
            </div>

            <div className="divide-y divide-gray-200">
                {filteredAlerts.map((alert : any) => (
                    <AlertItem
                        key={alert.id}
                        alert={alert}
                        isSelected={selectedAlert === alert.id}
                        onClick={() => setSelectedAlert(selectedAlert === alert.id ? null : alert.id)}
                        handleCaseAction={handleCaseAction}
                    />
                ))}
            </div>

            <div className="p-4 bg-white border-t border-gray-200 flex items-center justify-between rounded-b-xl">
                {/* <p className="text-sm text-gray-600">Showing {filteredAlerts.length} of {alerts.length} alerts</p> */}
                <button className="text-sm cursor-pointer font-semibold text-gray-700 hover:text-black flex items-center space-x-1">
                    <span>View All Alerts</span>
                    <ICONS.ChevronRight size={16} />
                </button>
            </div>
        </div>
    );
};

export default AlertsPanel;