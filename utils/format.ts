export function truncateStrings(
  text: string,
  startLength: number = 5,
  endLength: number = 5
): string {
  if (!text) return "";
  if (text.length <= startLength + endLength) return text;
  return text.slice(0, startLength) + "..." + text.slice(-endLength);
}

export const formatLocation = (location: string) => {
  try {
    const parsed = JSON.parse(location);
    const {city, region, country} = parsed;
    return [city, region, country].filter(Boolean).join(", ");
  } catch {
    return location;
  }
}

export const parseNotes = (notes: unknown): string[] => {
  if(!notes) return [];

  if(Array.isArray(notes)) return notes;
  if (typeof notes === "string") {
    try {
      const parsed = JSON.parse(notes);
      return Array.isArray(parsed) ? parsed : [notes];
    } catch {
      return [notes];
    }
  }

  return [];
}

export function getDateFromTimeFrame(timeFrame: string): string | undefined {
  if (!timeFrame) return undefined;

  const now = new Date();
  const value = Number.parseInt(timeFrame, 10);
  const unit = timeFrame.replace(String(value), "");

  switch (unit) {
    case "h":
      now.setHours(now.getHours() - value);
      break;
    case "d":
      now.setDate(now.getDate() - value);
      break;
    default:
      return undefined;
  }

  return now.toISOString();
}

export const getAutonomousSystemNumber = (record: string) => {
  try {
    const parsed = JSON.parse(record);
    const {AutonomousSystem} = parsed;
    return AutonomousSystem;
  } catch {
    return record;
  }
}

export const getAccuracyRadius = (record: string) => {
  try {
    const parsed = JSON.parse(record);
    const {AccuracyRadius} = parsed;
    return AccuracyRadius;
  } catch {
    return record;
  }
}

export const dayUTC = (date: string) => `${date}T00:00:00Z`;

export const parseUserAgent = (ua?: string) => {
  const isWindows = ua?.includes("Windows NT");
  const isMac = ua?.includes("Mac OS X");
  const isLinux = ua?.includes("Linux");

  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua!);

  return {
    deviceType: isMobile ? "Mobile" : "Desktop",
    os: isWindows ? "Windows" : isMac ? "macOS" : isLinux ? "Linux" : "Unknown",
    browser: ua?.includes("Chrome")
      ? "Chrome"
      : ua?.includes("Safari")
      ? "Safari"
      : "Unknown",
  };
}

export const toParamString = (value: string | string[]) =>
  Array.isArray(value) ? value.join(",") : value;

export const formatPhoneNumber = (phone: string | null | undefined): string => {
  if (!phone) return "N/A";

  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, "");

  if (digits.length === 0) return phone;

  // Format 10-digit numbers as (XXX) XXX-XXXX
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }

  // Format 11-digit numbers (with country code 1) as +1 (XXX) XXX-XXXX
  if (digits.length === 11 && digits.startsWith("1")) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }

  // For other lengths, add spacing every 3-4 digits for readability
  if (digits.length > 10) {
    // Assume first 1-3 digits are country code
    const countryCode = digits.slice(0, digits.length - 10);
    const nationalNumber = digits.slice(-10);
    return `+${countryCode} (${nationalNumber.slice(0, 3)}) ${nationalNumber.slice(3, 6)}-${nationalNumber.slice(6)}`;
  }

  // Return original if we can't determine format
  return phone;
};