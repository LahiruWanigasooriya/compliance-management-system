import { getRiskDashboardProfileById } from "@/actions/customer-risk.actions";
import CustomerProfileDetail from "@/components/customer-risk/CustomerProfileDetail";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CustomerProfilePage({ params }: PageProps) {
  const { id } = await params;

  // Fetch customer profile data from API (server-side initial load)
  const profileResponse = await getRiskDashboardProfileById(id);

  // Handle error or not found
  if (!profileResponse.success || !profileResponse.data.profile) {
    notFound();
  }

  return <CustomerProfileDetail profileId={id} initialData={profileResponse.data} />;
}
