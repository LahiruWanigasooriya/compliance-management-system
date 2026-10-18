type Fields = {
  country: string;
  dob: string;
  identification: string;
  matchedFields: string[];
  nationality: string;
};

export type Entity = {
  addedAt: string;
  addedBy: string;
  entityType: string;
  entryId: string;
  fields: Fields;
  matchTypes: string[];
  name: string;
  reason: string;
  riskLevel: string;
  score: number;
  source: string;
  sources: string[];
  types: string[];
};
