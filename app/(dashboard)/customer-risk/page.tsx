import { CustomerRiskPageClient } from '@/components/customer-risk';
import { Suspense } from 'react';
import LoadingOverlay from '@/components/layout/LoadingOverlay';

// Force dynamic rendering to ensure searchParams changes are reflected
export const dynamic = 'force-dynamic';
export const revalidate = 0;

function LoadingState() {
  return (
    <div className="relative h-96">
      <LoadingOverlay loadingText="Loading customer risk profiles..." />
    </div>
  );
}

export default async function CustomerRisk() {
  return (
    <Suspense fallback={<LoadingState />}>
      <CustomerRiskPageClient />
    </Suspense>
  );
}
