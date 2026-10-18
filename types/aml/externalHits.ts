type Address = {
  value: string;
  source: string;
  tag: string;
};

type DateOfBirth = {
  value: string;
  source: string;
  tag: string;
};

type Designation = {
  value: string;
  source: string;
  tag: string;
};

type Gender = {
  value: string;
  source: string;
  tag: string;
};

type ImageUrl = {
  value: string;
  source: string;
  tag: string;
};

type Nationality = {
  value: string;
  source: string;
  tag: string;
};

type Occupation = {
  value: string;
  source: string;
  tag: string;
};

type PlaceOfBirth = {
  value: string;
  source: string;
  tag: string;
};

type Profession = {
  value: string;
  source: string;
  tag: string;
};

type Role = {
  value: string;
  source: string;
  tag: string;
};

type SourceDetail = {
  additionalSources: any[];
  categories: string[];
  countries: string[];
  createdAt: string;
  data: {
    [key: string]: { [subKey: string]: any };
  };
  description: string;
  entityId: string;
  publisher: string;
  refrenceUrl: string | null;
  sourceCategories: Record<string, string>;
  updatedAt: string;
  url: string;
};

type Associate = {
  name: string;
  association: string;
};

type Fields = {
  [key: string]: any;
};

export type Entity = {
  name: string;
  entityType: string;
  score: string;
  matchTypes: string[];
  alternativeNames: string[];
  assets: any[];
  associates: Associate[];
  fields: Fields;
  media: any[];
  sourceNotes: Record<string, any>;
  sources: string[];
  types: string[];
  sourceDetails: SourceDetail[];
};
