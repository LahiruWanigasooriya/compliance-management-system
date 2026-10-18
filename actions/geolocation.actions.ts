"use server"
import { Response } from "@/types/response.types";
import {
  GeoAlert,
  GeoAlertMetrics,
  GeoAlertsResponse,
  GeoAlertUpdateResponse,
  GeoLocationRecord,
  GeoLogsResponse,
  GeoRecordsResponse,
  GetGeoParams,
  GeoJurisdictionsResponse,
  LocationRequest,
  CreateLocationRequestInput,
  CreateLocationRequestResponse,
  LocationRequestListResponse,
  LocationRequestFilters,
  GeoAlertNotes,
} from "@/types/geolocation.types";
import { GetDownloadReportParams } from "@/types/common.types";
import { auth, createServerAxios } from "@/utils/axios_server";

export async function getGeoAlertMetrics(timeRange: string = "30d"): Promise<Response<GeoAlertMetrics>> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get("api/v1/alerts/metrics", {
      params: { time_range: timeRange }
    });
    return {
      success: true,
      data: response.data,
      message: "Geolocation alert metrics fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching geolocation alert metrics:", error);
    return {
      success: false,
      data: {} as GeoAlertMetrics,
      message:
        error instanceof Error ? error.message : "Failed to fetch Geo alert metrics",
    };
  }
}

export async function getGeoAlerts(params?: GetGeoParams): Promise<Response<GeoAlertsResponse>> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get("api/v1/alerts", { params });
    return {
      success: true,
      data: response.data,
      message: "Geolocation alerts fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching geolocation alerts:", error);
    return {
      success: false,
      data: {} as GeoAlertsResponse,
      message:
        error instanceof Error ? error.message : "Failed to fetch Geo alerts",
    }
  }
}

export async function getGeoAlertById(id: string): Promise<Response<GeoAlert>> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get(`api/v1/alerts/${id}`);
    return {
      success: true,
      data: response.data,
      message: "Geo alert fetched successfully by id",
    }
  } catch (error) {
    console.error("Error fetching geolocation alert by id:", error);
    return {
      success: false,
      data: {} as GeoAlert,
      message:
        error instanceof Error ? error.message : "Failed to fetch Geo alert by id",
    }
  }
}

export async function updateGeoAlertStatus(id: string, status: string): Promise<Response<GeoAlertUpdateResponse>>{
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.patch(`api/v1/alerts/${id}`, {status});
    return {
      success: true,
      data: response.data,
      message: "Geo alert updated successfully",
    }
  } catch (error) {
    console.error("Error updating geo alert", error);
    return {
      success: false,
      data: {} as GeoAlertUpdateResponse,
      message:
        error instanceof Error ? error.message : "Failed to update Geo alert by id",
    }
  }
}

export async function updateGeoAlertAction (alertId: string, action: string, notes: GeoAlertNotes): Promise<Response<GeoAlertUpdateResponse>> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    let requestBody: Record<string, any> = {};
    switch(action) {
      case "close":
        requestBody = {
          notes: notes.reason?.trim() || ""
        }
        break;
      case "resolve":
        requestBody = {
          resolution: notes.resolution,
          notes: notes.reason?.trim() || "",
        };
        break;
      case "escalate":
        requestBody = {
          new_assignee: notes.assignee,
          notes: notes.reason?.trim() || "",
        };
        break;
    }
    
    
    const response = await axiosInstance.post("api/v1/alerts/", requestBody, {
      params: {
        id: alertId,
        action: action
      }
    });
    return {
      success: true,
      data: response.data,
      message: "Geo alert updated successfully",
    }
  } catch (error) {
    console.error("Error updating geo alert", error);
    return {
      success: false,
      data: {} as GeoAlertUpdateResponse,
      message:
        error instanceof Error ? error.message : "Failed to update Geo alert by id",
    }
  }
};

