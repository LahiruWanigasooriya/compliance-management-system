"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight } from "lucide-react";
import AddUserForm from "@/components/user/AddUserForm";

export default function AddUserPage() {
  const router = useRouter();

  // Redirect to the main list on success
  const handleSuccess = () => {
    router.push("/user"); // Or "/config" if that's where your list is
  };

  // Go back to previous page on cancel
  const handleCancel = () => {
    router.back();
  };

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto w-full space-y-6">
        {/* Header & Breadcrumb */}
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-foreground">Add New User</h1>
          <nav className="flex items-center gap-1 text-sm text-primary-foreground">
            <Link
              href="/user"
              className="hover:text-gray-900 transition-colors"
            >
              User Management
            </Link>
            <ChevronRight size={16} />
            <span className="text-primary-foreground font-medium">
              Add User
            </span>
          </nav>
        </div>

        {/* Form Component with required props */}
        <AddUserForm 
          onSuccess={handleSuccess} 
          onCancel={handleCancel} 
        />
      </div>
    </main>
  );
}