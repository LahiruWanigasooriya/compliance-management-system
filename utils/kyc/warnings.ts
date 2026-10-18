export type WarningEntry = {
  key: string;
  value: string;
};

export type WarningGroups = {
  document: Record<string, string>;
  address: Record<string, string>;
  face: Record<string, string>;
};

export const EMPTY_WARNINGS: WarningGroups = {
  document: {},
  address: {},
  face: {},
};

export const OTHER_REASON = "Other";

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalizeWarnings = (rawJson: string) => {
  try {
    const parsed = JSON.parse(rawJson) as Record<string, unknown>;
    return {
      document: isPlainObject(parsed.document) ? parsed.document : {},
      address: isPlainObject(parsed.address) ? parsed.address : {},
      face: isPlainObject(parsed.face) ? parsed.face : {},
    };
  } catch (error) {
    return EMPTY_WARNINGS;
  }
};

export const parseWarnings = (warnings: unknown) => {
  if (!warnings) {
    return EMPTY_WARNINGS;
  }

  if (typeof warnings === "object" && !Array.isArray(warnings)) {
    const record = warnings as Record<string, unknown>;
    return {
      document: isPlainObject(record.document) ? record.document : {},
      address: isPlainObject(record.address) ? record.address : {},
      face: isPlainObject(record.face) ? record.face : {},
    };
  }

  if (typeof warnings === "string") {
    try {
      return normalizeWarnings(warnings);
    } catch (error) {
      return {
        document: { general: warnings },
        address: {},
        face: {},
      };
    }
  }

  return EMPTY_WARNINGS;
};

export const entriesFromObject = (
  value: Record<string, unknown>
): WarningEntry[] => {
  const entries = Object.entries(value).map(([key, entryValue]) => ({
    key,
    value:
      typeof entryValue === "string" ? entryValue : JSON.stringify(entryValue),
  }));
  return entries.length > 0 ? entries : [{ key: "", value: "" }];
};

export const objectFromEntries = (entries: WarningEntry[]) => {
  const payload: Record<string, string> = {};
  entries.forEach(({ key, value }) => {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      return;
    }
    payload[trimmedKey] = value;
  });
  return payload;
};

export const hasDuplicateWarningEntries = (entries: WarningEntry[]) => {
  const seen = new Set<string>();
  for (const entry of entries) {
    const trimmed = entry.key.trim();
    if (!trimmed) {
      continue;
    }
    if (seen.has(trimmed)) {
      return true;
    }
    seen.add(trimmed);
  }
  return false;
};