export async function getGeoLocationRecords(params?: GetGeoParams): Promise<Response<GeoRecordsResponse>> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get("api/v1/geo/map", { params });
    return {
      success: true,
      data: response.data,
      message: "Geolocation records fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching geolocation records:", error);
    return {
      success: false,
      data: {} as GeoRecordsResponse,
      message:
        error instanceof Error ? error.message : "Failed to fetch Geo records",
    }
  }
}

export async function getGeoLocationRecordsById (recordId: string): Promise<Response<GeoLocationRecord>> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get(`api/v1/geo/records/${recordId}`);
    return {
      success: true,
      data: response.data,
      message: "Geo location record fetched successfully",
    }
  } catch (error) {
    console.error("Error fetching location records by id: ", error);
    return {
      success: false,
      data: {} as GeoLocationRecord,
      message:
        error instanceof Error ? error.message : "Failed to fetch location records by id",
    }
  }
}

export async function downloadAllGeoAlertsReport (
  params?: GetDownloadReportParams,
): Promise<Blob> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get('api/v1/alerts/export', {
      params,
      responseType: "arraybuffer",
    });
    const contentType =
    response.headers["content-type"] || "application/pdf";

    return new Blob([response.data], { type: contentType });
  } catch (error) {
    console.error("Error downloading all geo alert reports:", error);
    throw error;
  }
};

export async function downloadAllGeoAuditLogsReport (
  params?: GetDownloadReportParams,
): Promise<Blob> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get('api/v1/audit-logs/export', {
      params,
      responseType: "arraybuffer",
    });
    const contentType =
    response.headers["content-type"] || "application/pdf";

    return new Blob([response.data], { type: contentType });
  } catch (error) {
    console.error("Error downloading all geo audit log reports:", error);
    throw error;
  }
};

export async function getGeoLogs(params?: GetGeoParams): Promise<Response<GeoLogsResponse>> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get("api/v1/geo/audit-logs", {params});
    return {
      success: true,
      data: response.data,
      message: "Geolocation logs fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching geolocation logs:", error);
    return {
      success: false,
      data: {} as GeoLogsResponse,
      message:
        error instanceof Error ? error.message : "Failed to fetch Geo logs",
    }
  }
}

export async function getGeoJurisdictions(): Promise<Response<GeoJurisdictionsResponse>> {
  try {
    const session = await auth()

    console.log("Session in ssr:", session);
    const axiosInstance = createServerAxios(session?.accessToken as string, session?.user?.tenant_id as string , session?.user?.user_type);
    const response = await axiosInstance.get("api/v1/jurisdictions");
    return {
      success: true,
      data: response.data,
      message: "Geolocation jurisdictions fetched successfully",
    };
  } catch (error) {
    console.error("Error fetching geolocation jurisdictions:", error);
    return {
      success: false,
      data: {} as GeoJurisdictionsResponse,
      message:
        error instanceof Error ? error.message : "Failed to fetch Geo jurisdictions",
    }
  }
}

// ============================================================================
// Location Request Actions
// ============================================================================

export async function createLocationRequest(
  input: CreateLocationRequestInput
): Promise<Response<CreateLocationRequestResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string ,
      session?.user?.user_type
    );

    const response = await axiosInstance.post("api/v1/location-requests", input);
    return {
      success: true,
      data: response.data,
      message: "Location request created successfully",
    };
  } catch (error: any) {
    console.error("Error creating location request:", error);
    return {
      success: false,
      data: {} as CreateLocationRequestResponse,
      message: error.response?.data?.error || error.message || "Failed to create location request",
    };
  }
}

export async function getLocationRequests(
  filters?: LocationRequestFilters
): Promise<Response<LocationRequestListResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string ,
      session?.user?.user_type
    );

    const response = await axiosInstance.get("api/v1/location-requests", { params: filters });
    return {
      success: true,
      data: response.data,
      message: "Location requests fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching location requests:", error);
    return {
      success: false,
      data: {} as LocationRequestListResponse,
      message: error.response?.data?.error || error.message || "Failed to fetch location requests",
    };
  }
}

