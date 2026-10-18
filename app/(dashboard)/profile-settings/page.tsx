import { ICONS } from "@/constants/constants";
import { getProfile } from "@/actions/profile.actions";
import SettingsPageClient from "../../../components/profile-settings/SettingsPageClient";
import LoadingOverlay from "@/components/layout/LoadingOverlay";
// import MaintenanceNotice from "@/components/common/MaintenanceNotice";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const profileResponse = await getProfile();

  if (!profileResponse.success || !profileResponse.data) {
    return (
      <div className="flex items-center justify-center min-h-[80vh]">
        {/* <MaintenanceNotice /> */}

        Loading...

        {/* NOTE: MAINTENANCENOTICE COMPONENT IS DISPLAYED TEMPORARILY FOR CLIENT DEMO PURPOSES ONLY. 
      REMOVE THIS AND UNCOMMENT THE ERROR UI BELOW FOR PRODUCTION. */}

        {/* <div className="bg-red-50 border border-red-200 rounded-xl p-6 max-w-md">
          <div className="flex items-center space-x-3 mb-3">
            <ICONS.AlertTriangle className="text-red-600" size={24} />
            <h2 className="text-lg font-semibold text-red-900">
              Error Loading Profile
            </h2>
          </div>
          <p className="text-red-700">
            {profileResponse.message || "Failed to load profile"}
          </p>
        </div> */}
      </div>
    );
  }

  return <SettingsPageClient profileData={profileResponse.data} />;
}
