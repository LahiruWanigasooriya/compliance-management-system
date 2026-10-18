import { getCaseById } from '@/actions/cases.actions';
import { CaseDetail } from '@/components/case/CaseDetail';
import { notFound } from 'next/navigation';
import type { Case } from '@/types/cases.types';

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CaseDetailsPage({ params }: PageProps) {
  const { id } = await params;

  // Fetch case data from API (server-side initial load)
  let caseData: Case | null = null;

  try {
    caseData = await getCaseById(id);
  } catch {
    // Handle error - will trigger notFound below
  }

  // Handle error or not found
  if (!caseData) {
    notFound();
  }

  return <CaseDetail caseId={id} initialData={caseData} />;
}
