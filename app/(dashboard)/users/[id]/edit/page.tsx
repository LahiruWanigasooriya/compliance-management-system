"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter, notFound } from "next/navigation";
import EditUserForm from "@/components/user/EditUserForm";
import { getUserById } from "@/actions/user.actions";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { User } from "@/types/user.types";
import LoadingOverlay from "@/components/layout/LoadingOverlay";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await getUserById(id);
        if (response.success && response.data) {
          setUser(response.data);
        } else {
          setError(true);
        }
      } catch (err) {
        console.error("Failed to fetch user:", err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchUser();
    }
  }, [id]);

  const handleSuccess = () => {
    router.push(`/users/${id}`);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingOverlay loadingText="Loading user..." />
      </div>
    );
  }

  if (error || !user) {
    return notFound();
  }

  return (
    <div className="min-h-screen">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
        <Link href="/config" className="hover:text-foreground transition-colors">
          Settings
        </Link>
        <ChevronRight size={14} />
        <Link href="/config" className="hover:text-foreground transition-colors">
          User Management
        </Link>
        <ChevronRight size={14} />
        <Link
          href={`/users/${id}`}
          className="hover:text-foreground transition-colors"
        >
          {user.name || "User"}
        </Link>
        <ChevronRight size={14} />
        <span className="text-foreground font-medium">Edit</span>
      </nav>

      <EditUserForm
        userData={user}
        onCancel={handleCancel}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
