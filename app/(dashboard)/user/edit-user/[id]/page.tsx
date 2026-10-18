import React from "react";
import { notFound } from "next/navigation";
import EditUserForm from "@/components/user/EditUserForm";
import { getUserById } from "@/actions/user.actions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditUserPage({ params }: PageProps) {
  // 2. Await the params to correctly extract the ID
  const { id } = await params;

  // 3. Fetch the user from the API (Server Side)
  // We pass 'undefined' for tenantId unless you have a specific way to get it here
  const response = await getUserById(id);

  // 4. Handle Not Found or Error
  if (!response.success || !response.data) {
    // If the API returns a 404 or fails, show the Next.js Not Found page
    return notFound();
  }

  // 5. Render the form with the real API data
  return (
    <div className="p-6">
      <EditUserForm userData={response.data} onCancel={()=>{}} onSuccess={()=>{}}  />
    </div>
  );
}
