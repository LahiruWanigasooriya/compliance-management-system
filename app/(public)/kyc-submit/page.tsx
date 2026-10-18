import { Suspense } from 'react';
import KycSubmitForm from '@/components/kyc/KycSubmitForm';

function KycSubmitLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-primary to-secondary dark:from-gray-900 dark:to-gray-800">
      <div className="animate-pulse text-white text-lg">Loading KYC Form...</div>
    </div>
  );
}

export default function KycSubmitPage() {
  return (
    <Suspense fallback={<KycSubmitLoader />}>
      <KycSubmitForm />
    </Suspense>
  );
}
