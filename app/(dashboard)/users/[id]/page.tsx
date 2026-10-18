import { getUserById } from "@/actions/user.actions";
import UserDetailsView from "@/components/user/UserDetailsView";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function UserDetailsPage({ params }: PageProps) {
  const { id } = await params;

  const response = await getUserById(id);

  if (!response.success || !response.data) {
    notFound();
  }

  return <UserDetailsView user={response.data} />;
}
