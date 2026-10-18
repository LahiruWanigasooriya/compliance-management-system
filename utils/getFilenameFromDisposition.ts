export function getFilenameFromDisposition(
  disposition?: string,
  fallback?: string
): string | undefined {
  if (!disposition) {
    return fallback;
  }
  const filenameMatch =
    disposition.match(/filename\*?=\s*(?:UTF-8'')?['"]?([^'";]+)['"]?/i) ||
    disposition.match(/filename=\s*([^;]+)/i);
  if (filenameMatch && filenameMatch[1]) {
    return filenameMatch[1].replace(/['"]/g, "").trim();
  }
  return fallback;
}
