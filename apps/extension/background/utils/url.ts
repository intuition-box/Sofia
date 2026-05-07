import { SENSITIVE_URL_PATTERNS } from "../constants";

export function isSensitiveUrl(url: string): boolean {
  return SENSITIVE_URL_PATTERNS.some(pattern => url.toLowerCase().includes(pattern));
}