'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ICONS } from '@/constants/constants';
import { getRiskDashboardProfileById } from '@/actions/customer-risk.actions';
import PaginationControls, {
  getTotalPages,
} from '@/components/ui/PaginationControls';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

interface Transaction {
  id: number;
  type: string;
  amount: number;
  direction: 'incoming' | 'outgoing';
  status: 'completed' | 'flagged' | 'pending';
  date: string;
  reference: string;
  counterparty: string;
  country: string;
}

export default function TransactionsPage() {
  const router = useRouter();
  const params = useParams();
  const profileId = params.id as string;

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter((txn) => {
      if (filterStatus !== 'all' && txn.status !== filterStatus) return false;
      if (filterDirection !== 'all' && txn.direction !== filterDirection) return false;
      return true;
    });
  }, [transactions, filterStatus, filterDirection]);

  const totalPages = useMemo(
    () => getTotalPages(filteredTransactions.length, pageSize),
    [filteredTransactions.length, pageSize],
  );

  const paginatedTransactions = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredTransactions.slice(startIndex, startIndex + pageSize);
  }, [filteredTransactions, currentPage, pageSize]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(1);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getRiskDashboardProfileById(profileId);
        if (response.success && response.data) {
          setCustomerName(response.data.profile?.full_name || 'Customer');
          // TODO: Fetch transactions from API when endpoint is available
          // setTransactions(response.data.transactions || []);
        } else {
          setError('Failed to load customer data');
        }
      } catch (err) {
        setError('An error occurred while loading customer data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (profileId) {
      fetchData();
    }
  }, [profileId]);

  const toTitleCase = (str: string | null | undefined): string => {
    if (!str) return 'N/A';
    return str
      .toLowerCase()
      .split(' ')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    const months = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const hour12 = hours % 12 || 12;
    return `${months[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()} ${hour12}:${minutes} ${ampm}`;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
      flagged: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
      pending: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    };
    return styles[status as keyof typeof styles] || styles.pending;
  };

  const getDirectionBadge = (direction: string) => {
    return direction === 'incoming'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
      : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
  };

  // Calculate summary stats
  const totalIncoming = transactions
    .filter((t) => t.direction === 'incoming')
    .reduce((sum, t) => sum + t.amount, 0);
  const totalOutgoing = transactions
    .filter((t) => t.direction === 'outgoing')
    .reduce((sum, t) => sum + t.amount, 0);
  const flaggedCount = transactions.filter((t) => t.status === 'flagged').length;

  if (loading) {
    return (
      <div className="relative h-96">
        <LoadingOverlay loadingText="Loading transactions..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <ICONS.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-semibold mb-2">Error</p>
          <p className="text-muted-foreground">{error}</p>
          <button
            onClick={() => router.back()}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push(`/customer-risk/${profileId}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
          >
            <ICONS.ChevronLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Transaction History</h1>
            <p className="text-sm text-muted-foreground mt-1">
              {toTitleCase(customerName)} - {filteredTransactions.length} transaction
              {filteredTransactions.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-xl shadow p-4 border border-panel-border">
          <p className="text-sm text-muted-foreground">Total Transactions</p>
          <p className="text-2xl font-bold text-foreground">{transactions.length}</p>
        </div>
        <div className="bg-card rounded-xl shadow p-4 border border-panel-border">
          <p className="text-sm text-muted-foreground">Total Incoming</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalIncoming)}</p>
        </div>
        <div className="bg-card rounded-xl shadow p-4 border border-panel-border">
          <p className="text-sm text-muted-foreground">Total Outgoing</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalOutgoing)}</p>
        </div>
        <div className="bg-card rounded-xl shadow p-4 border border-panel-border">
          <p className="text-sm text-muted-foreground">Flagged Transactions</p>
          <p className="text-2xl font-bold text-yellow-600">{flaggedCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl shadow p-4 border border-panel-border mb-6">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Status:</label>
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-panel-border rounded-lg bg-background text-sm"
            >
              <option value="all">All</option>
              <option value="completed">Completed</option>
              <option value="flagged">Flagged</option>
              <option value="pending">Pending</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm text-muted-foreground">Direction:</label>
            <select
              value={filterDirection}
              onChange={(e) => {
                setFilterDirection(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-1.5 border border-panel-border rounded-lg bg-background text-sm"
            >
              <option value="all">All</option>
              <option value="incoming">Incoming</option>
              <option value="outgoing">Outgoing</option>
            </select>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-card rounded-xl shadow p-6 border border-panel-border">
        {filteredTransactions.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <ICONS.Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No transactions found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-panel-border">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Date
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Type
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Reference
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Counterparty
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-foreground">
                    Country
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                    Direction
                  </th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-foreground">
                    Amount
                  </th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-foreground">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((txn) => (
                  <tr
                    key={txn.id}
                    className="border-b border-panel-border hover:bg-gray-50 dark:hover:bg-slate-800 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <span className="text-sm text-foreground">
                        {formatDate(txn.date)}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm font-medium text-foreground">
                        {txn.type}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground font-mono">
                        {txn.reference}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-foreground">
                        {txn.counterparty}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">
                        {txn.country}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getDirectionBadge(
                          txn.direction,
                        )}`}
                      >
                        {txn.direction === 'incoming' ? (
                          <ICONS.TrendingDown size={12} className="mr-1" />
                        ) : (
                          <ICONS.TrendingUp size={12} className="mr-1" />
                        )}
                        {toTitleCase(txn.direction)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span
                        className={`text-sm font-semibold ${
                          txn.direction === 'incoming'
                            ? 'text-green-600'
                            : 'text-red-600'
                        }`}
                      >
                        {txn.direction === 'incoming' ? '+' : '-'}
                        {formatCurrency(txn.amount)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                          txn.status,
                        )}`}
                      >
                        {toTitleCase(txn.status)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {filteredTransactions.length > 0 && (
          <PaginationControls
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            totalRecords={filteredTransactions.length}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            pageSizeOptions={[10, 20, 50]}
          />
        )}
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-start gap-2">
          <ICONS.Info
            size={18}
            className="text-blue-600 dark:text-blue-400 mt-0.5"
          />
          <div className="text-sm text-blue-800 dark:text-blue-200">
            <p className="font-semibold mb-1">About Transaction History</p>
            <p>
              This page displays all recorded transactions for this customer profile.
              Flagged transactions have been identified for potential compliance review
              based on amount thresholds, unusual patterns, or high-risk jurisdictions.
              Use the filters above to narrow down your search.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
