import { getKYCAlertRecordById } from "@/actions/kyc.actions";
import KYCRecordDetail from "@/app/(dashboard)/kyc/alerts/[recordId]/components/KYCRecordDetail";
import { notFound } from "next/navigation";

interface KYCRecordPageProps {
  params: Promise<{
    recordId: string;
  }>;
}

export default async function KYCRecordPage({ params }: KYCRecordPageProps) {
  const { recordId } = await params;

  // Fetch initial data server-side
  const response = await getKYCAlertRecordById(recordId);

  if (!response.success || !response.data) {
    notFound();
  }

  return <KYCRecordDetail recordId={recordId} initialData={response.data} />;
}
