import { getComplianceRiskDashboard } from '@/actions/dashboard.actions';
import DashboardPageClient from '@/components/dashboard/DashboardPageClient';
import MaintenanceNotice from '@/components/common/MaintenanceNotice';
import { Suspense } from 'react';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

// Force dynamic rendering to ensure data is fetched on each request
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoadingState() {
  return (
    <div className="relative h-96">
      <LoadingOverlay loadingText="Loading dashboard..." />
    </div>
  );
}

async function fetchDashboardData() {
  try {
    const response = await getComplianceRiskDashboard('24h');
    return { data: response.success ? response.data : null, error: null };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return { data: null, error };
  }
}

export default async function DashboardPage() {
  const { data, error } = await fetchDashboardData();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <MaintenanceNotice />
      </div>
    );
  }

  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardPageClient initialData={data} />
    </Suspense>
  );
}
