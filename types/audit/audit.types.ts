export interface AuditLogRecord {
  id: string;
  tenantId: string;
  userId: string;
  username: string;
  eventType: string;
  action: string;
  resource: string;
  resourceId: string;
  serviceName: string;
  ipAddress: string;
  userAgent: string;
  requestMethod: string;
  requestPath: string;
  statusCode: number;
  metadata?: Record<string, unknown>;
  errorMessage?: string;
  severity: "info" | "warning" | "error" | "critical";
  complianceTag: string;
  createdAt: string;
  newValue?: Record<string, unknown>;
}

export interface AuditLogsPagination {
  limit: number;
  offset: number;
  total: number;
}

export interface AuditLogsResponse {
  logs: AuditLogRecord[];
  pagination: AuditLogsPagination;
}

export type AuditLogsQueryParams = Record<
  string,
  | string
  | number
  | boolean
  | null
  | undefined
  | Array<string | number | boolean>
>;