export async function getLocationRequestById(
  requestId: string
): Promise<Response<LocationRequest>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string ,
      session?.user?.user_type
    );

    const response = await axiosInstance.get(`api/v1/location-requests/${requestId}`);
    return {
      success: true,
      data: response.data,
      message: "Location request fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching location request:", error);
    return {
      success: false,
      data: {} as LocationRequest,
      message: error.response?.data?.error || error.message || "Failed to fetch location request",
    };
  }
}

export async function cancelLocationRequest(
  requestId: string
): Promise<Response<{ message: string }>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string ,
      session?.user?.user_type
    );

    const response = await axiosInstance.post(`api/v1/location-requests/${requestId}/cancel`);
    return {
      success: true,
      data: response.data,
      message: "Location request cancelled successfully",
    };
  } catch (error: any) {
    console.error("Error cancelling location request:", error);
    return {
      success: false,
      data: { message: "" },
      message: error.response?.data?.error || error.message || "Failed to cancel location request",
    };
  }
}

export async function resendLocationRequest(
  requestId: string,
  contact: { email?: string; phone?: string }
): Promise<Response<{ message: string }>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string ,
      session?.user?.user_type
    );

    const response = await axiosInstance.post(`api/v1/location-requests/${requestId}/resend`, contact);
    return {
      success: true,
      data: response.data,
      message: "Location request notification resent successfully",
    };
  } catch (error: any) {
    console.error("Error resending location request:", error);
    return {
      success: false,
      data: { message: "" },
      message: error.response?.data?.error || error.message || "Failed to resend location request",
    };
  }
}

// ============================================================================
// Geofence Rules Actions
// ============================================================================

import {
  GeofenceRule,
  GeofenceRulesResponse,
  CreateGeofenceRuleInput,
  UpdateGeofenceRuleInput,
  TestGeofenceRuleInput,
  TestGeofenceRuleResponse,
  CreateJurisdictionInput,
  UpdateJurisdictionInput,
  GeoJurisdiction,
  SanctionsListResponse,
  SanctionsScreenResponse,
} from "@/types/geolocation.types";

export async function getGeofenceRules(params?: { active?: boolean; sort_by?: string }): Promise<Response<GeofenceRulesResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.get("api/v1/geofence-rules", { params });
    return {
      success: true,
      data: response.data,
      message: "Geofence rules fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching geofence rules:", error);
    return {
      success: false,
      data: {} as GeofenceRulesResponse,
      message: error.response?.data?.error || error.message || "Failed to fetch geofence rules",
    };
  }
}

export async function getGeofenceRuleById(ruleId: string): Promise<Response<GeofenceRule>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.get("api/v1/geofence-rules/", { params: { id: ruleId } });
    return {
      success: true,
      data: response.data,
      message: "Geofence rule fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching geofence rule:", error);
    return {
      success: false,
      data: {} as GeofenceRule,
      message: error.response?.data?.error || error.message || "Failed to fetch geofence rule",
    };
  }
}

export async function createGeofenceRule(input: CreateGeofenceRuleInput): Promise<Response<GeofenceRule>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.post("api/v1/geofence-rules", input);
    return {
      success: true,
      data: response.data,
      message: "Geofence rule created successfully",
    };
  } catch (error: any) {
    console.error("Error creating geofence rule:", error);
    return {
      success: false,
      data: {} as GeofenceRule,
      message: error.response?.data?.error || error.message || "Failed to create geofence rule",
    };
  }
}

export async function updateGeofenceRule(ruleId: string, input: UpdateGeofenceRuleInput): Promise<Response<GeofenceRule>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.patch("api/v1/geofence-rules/", input, { params: { id: ruleId } });
    return {
      success: true,
      data: response.data,
      message: "Geofence rule updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating geofence rule:", error);
    return {
      success: false,
      data: {} as GeofenceRule,
      message: error.response?.data?.error || error.message || "Failed to update geofence rule",
    };
  }
}

