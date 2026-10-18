export interface SearchMetadata {
  [key: string]: any;
}

export interface SearchResult {
  tenant_id: string;
  entity_type: string;
  entity_id: string;
  title: string;
  snippet: string;
  rank: number;
  metadata: SearchMetadata;
  updated_at: string;
}

export interface SearchResponse {
  results: SearchResult[];
  total_count: number;
  query: string;
  limit: number;
  offset: number;
}

export const getNavigationPath = (
  result: SearchResult
): string => {
  const { entity_type, entity_id, metadata } = result;

  switch (entity_type) {
    case 'customer_profile':
      // Use customer_id from metadata (business identifier) instead of table UUID
      return `/customer-risk/${metadata?.customer_id || entity_id}`;
    case 'kyc_alert':
      return `/kyc/alerts`;
    case 'kyc_request':
      return `/kyc`;
    case 'aml_alert':
      return `/watchlist`;
    case 'geolocation':
      return `/geolocation/geo-visuals`;
    case 'geolocation_alert':
      return `/geolocation/alerts/${entity_id}`;
    case 'case':
      return `/cases/${entity_id}`;
    default:
      return '/';
  }
};

export const getSearchEntityTypeInfo = (
  entityType: string
): { label: string; color: string; bgColor: string; icon: string } => {
  switch (entityType) {
    case 'customer_profile':
      return {
        label: 'Customer',
        color: 'text-blue-400',
        bgColor: 'bg-blue-400/10',
        icon: 'User',
      };
    case 'kyc_alert':
      return {
        label: 'KYC Alert',
        color: 'text-amber-400',
        bgColor: 'bg-amber-400/10',
        icon: 'AlertTriangle',
      };
    case 'kyc_request':
      return {
        label: 'KYC Request',
        color: 'text-cyan-400',
        bgColor: 'bg-cyan-400/10',
        icon: 'FileCheck',
      };
    case 'aml_alert':
      return {
        label: 'AML Alert',
        color: 'text-red-400',
        bgColor: 'bg-red-400/10',
        icon: 'AlertCircle',
      };
    case 'geolocation':
      return {
        label: 'Geolocation',
        color: 'text-green-400',
        bgColor: 'bg-green-400/10',
        icon: 'MapPin',
      };
    case 'geolocation_alert':
      return {
        label: 'Geo Alert',
        color: 'text-orange-400',
        bgColor: 'bg-orange-400/10',
        icon: 'MapPin',
      };
    case 'case':
      return {
        label: 'Case',
        color: 'text-purple-400',
        bgColor: 'bg-purple-400/10',
        icon: 'Briefcase',
      };
    default:
      return {
        label: 'Result',
        color: 'text-black',
        bgColor: 'bg-black/5',
        icon: 'Search',
      };
  }
};
