"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import EditUserForm from "@/components/user/EditUserForm";
import { getUserById } from "@/actions/user.actions";
import { User } from "@/types/user.types";
import LoadingOverlay from "@/components/layout/LoadingOverlay";

export default function EditUserPage() {
  const params = useParams();
  const router = useRouter();
  
  // State to hold fetched data
  const [userData, setUserData] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data on mount
  useEffect(() => {
    const fetchUser = async () => {
      // Safety check for ID
      if (!params.id) return;
      const userId = Array.isArray(params.id) ? params.id[0] : params.id;

      setIsLoading(true);
      try {
        const response = await getUserById(userId);
        if (response.success && response.data) {
          setUserData(response.data);
        } else {
          setError(response.message || "User not found");
        }
      } catch (err) {
        console.error(err);
        setError("An unexpected error occurred");
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id]);

  // Handlers
  const handleSuccess = () => {
    router.push("/user"); // Or "/config"
  };

  const handleCancel = () => {
    router.back();
  };

  // 1. Loading State
  if (isLoading) {
    return (
      <div className="relative h-[50vh] w-full">
        <LoadingOverlay loadingText="Loading user details..." />
      </div>
    );
  }

  // 2. Error State
  if (error || !userData) {
    return (
      <div className="flex h-[50vh] w-full flex-col items-center justify-center text-red-500">
        <p className="text-lg font-semibold">Error: {error || "User not found"}</p>
        <button 
          onClick={handleCancel}
          className="mt-4 text-sm text-gray-600 underline hover:text-gray-900"
        >
          Go Back
        </button>
      </div>
    );
  }

  // 3. Render Form
  return (
    <main className="p-6">
      <div className="mx-auto w-full space-y-6">
        <EditUserForm 
          userData={userData} 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </div>
    </main>
  );
}