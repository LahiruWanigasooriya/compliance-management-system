import React from "react";
import { USER_PROFILE, STATUS_STYLES } from "../../../constants/userProfile";
import { ICONS } from "../../../constants/constants";
// import { ICONS } from "../constants/constants";

const UserProfile = () => {
  const { image, first_name, last_name, email, role, phone, status } =
    USER_PROFILE;
  const statusStyle = STATUS_STYLES[status] ||
    STATUS_STYLES.pending || {
      // final fallback to ensure statusStyle is never undefined (keeps TypeScript happy)
      bg: "",
      dot: "",
      text: "",
      label: status ?? "Unknown",
    };

  // Get initials from first and last name
  const getInitials = () => {
    const firstInitial = first_name?.charAt(0)?.toUpperCase() || "";
    const lastInitial = last_name?.charAt(0)?.toUpperCase() || "";
    return `${firstInitial}${lastInitial}`;
  };

  return (
    <div className="p-6 bg-background rounded-lg">
      <h1 className="text-2xl font-bold text-foreground mb-6">User Profile</h1>

      <div className="bg-card text-card-foreground border border-border rounded-xl p-6 max-w-2xl">
        {/* Profile Header */}
        <div className="flex items-center gap-6 pb-6 border-b border-border">
          {/* Profile Image or Initials */}
          {image ? (
            <img
              src={image}
              alt={`${first_name} ${last_name}`}
              className="h-24 w-24 rounded-full object-cover border-2 border-border"
            />
          ) : (
            <div className="h-24 w-24 rounded-full bg-muted border-2 border-border flex items-center justify-center">
              <span className="text-3xl font-bold text-foreground">
                {getInitials()}
              </span>
            </div>
          )}

          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {first_name} {last_name}
            </h2>
            <p className="text-muted-foreground text-sm mt-1">{role}</p>
            <div
              className={`inline-flex items-center gap-2 px-3 py-1 rounded-full mt-3 ${statusStyle.bg}`}
            >
              <span
                className={`h-2 w-2 rounded-full ${statusStyle.dot}`}
              ></span>
              <span className={`text-xs font-medium ${statusStyle.text}`}>
                {statusStyle.label}
              </span>
            </div>
          </div>
        </div>

        {/* Profile Details */}
        <div className="mt-6 space-y-4">
          {/* First Name */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <ICONS.User size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">First Name</p>
              <p className="text-foreground font-medium">{first_name}</p>
            </div>
          </div>

          {/* Last Name */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <ICONS.User size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Last Name</p>
              <p className="text-foreground font-medium">{last_name}</p>
            </div>
          </div>

          {/* Email */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <ICONS.Mail size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-foreground font-medium">{email}</p>
            </div>
          </div>

          {/* Role */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <ICONS.Shield size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Role</p>
              <p className="text-foreground font-medium">{role}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              {/* Phone icon (inline SVG) to avoid using a missing ICONS.Phone property */}
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-muted-foreground"
                aria-hidden="true"
              >
                <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.08 4.18 2 2 0 0 1 4 2h3a2 2 0 0 1 2 1.72c.12.98.37 1.93.76 2.82a2 2 0 0 1-.45 2.11L8.09 10.91a16 16 0 0 0 6 6l1.26-1.26a2 2 0 0 1 2.11-.45c.89.39 1.84.64 2.82.76A2 2 0 0 1 22 16.92z" />
              </svg>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Phone</p>
              <p className="text-foreground font-medium">{phone}</p>
            </div>
          </div>

          {/* Status */}
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center">
              <ICONS.Activity size={18} className="text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <div
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${statusStyle.bg}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${statusStyle.dot}`}
                ></span>
                <span className={`text-xs font-medium ${statusStyle.text}`}>
                  {statusStyle.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
