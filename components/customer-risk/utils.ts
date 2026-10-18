/**
 * Calculate account age from a date string
 * @param dateString - ISO date string
 * @returns Formatted account age (e.g., "5 days", "3 months", "2 years")
 */
export const calculateAccountAge = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 30) return `${diffDays} days`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months`;
  return `${Math.floor(diffDays / 365)} years`;
};

/**
 * Format currency amount with K/M suffix
 * @param amount - Numeric amount to format
 * @returns Formatted currency string (e.g., "$1.5M", "$250K", "$50")
 */
export const formatCurrency = (amount: number): string => {
  if (amount >= 1000000) return `$${(amount / 1000000).toFixed(1)}M`;
  if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
  return `$${amount}`;
};

/**
 * Capitalize and normalize risk level string
 * @param level - Risk level string (can be any case)
 * @returns Normalized risk level ('Critical' | 'High' | 'Medium' | 'Low')
 */
export const capitalizeRiskLevel = (
  level: string
): 'Critical' | 'High' | 'Medium' | 'Low' => {
  const normalized = level.toLowerCase();
  if (normalized === 'critical') return 'Critical';
  if (normalized === 'high') return 'High';
  if (normalized === 'medium') return 'Medium';
  return 'Low';
};

/**
 * Format KYC status from API response
 * @param status - KYC status from API (pending, complete, incomplete, etc.)
 * @returns Formatted KYC status string
 */
export const formatKYCStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    pending: 'Pending',
    complete: 'Complete',
    incomplete: 'Incomplete',
  };
  return statusMap[status.toLowerCase()] || 'Under Review';
};

/**
 * Format last activity date
 * @param dateString - ISO date string
 * @returns Formatted date string (MM/DD/YYYY HH:MM:SS)
 */
export const formatLastActivity = (dateString: string | null): string => {
  if (!dateString) return 'N/A';

  return new Date(dateString)
    .toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
    .replace(',', '');
};

/**
 * Format customer status from API response
 * @param status - Customer status from API (active, dormant, deactive, suspended)
 * @returns Formatted customer status string
 */
export const formatCustomerStatus = (status: string): string => {
  const statusMap: Record<string, string> = {
    active: 'Active',
    dormant: 'Dormant',
    deactive: 'Deactive',
    deactivated: 'Deactive',
    suspended: 'Suspended',
    pending: 'Pending',
  };
  return statusMap[status.toLowerCase()] || 'Active';
};

/**
 * Format created date from ISO string
 * @param dateString - ISO date string
 * @returns Formatted date string (e.g., "Jan 15, 2024")
 */
export const formatCreatedDate = (dateString: string | null): string => {
  if (!dateString) return 'N/A';

  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};