export async function deleteGeofenceRule(ruleId: string): Promise<Response<{ message: string }>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.delete("api/v1/geofence-rules/", { params: { id: ruleId } });
    return {
      success: true,
      data: response.data,
      message: "Geofence rule deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting geofence rule:", error);
    return {
      success: false,
      data: { message: "" },
      message: error.response?.data?.error || error.message || "Failed to delete geofence rule",
    };
  }
}

export async function activateGeofenceRule(ruleId: string): Promise<Response<GeofenceRule>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.post("api/v1/geofence-rules/", {}, { params: { id: ruleId, action: "activate" } });
    return {
      success: true,
      data: response.data,
      message: "Geofence rule activated successfully",
    };
  } catch (error: any) {
    console.error("Error activating geofence rule:", error);
    return {
      success: false,
      data: {} as GeofenceRule,
      message: error.response?.data?.error || error.message || "Failed to activate geofence rule",
    };
  }
}

export async function deactivateGeofenceRule(ruleId: string): Promise<Response<GeofenceRule>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.post("api/v1/geofence-rules/", {}, { params: { id: ruleId, action: "deactivate" } });
    return {
      success: true,
      data: response.data,
      message: "Geofence rule deactivated successfully",
    };
  } catch (error: any) {
    console.error("Error deactivating geofence rule:", error);
    return {
      success: false,
      data: {} as GeofenceRule,
      message: error.response?.data?.error || error.message || "Failed to deactivate geofence rule",
    };
  }
}

export async function testGeofenceRule(ruleId: string, input: TestGeofenceRuleInput): Promise<Response<TestGeofenceRuleResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.post("api/v1/geofence-rules/", input, { params: { id: ruleId, action: "test" } });
    return {
      success: true,
      data: response.data,
      message: "Geofence rule test completed",
    };
  } catch (error: any) {
    console.error("Error testing geofence rule:", error);
    return {
      success: false,
      data: {} as TestGeofenceRuleResponse,
      message: error.response?.data?.error || error.message || "Failed to test geofence rule",
    };
  }
}

// ============================================================================
// Jurisdiction CRUD Actions
// ============================================================================

export async function createJurisdiction(input: CreateJurisdictionInput): Promise<Response<GeoJurisdiction>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.post("api/v1/jurisdictions", input);
    return {
      success: true,
      data: response.data,
      message: "Jurisdiction created successfully",
    };
  } catch (error: any) {
    console.error("Error creating jurisdiction:", error);
    return {
      success: false,
      data: {} as GeoJurisdiction,
      message: error.response?.data?.error || error.message || "Failed to create jurisdiction",
    };
  }
}

export async function updateJurisdiction(jurisdictionId: string, input: UpdateJurisdictionInput): Promise<Response<GeoJurisdiction>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.patch("api/v1/jurisdictions/", input, { params: { id: jurisdictionId } });
    return {
      success: true,
      data: response.data,
      message: "Jurisdiction updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating jurisdiction:", error);
    return {
      success: false,
      data: {} as GeoJurisdiction,
      message: error.response?.data?.error || error.message || "Failed to update jurisdiction",
    };
  }
}

export async function deleteJurisdiction(jurisdictionId: string): Promise<Response<{ message: string }>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.delete("api/v1/jurisdictions/", { params: { id: jurisdictionId } });
    return {
      success: true,
      data: response.data,
      message: "Jurisdiction deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting jurisdiction:", error);
    return {
      success: false,
      data: { message: "" },
      message: error.response?.data?.error || error.message || "Failed to delete jurisdiction",
    };
  }
}

// ============================================================================
// Sanctions Actions
// ============================================================================

export async function getSanctionsList(): Promise<Response<SanctionsListResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.get("api/v1/sanctions/list");
    return {
      success: true,
      data: response.data,
      message: "Sanctions list fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching sanctions list:", error);
    return {
      success: false,
      data: {} as SanctionsListResponse,
      message: error.response?.data?.error || error.message || "Failed to fetch sanctions list",
    };
  }
}

