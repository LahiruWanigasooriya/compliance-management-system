"use client";

import { useState, useEffect } from "react";
import { Camera, Save, Trash2, X } from "lucide-react";
import { ProfileApiResponse, UserProfileState } from "@/types/profile.types";
import { STATUS_STYLES } from "@/constants/userProfile";
import { updateProfile, uploadProfileImage, deleteProfileImage } from "@/actions/profile.actions";
import { formatRoleName } from "@/utils/convertObjectKeysToCamelCase";
import { useAuth } from "../providers/auth.provider";

interface PersonalInfoProps {
  profileData: ProfileApiResponse;
}

export default function PersonalInfo({ profileData }: PersonalInfoProps) {
  const context = useAuth()
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // State for the form
  const [user, setUser] = useState<UserProfileState>({
    userId: "",
    username: "",
    firstName: "",
    lastName: "",
    email: "",
    contactNumber: "",
    status: "active",
    role: "",
    profileImage: null,
  });

  const [formData, setFormData] = useState<UserProfileState>(user);

  useEffect(() => {
    const fetchData = () => {
      try {
        // Split fullName into firstName and lastName
        const nameParts = profileData.fullName.split(" ");
        const firstName = nameParts[0] || "";
        const lastName = nameParts.slice(1).join(" ") || "";

        const mappedData: UserProfileState = {
          userId: profileData.id,
          username: profileData.email.split("@")[0],
          firstName: firstName,
          lastName: lastName,
          email: profileData.email,
          contactNumber: profileData.phone,
          status: profileData.status?.toLowerCase() || "active",
          role: formatRoleName(profileData.role?.roleName ?? "N/A"),
          profileImage: profileData.image || null,
        };

        setUser(mappedData);
        setFormData(mappedData);
      } catch (err) {
        console.error("Failed to load profile", err);
      }
    };

    fetchData();
  }, [profileData]);

  const currentStatusStyle =
    STATUS_STYLES[user.status] || STATUS_STYLES.pending;

  const getInitials = () => {
    if (!user.firstName) return "U";
    const first = user.firstName[0].toUpperCase();
    const last = user.lastName ? user.lastName[0].toUpperCase() : '';
    return first + last;
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/jpg", "image/png"];
    if (!allowedTypes.includes(file.type)) {
      setError("Only JPG and PNG images are allowed");
      return;
    }

    // Validate file size (e.g., max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      setError("Image size must be less than 5MB");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await uploadProfileImage(formData, !context.isSystemUser);

      if (response.success && response.data?.imageUrl) {
        // Update local state with new image URL
        const updatedUser = { ...user, profileImage: response.data.imageUrl };
        setUser(updatedUser);
        setFormData(updatedUser);
        showToast(response.message || "Profile picture updated successfully");
      } else {
        setError(response.message || "Failed to upload profile picture");
      }
    } catch (err) {
      console.error("Error uploading image:", err);
      setError("An unexpected error occurred while uploading");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRemoveImage = async () => {
    if (!user.profileImage) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await deleteProfileImage();

      if (response.success) {
        // Update local state to remove image
        const updatedUser = { ...user, profileImage: null };
        setUser(updatedUser);
        setFormData(updatedUser);
        showToast(response.message || "Profile picture removed successfully");
      } else {
        setError(response.message || "Failed to remove profile picture");
      }
    } catch (err) {
      console.error("Error removing image:", err);
      setError("An unexpected error occurred while removing image");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!formData.contactNumber.trim()) {
      setError("Required field cannot be empty");
      return;
    }
    const phoneRegex = /^[+]?[(]?[0-9]{3}[)]?[-\s.]?[0-9]{3}[-\s.]?[0-9]{4,6}$/;
    if (!phoneRegex.test(formData.contactNumber)) {
      setError("Invalid contact number format");
      return;
    }

    // Check if phone number actually changed
    if (formData.contactNumber === user.contactNumber) {
      showToast("No changes to save");
      setIsEditing(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      const response = await updateProfile({ phone: formData.contactNumber }, !context.isSystemUser);

      if (response.success) {
        // Update only the contact number in local state
        const updatedUser: UserProfileState = {
          ...user,
          contactNumber: formData.contactNumber,
        };

        setUser(updatedUser);
        setFormData(updatedUser);
        setIsEditing(false);
        showToast(response.message || "Contact number updated successfully");
      } else {
        setError(response.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Error updating profile:", err);
      setError("An unexpected error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  return (
    <>
      <div className="bg-card rounded-xl shadow-sm border border-panel-border p-4 sm:p-6">
        {toast && (
          <div className="fixed top-5 right-5 bg-green-600 text-white px-4 py-2 rounded shadow-lg animate-fade-in z-50">
            {toast}
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6">
          <h2 className="text-lg sm:text-xl font-semibold text-foreground">
            Profile Details
          </h2>

          <div className="flex items-center space-x-2 self-start sm:self-auto">
            {/* Status Badge */}
            <div
              className={`inline-flex items-center gap-2 px-2 sm:px-3 py-1 rounded-full ${currentStatusStyle.bg}`}
            >
              <span
                className={`h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full ${currentStatusStyle.dot}`}
              ></span>
              <span
                className={`text-[10px] sm:text-xs font-medium ${currentStatusStyle.text}`}
              >
                {currentStatusStyle.label}
              </span>
            </div>

            <span className="px-2 sm:px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-[10px] sm:text-xs font-medium">
              {user.role}
            </span>
          </div>
        </div>

        {/* Profile Image & Details */}
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="relative group">
            {/* Main Image Circle */}
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xl sm:text-2xl font-bold text-gray-500 dark:text-gray-300 border-2 border-gray-100 dark:border-gray-600">
              {user.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{getInitials()}</span>
              )}
            </div>
            {/* Upload Button */}
            <label className={`absolute bottom-0 right-0 bg-card border border-panel-border p-1.5 sm:p-2 rounded-full shadow-sm transition-colors z-10 ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800'
              }`}>
              <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground" />
              <input
                type="file"
                className="hidden"
                accept=".jpg,.png"
                onChange={handleImageUpload}
                disabled={isLoading}
              />
            </label>

            {/* Remove Button */}
            {user.profileImage && (
              <button
                onClick={handleRemoveImage}
                disabled={isLoading}
                title="Remove profile picture"
                className={`absolute top-0 right-0 bg-card border border-panel-border p-1.5 rounded-full shadow-sm transition-colors z-10 ${isLoading
                    ? 'opacity-50 cursor-not-allowed'
                    : 'cursor-pointer hover:bg-red-50 dark:hover:bg-red-900/30 hover:border-red-200 dark:hover:border-red-800 hover:text-red-600 dark:hover:text-red-400'
                  }`}
              >
                <Trash2 className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              </button>
            )}
          </div>

          {/* User Text Details */}
          <div className="text-center sm:text-left">
            <h3 className="text-base sm:text-lg font-bold text-foreground">
              {user.firstName} {user.lastName}
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {user.role}
            </p>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">
              User ID: {user.userId}
            </p>
          </div>
        </div>

        {/* Form Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">
              Username
            </label>
            <input
              disabled
              value={user.username}
              className="w-full p-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">
              Email Address
            </label>
            <input
              disabled
              value={user.email}
              className="w-full p-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">
              First Name
            </label>
            <input
              disabled
              value={user.firstName}
              className="w-full p-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase">
              Last Name
            </label>
            <input
              disabled
              value={user.lastName || "N/A"}
              className="w-full p-2 text-sm sm:text-base bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-gray-500 dark:text-gray-400 cursor-not-allowed"
            />
          </div>

          {/* Editable Contact Number */}
          <div className="space-y-1 md:col-span-2">
            <label className="text-[10px] sm:text-xs font-medium text-muted-foreground uppercase flex justify-between">
              Contact Number
              {error && (
                <span className="text-red-500 dark:text-red-400 normal-case">
                  {error}
                </span>
              )}
            </label>
            <input
              disabled={!isEditing}
              value={isEditing ? formData.contactNumber : user.contactNumber}
              onChange={(e) =>
                setFormData({ ...formData, contactNumber: e.target.value })
              }
              className={`w-full p-2 text-sm sm:text-base border rounded transition-colors ${isEditing
                  ? "bg-card border-blue-300 dark:border-blue-600 focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900 outline-none text-foreground"
                  : "bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-foreground"
                }`}
                placeholder="+1 (XXX) XXX-XXXX"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 sm:mt-8 flex flex-col-reverse sm:flex-row w-full justify-end gap-3">
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:space-x-3">
            {isEditing ? (
              <>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setFormData(user);
                    setError("");
                  }}
                  className="w-full sm:w-auto justify-center px-4 py-2 border border-panel-border rounded-lg text-foreground text-sm hover:bg-gray-50 dark:hover:bg-gray-800 flex items-center cursor-pointer"
                >
                  <X className="w-4 h-4 mr-2" /> Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="w-full sm:w-auto justify-center px-4 py-2 text-white rounded-lg text-sm bg-secondary hover:bg-gray-400 flex items-center cursor-pointer transition-all duration-250 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <>
                      <svg
                        className="animate-spin h-4 w-4 mr-2"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" /> Save Changes
                    </>
                  )}
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                className="w-full sm:w-auto justify-center px-4 py-2 border border-panel-border rounded-lg text-foreground text-sm hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
              >
                Edit Details
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}