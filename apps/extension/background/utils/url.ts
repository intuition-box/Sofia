import { SENSITIVE_URL_PATTERNS, SENSITIVE_URL_PARAMS } from "../constants";

export function sanitizeUrl(url: string): string {
  try {
    const urlObj = new URL(url);
    SENSITIVE_URL_PARAMS.forEach(param => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch {
    return url;
  }
}

export function isSensitiveUrl(url: string): boolean {
  return SENSITIVE_URL_PATTERNS.some(pattern => url.toLowerCase().includes(pattern));
}