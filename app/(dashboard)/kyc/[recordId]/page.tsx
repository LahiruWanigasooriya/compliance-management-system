import { getKYCRequestById } from "@/actions/kyc.actions";
import KYCRequestDetails from "@/app/(dashboard)/kyc/components/KYCRequestDetails";
import { notFound } from "next/navigation";

interface KYCRequestPageProps {
  params: Promise<{ recordId: string }>;
}

export default async function KYCRequestPage({ params }: KYCRequestPageProps) {
  const { recordId } = await params;

  const response = await getKYCRequestById(recordId);

  if (!response.success || !response.data) {
    notFound();
  }

  return <KYCRequestDetails recordId={recordId} initialData={response.data} />;
}