export async function screenCountryForSanctions(countryIso: string): Promise<Response<SanctionsScreenResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.get("api/v1/sanctions/screen", { params: { country: countryIso } });
    return {
      success: true,
      data: response.data,
      message: "Country screening completed",
    };
  } catch (error: any) {
    console.error("Error screening country:", error);
    return {
      success: false,
      data: {} as SanctionsScreenResponse,
      message: error.response?.data?.error || error.message || "Failed to screen country",
    };
  }
}

// ============================================================================
// Sanctions CRUD Actions
// ============================================================================

import {
  SanctionedCountryRecord,
  SanctionedCountriesResponse,
  CreateSanctionInput,
  UpdateSanctionInput,
} from "@/types/geolocation.types";

export async function getSanctions(params?: {
  country_iso?: string;
  source?: string;
  level?: string;
  is_active?: boolean;
  page?: number;
  limit?: number;
}): Promise<Response<SanctionedCountriesResponse>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.get("api/v1/sanctions", { params });
    return {
      success: true,
      data: response.data,
      message: "Sanctions fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching sanctions:", error);
    return {
      success: false,
      data: {} as SanctionedCountriesResponse,
      message: error.response?.data?.error || error.message || "Failed to fetch sanctions",
    };
  }
}

export async function getSanctionById(sanctionId: string): Promise<Response<SanctionedCountryRecord>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.get(`api/v1/sanctions/${sanctionId}`);
    return {
      success: true,
      data: response.data,
      message: "Sanction fetched successfully",
    };
  } catch (error: any) {
    console.error("Error fetching sanction:", error);
    return {
      success: false,
      data: {} as SanctionedCountryRecord,
      message: error.response?.data?.error || error.message || "Failed to fetch sanction",
    };
  }
}

export async function createSanction(input: CreateSanctionInput): Promise<Response<SanctionedCountryRecord>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.post("api/v1/sanctions", input);
    return {
      success: true,
      data: response.data,
      message: "Sanction created successfully",
    };
  } catch (error: any) {
    console.error("Error creating sanction:", error);
    return {
      success: false,
      data: {} as SanctionedCountryRecord,
      message: error.response?.data?.error || error.message || "Failed to create sanction",
    };
  }
}

export async function updateSanction(sanctionId: string, input: UpdateSanctionInput): Promise<Response<SanctionedCountryRecord>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.put(`api/v1/sanctions/${sanctionId}`, input);
    return {
      success: true,
      data: response.data,
      message: "Sanction updated successfully",
    };
  } catch (error: any) {
    console.error("Error updating sanction:", error);
    return {
      success: false,
      data: {} as SanctionedCountryRecord,
      message: error.response?.data?.error || error.message || "Failed to update sanction",
    };
  }
}

export async function deleteSanction(sanctionId: string): Promise<Response<{ message: string }>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.delete(`api/v1/sanctions/${sanctionId}`);
    return {
      success: true,
      data: response.data,
      message: "Sanction deleted successfully",
    };
  } catch (error: any) {
    console.error("Error deleting sanction:", error);
    return {
      success: false,
      data: { message: "" },
      message: error.response?.data?.error || error.message || "Failed to delete sanction",
    };
  }
}

export async function bulkCreateSanctions(sanctions: CreateSanctionInput[]): Promise<Response<{ message: string; count: number }>> {
  try {
    const session = await auth();
    const axiosInstance = createServerAxios(
      session?.accessToken as string,
      session?.user?.tenant_id as string,
      session?.user?.user_type
    );

    const response = await axiosInstance.post("api/v1/sanctions/bulk", { sanctions });
    return {
      success: true,
      data: response.data,
      message: "Sanctions created successfully",
    };
  } catch (error: any) {
    console.error("Error bulk creating sanctions:", error);
    return {
      success: false,
      data: { message: "", count: 0 },
      message: error.response?.data?.error || error.message || "Failed to bulk create sanctions",
    };
  }
}
