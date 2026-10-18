/* eslint-disable @typescript-eslint/no-empty-object-type */
import { AssignedUser } from "../user.types";
import { Entity as ExternalEntity } from "./externalHits";
import { Entity as InternalEntity } from "./internalHits";

export interface InternalWatchlistEntry {
  id: string;
  tenantId: string;
  customerId: string;
  firstName: string;
  middleName: string;
  lastName: string;
  fullName: string;
  dob: string;
  nationality: string;
  country: string;
  identificationNumber: string;
  reason: string;
  riskLevel: string;
  category: string;
  notes: string;
  addedBy: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  expiresAt: string;
  isActive: boolean;
  metadata: string;
  createdAt: string;
  updatedAt: string;
}

export interface Screening {
  addedDate: string;
  assignFor?: string;
  assignUser?: AssignedUser;
  category: string;
  categoryDisplay: string;
  customerId: string;
  country: string;
  entityType: string;
  firstName: string;
  fullName: string;
  id: string;
  lastMatch: string;
  lastName: string;
  matchCount: number;
  name: string;
  notes: string;
  reference: string;
  reviewStatus: string;
  riskLevel: string;
  status: string;
}

export interface ExtendedScreening extends Screening {
  middleName?: string;
  dob?: string;
  event?: string;
  filters?: string[];
  declinedReason?: string;
  declinedCodes?: string[];
  totalHits?: number;
  hitsCount?: number;
  externalHitsCount?: number;
  internalHitsCount?: number;
  countries?: string[];
  allHits: {
    external: ExternalEntity[];
    internal: InternalEntity[];
  };
  internalWatchlist: {
    hasMatches: boolean;
    matchCount: number;
    matches: any[];
  };
  responseData: {
    externalScreening: {
      country: string | null;
      event: string;
      info: {
        agent: {
          browserName: string;
          deviceName: string;
          isDesktop: boolean;
          isPhone: boolean;
          platformName: string;
          useragent: string;
        };
        geolocation: {
          city: string;
          countryCode: string;
          countryName: string;
          currency: string;
          host: string;
          ip: string;
          latitude: string;
          longitude: string;
          postalCode: string;
          regionName: string;
          timezone: string;
        };
      };
      proofs: {
        accessToken: string;
        verificationReport: string;
      };
      reference: string;
      verificationData: {
        backgroundChecks: {
          amlData: {
            filters: string[];
            hits: any[];
          };
          name: {
            firstName: string;
            lastName: string;
            middleName: string;
          };
        };
        verificationResult: {
          backgroundChecks: number;
        };
      };
    };
    hasInternalMatch: boolean;
    internalMatches: any[];
    totalMatches: number;
  };
  matchScore?: number;
  reviewDecision: string;
  reviewNotes: string;
  reviewedAt: string | null;
  reviewedBy: string;
  screenedAt: string;
  updatedAt: string;
}

export interface Pagination {
  total: number;
  limit: number;
  page: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ScreeningMetadata {
  processingMs: number;
  tenantId: string;
  version: string;
  pagination: Pagination;
}

export interface AMLCommonScreeningsResponse<T> {
  screenings: T;
  filters: any;
  metadata: {
    processingMs: number;
    tenantId: string;
    version: string;
    pagination: Pagination;
  };
  timestamp: string;
}

export interface AMLCommonScreeningResponse<T> {
  screening: T;
  metadata: {
    processingMs: number;
    tenantId: string;
    version: string;
    pagination: Pagination;
  };
  timestamp: string;
}

export interface AMLInternalWatchlistsResponse extends AMLCommonScreeningsResponse<
  InternalWatchlistEntry[]
> {}
export interface AMLScreeningsResponse extends AMLCommonScreeningsResponse<
  Screening[]
> {}

export interface AMLInternalWatchlistResponse extends AMLCommonScreeningResponse<InternalWatchlistEntry> {}
export interface AMLScreeningResponse extends AMLCommonScreeningResponse<ExtendedScreening> {}
