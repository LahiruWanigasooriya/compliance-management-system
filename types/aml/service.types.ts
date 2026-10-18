import { FilterData } from "./filters";

export interface FiltersResponse {
  data: FilterData;
  metadata: {
    processingMs: number;
    tenantId: string;
    version: string;
  };
  timestamp: string;
}
