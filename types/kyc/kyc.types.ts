import { KycStatus } from "@/enums/kyc/kycStatus";
import { RiskProfile } from "../riskProfile.types";

export interface KYCStatusUpdatePayload {
  reference: string;
  status: KycStatus;
  reason?: string;
  warnings?: Record<string, unknown>;
}

export interface KYCOverview {
  total: number;
  pending: number;
  approved: number;
  highRisk: number;
  rejected: number;
  idVerified: number;
  addressVerified: number;
  faceVerified: number;
  rejections: number;
  totalAlerts: number;
  pendingAlerts: number;
  resolvedAlerts: number;
}

export interface KYCPreferences {
  id?: string;
  tenant_id?: string;
  approve_kyc_reasons?: string[];
  is_document_verification_required?: boolean;
  is_face_verification_required?: boolean;
  is_address_verification_required?: boolean;
  is_age_verification_required?: boolean;
  min_age?: number;
  max_age?: number;
  required_document_count?: number;
  critical_risk_score?: number;
  high_risk_score?: number;
  medium_risk_score?: number;
  supported_document_types?: string[];
  callback_url?: string;
  created_at?: string;
  updated_at?: string;
}

export interface KYCProofDocument {
  id: string;
  link: string;
}

export interface KYCProof {
  id: string;
  kycId: string;
  type: string;
  document: string;
  documentNumber: string;
  createdAt: string;
  status?: string;
  verified?: boolean;
}

export type WarningCategory = Record<string, string>;

export interface ImageVerificationWarnings {
  document: WarningCategory;
  address: WarningCategory;
  face: WarningCategory;
}

export interface KYCRecord {
  id: string;
  reference: string;
  forwardReference: string;
  riskProfile?: RiskProfile;
  tenantId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  dob: string;
  customerId?: string;
  fullAddress: string;
  idVerified: boolean;
  addressVerified: boolean;
  faceVerified: boolean;
  proofs: KYCProof[];
  email: string;
  declinedReason: string;
  otherReason: string;
  acceptedReason: string;
  warnings: ImageVerificationWarnings | null;
  callbackUrl: string;
  redirectUrl: string;
  status: KycStatus;
  location: string;
  identityHash: string;
  requiredDocumentCount: number;
  isFaceVerificationRequired: boolean;
  isAddressVerificationRequired: boolean;
  supportedDocumentTypes: string[];
  createdAt: string;
  updatedAt: string;
  alerts: any[] | null;
}

export interface KYCRecordsResponse {
  kyc: KYCRecord[];
  pagination: {
    limit: number;
    page: number;
    total: number;
    totalPages: number;
  };
}
