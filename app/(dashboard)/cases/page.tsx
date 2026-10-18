import { getCases, getCasesOverview } from '@/actions/cases.actions';
import { CaseFilters, CaseStatus, CaseCategory, CasePriority, RiskLevel, SortField, SortOrder } from '@/types/cases.types';
import MaintenanceNotice from '@/components/common/MaintenanceNotice';
import { CasePageClient } from '@/components/case';
import { Suspense } from 'react';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

// Force dynamic rendering to ensure searchParams changes are reflected
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    search?: string;
    status?: string;
    category?: string;
    priority?: string;
    assigned_for?: string;
    risk_level?: string;
    fromDate?: string;
    toDate?: string;
    sort?: string;
    order_by?: string;
  }>;
}

function LoadingState() {
  return (
    <div className="relative h-96">
      <LoadingOverlay loadingText="Loading cases..." />
    </div>
  );
}

export default async function CaseManagement({ searchParams }: PageProps) {
  // Await searchParams (Next.js 15+)
  const params = await searchParams;

  // Parse search params
  const currentPage = Number(params.page) || 1;
  const pageSize = Number(params.pageSize) || 10;

  // Build filters from search params
  const filters: CaseFilters = {};
  if (params.search) filters.search = params.search;
  if (params.status) filters.status = [params.status as CaseStatus];
  if (params.category) filters.category = [params.category as CaseCategory];
  if (params.priority) filters.priority = [params.priority as CasePriority];
  if (params.assigned_for)
    filters.assigned_for = [params.assigned_for];
  if (params.risk_level) filters.risk_level = [params.risk_level as RiskLevel];
  if (params.fromDate) filters.fromDate = params.fromDate;
  if (params.toDate) filters.toDate = params.toDate;
  if (params.sort) filters.sort = params.sort as SortField;
  if (params.order_by) filters.order_by = params.order_by as SortOrder;

  try {
    // Fetch data on the server
    const [casesResponse, overview] = await Promise.all([
      getCases(undefined, currentPage, pageSize, filters),
      getCasesOverview(),
    ]);

    const cases = casesResponse?.cases || [];
    const totalPages = casesResponse?.total_pages || 1;
    const totalRecords = casesResponse?.total || 0;

    return (
      <Suspense fallback={<LoadingState />}>
        <CasePageClient
          cases={cases}
          overview={overview}
          totalPages={totalPages}
          totalRecords={totalRecords}
          searchParams={params}
        />
      </Suspense>
    );
  } catch (error) {
    console.error("Error in CaseManagement page:", error);
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        <MaintenanceNotice />

        {/* NOTE: MAINTENANCENOTICE COMPONENT IS DISPLAYED TEMPORARILY FOR 
        CLIENT DEMO PURPOSES ONLY.
      REMOVE THIS AND UNCOMMENT THE ERROR UI BELOW FOR PRODUCTION. */}

        {/* <div className="text-center">
          <ICONS.AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 font-semibold mb-2">Error loading cases</p>
          <p className="text-muted-foreground">{error?.message || 'Failed to fetch data'}</p>
        </div> */}
      </div>
    );
  }
}
