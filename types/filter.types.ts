export type FilterValue = {
  field: string;
  operator: string;
  value: string | string[];
};

export type SavedFilter = {
  id?: string;
  type?: string;
  names: string[];
  values: FilterValue[];
  createdAt?: string;
  updatedAt?: string;
};

export type SavedFiltersList = {
  count: number;
  filters: SavedFilter[];
};

export type CreateSavedFilterPayload = {
  type: string;
  names: string[];
  values: FilterValue[];
};

export type UpdateSavedFilterPayload = {
  values: FilterValue[];
};

export const DEFAULT_FILTER_TYPE = "aml";
