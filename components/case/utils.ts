// Helper function to calculate time difference
export const getTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return '1d';
  if (diffDays < 30) return `${diffDays}d`;

  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo`;
};

// Helper function to format priority
export const formatPriority = (priority: string): string => {
  if (!priority) return 'N/A';
  return priority.charAt(0).toUpperCase() + priority.slice(1);
};

// Helper function to format status
export const formatStatus = (status: string): string => {
  if (!status) return 'N/A';
  return status
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
};

// Helper function to calculate SLA status
export const getSLAStatus = (
  slaEnds: string
): { status: string; color: string; isBreached: boolean } => {
  const now = new Date();
  const slaDate = new Date(slaEnds);
  const diffMs = slaDate.getTime() - now.getTime();

  if (diffMs < 0) {
    // SLA Breached
    const breachDuration = Math.abs(diffMs);
    const hours = Math.floor(breachDuration / (1000 * 60 * 60));
    const minutes = Math.floor(
      (breachDuration % (1000 * 60 * 60)) / (1000 * 60)
    );
    return {
      status: `SLA Breached (${hours}h ${minutes}m ago)`,
      color: 'text-red-600 dark:text-red-400',
      isBreached: true,
    };
  }

  // SLA Still Valid
  const hours = Math.floor(diffMs / (1000 * 60 * 60));
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  const days = Math.floor(hours / 24);

  let status = '';
  let color = 'text-green-600 dark:text-green-400';

  if (days > 0) {
    status = `${days}d ${hours % 24}h remaining`;
    color = 'text-green-600 dark:text-green-400';
  } else if (hours > 12) {
    status = `${hours}h ${minutes}m remaining`;
    color = 'text-green-600 dark:text-green-400';
  } else if (hours > 3) {
    status = `${hours}h ${minutes}m remaining`;
    color = 'text-yellow-600 dark:text-yellow-400';
  } else {
    status = `${hours}h ${minutes}m remaining`;
    color = 'text-orange-600 dark:text-orange-400';
  }

  return { status, color, isBreached: false };
};
