import _ from "lodash";

export function convertObjectKeysToCamelCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertObjectKeysToCamelCase(item));
  } else if (obj && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const camelKey = _.camelCase(key);
      acc[camelKey] = convertObjectKeysToCamelCase(obj[key]);
      return acc;
    }, {} as Record<string, any>);
  }
  return obj;
}

export function convertObjectKeysToSnakeCase(obj: any): any {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertObjectKeysToSnakeCase(item));
  } else if (obj && typeof obj === "object") {
    return Object.keys(obj).reduce((acc, key) => {
      const snakeKey = _.snakeCase(key);
      acc[snakeKey] = convertObjectKeysToSnakeCase(obj[key]);
      return acc;
    }, {} as Record<string, any>);
  }
  return obj;
}

export function formatRoleName(role: string): string {
  if (!role || role === "N/A") return role;

  return role
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

export function formatText(text: string): string {
  return text
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}
