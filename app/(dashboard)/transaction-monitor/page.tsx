'use client';
// TODO: REMOVE USE CLIENT ONEC IT MOVED TO SSR
import SummaryCard from "@/components/layout/SummaryCard";
import { ICONS, TIME_RANGES, transactionTypes } from "@/constants/constants";
import { useState, useMemo } from "react";


const TransactionMonitor = () => {
    const [selectedTimeRange, setSelectedTimeRange] = useState('24h');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedType, setSelectedType] = useState('all');

    const transactions = [
        {
            id: 'TXN-8921',
            timestamp: '2025-10-10 14:45:23',
            amount: '$45,230',
            sender: 'John Anderson',
            senderAccount: 'ACC-10293',
            recipient: 'Offshore Ltd',
            recipientAccount: 'ACC-87432',
            type: 'Wire Transfer',
            status: 'Flagged',
            riskScore: 94,
            location: 'Cayman Islands',
            paymentMethod: 'SWIFT'
        },
        {
            id: 'TXN-8920',
            timestamp: '2025-10-10 14:32:15',
            amount: '$12,500',
            sender: 'Sarah Mitchell',
            senderAccount: 'ACC-23847',
            recipient: 'Crypto Exchange',
            recipientAccount: 'WALLET-0x742d',
            type: 'Crypto',
            status: 'Under Review',
            riskScore: 87,
            location: 'Hong Kong',
            paymentMethod: 'Cryptocurrency'
        },
        {
            id: 'TXN-8919',
            timestamp: '2025-10-10 14:15:08',
            amount: '$8,750',
            sender: 'David Chen',
            senderAccount: 'ACC-45621',
            recipient: 'Business Account',
            recipientAccount: 'ACC-98234',
            type: 'ACH',
            status: 'Approved',
            riskScore: 42,
            location: 'United States',
            paymentMethod: 'ACH'
        },
        {
            id: 'TXN-8918',
            timestamp: '2025-10-10 13:58:42',
            amount: '$67,890',
            sender: 'Maria Rodriguez',
            senderAccount: 'ACC-73294',
            recipient: 'Shell Company',
            recipientAccount: 'ACC-12847',
            type: 'Wire Transfer',
            status: 'Blocked',
            riskScore: 96,
            location: 'Panama',
            paymentMethod: 'SWIFT'
        },
        {
            id: 'TXN-8917',
            timestamp: '2025-10-10 13:42:18',
            amount: '$23,400',
            sender: 'Michael Wong',
            senderAccount: 'ACC-56743',
            recipient: 'Trading Co',
            recipientAccount: 'ACC-98321',
            type: 'SWIFT',
            status: 'Flagged',
            riskScore: 82,
            location: 'Singapore',
            paymentMethod: 'SWIFT'
        }
    ];

    const stats = useMemo(() => {
        const total = transactions.length;
        const flagged = transactions.filter(t => t.status === 'Flagged').length;
        const blocked = transactions.filter(t => t.status === 'Blocked').length;
        const totalAmount = transactions.reduce((sum, t) => {
            return sum + parseFloat(t.amount.replace(/[$,]/g, ''));
        }, 0);
        
        return { total, flagged, blocked, totalAmount: `$${(totalAmount / 1000).toFixed(1)}K` };
    }, [transactions]);

    const filteredTransactions = useMemo(() => {
        return transactions.filter(txn => {
            const matchesType = selectedType === 'all' || txn.type === selectedType;
            const matchesSearch = 
                txn.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                txn.sender.toLowerCase().includes(searchTerm.toLowerCase()) ||
                txn.recipient.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesType && matchesSearch;
        });
    }, [transactions, selectedType, searchTerm]);

    const getStatusBadgeClasses = (status: string) => {
        const styles = {
            'Flagged': 'bg-red-100 text-red-700 border-red-300',
            'Under Review': 'bg-yellow-100 text-yellow-700 border-yellow-300',
            'Approved': 'bg-green-100 text-green-700 border-green-300',
            'Blocked': 'bg-gray-800 text-white border-gray-900'
        };
        return `px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`;
    };

    return (
        <div className="p-4 lg:p-5 max-w-[1980px] mx-auto ">
                {/* Header */}
                <div className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-3 lg:space-y-0">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Transaction Monitor</h1>
                        <p className="text-gray-600 text-sm mt-0.5">Real-time monitoring of all payment transactions • Last updated: 30s ago</p>
                    </div>
                    <div className="flex items-center space-x-2">
                        <select
                            value={selectedTimeRange}
                            onChange={(e) => setSelectedTimeRange(e.target.value)}
                            className="px-3 py-1.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-gray-600 bg-white text-gray-900 text-sm font-medium"
                        >
                            {TIME_RANGES.map(range => <option key={range.value} value={range.value}>{range.label}</option>)}
                        </select>
                        <button className="flex items-center space-x-1.5 px-3 py-1.5 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-colors text-sm font-medium">
                            <ICONS.Download size={16} />
                            <span>Export</span>
                        </button>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                    <SummaryCard
                        title="Total Transactions"
                        value={stats.total}
                        mainColor="blue"
                        icon={ICONS.Activity}
                        bottomLabel="In last 24 hours"
                    />
                    <SummaryCard
                        title="Flagged"
                        value={stats.flagged}
                        mainColor="red"
                        icon={ICONS.AlertTriangle}
                        trend="+2"
                        trendColor="red"
                        bottomLabel="Requires review"
                    />
                    <SummaryCard
                        title="Blocked"
                        value={stats.blocked}
                        mainColor="gray"
                        icon={ICONS.XCircle}
                        bottomLabel="High-risk prevented"
                    />
                    <SummaryCard
                        title="Total Volume"
                        value={stats.totalAmount}
                        mainColor="green"
                        icon={ICONS.DollarSign}
                        bottomLabel="Transaction value"
                    />
                </div>

                {/* Transaction Type Breakdown */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
                    <h2 className="text-lg font-semibold text-gray-900 mb-3">Transaction Types</h2>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                        {transactionTypes.map((type) => (
                            <div key={type.type} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                <div className="text-gray-600 text-xs mb-1 font-medium">{type.type}</div>
                                <div className="text-gray-900 font-bold text-lg">{type.count}</div>
                                <div className="text-gray-600 text-xs mt-1">{type.amount}</div>
                                <div className={`text-xs font-semibold mt-1 ${
                                    type.risk === 'Critical' ? 'text-red-600' : 
                                    type.risk === 'High' ? 'text-orange-600' : 
                                    type.risk === 'Medium' ? 'text-yellow-600' : 'text-green-600'
                                }`}>
                                    Risk: {type.risk}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Search and Filters */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
                    <div className="flex flex-col lg:flex-row gap-4">
                        <div className="flex-1 relative">
                            <ICONS.Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="Search by Transaction ID, Sender, or Recipient..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-300 rounded-lg pl-10 pr-4 py-2.5 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1A5276] focus:border-transparent"
                            />
                        </div>
                        <div className="flex gap-2 flex-wrap">
                            {['all', 'Wire Transfer', 'Crypto', 'ACH', 'SWIFT', 'Card'].map(type => (
                                <button
                                    key={type}
                                    onClick={() => setSelectedType(type)}
                                    className={`px-4 py-2.5 rounded-lg font-medium transition-all text-sm ${
                                        selectedType === type
                                            ? 'bg-[#1A5276] text-white shadow-md'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-300'
                                    }`}
                                >
                                    {type === 'all' ? 'All' : type}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Transaction List */}
                <div className="space-y-3">
                    {filteredTransactions.map((txn) => (
                        <div key={txn.id} className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 flex-wrap gap-2 mb-2">
                                        <span className="text-gray-900 font-semibold text-lg">{txn.id}</span>
                                        <span className={getStatusBadgeClasses(txn.status)}>
                                            {txn.status.toUpperCase()}
                                        </span>
                                        <span className="px-2.5 py-1 bg-purple-100 text-purple-700 border border-purple-300 rounded-full text-xs font-semibold">
                                            Risk: {txn.riskScore}
                                        </span>
                                    </div>
                                    <div className="flex items-center space-x-4 text-sm text-gray-600 flex-wrap">
                                        <span className="flex items-center">
                                            <ICONS.Clock size={14} className="mr-1" />
                                            {txn.timestamp}
                                        </span>
                                        <span className="flex items-center">
                                            <ICONS.MapPin size={14} className="mr-1" />
                                            {txn.location}
                                        </span>
                                        <span className="flex items-center">
                                            <ICONS.CreditCard size={14} className="mr-1" />
                                            {txn.paymentMethod}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="text-gray-600 text-xs mb-1 font-medium">Amount</div>
                                    <div className="text-gray-900 font-bold text-lg">{txn.amount}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="text-gray-600 text-xs mb-1 font-medium">Sender</div>
                                    <div className="text-gray-900 font-semibold text-sm">{txn.sender}</div>
                                    <div className="text-gray-500 text-xs">{txn.senderAccount}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="text-gray-600 text-xs mb-1 font-medium">Recipient</div>
                                    <div className="text-gray-900 font-semibold text-sm">{txn.recipient}</div>
                                    <div className="text-gray-500 text-xs">{txn.recipientAccount}</div>
                                </div>
                                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                                    <div className="text-gray-600 text-xs mb-1 font-medium">Type</div>
                                    <div className="text-gray-900 font-semibold text-sm">{txn.type}</div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button className="px-4 py-2 bg-[#1A5276] text-white rounded-lg hover:bg-[#001F3F] transition-all text-sm font-medium flex items-center space-x-1.5 cursor-pointer">
                                    <ICONS.Eye size={16} />
                                    <span>View Details</span>
                                </button>
                                {txn.status === 'Flagged' && (
                                    <button className="px-4 py-2 bg-red-100 text-red-700 border border-red-300 rounded-lg hover:bg-red-200 transition-all text-sm font-medium">
                                        Review Alert
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
    );
};
 
export default TransactionMonitor;