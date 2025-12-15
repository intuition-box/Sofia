/**
 * Extension constants
 * Note: Agent IDs are now managed by Mastra, not needed here
 */

// Agent types for routing
export type AgentType = 'SOFIA' | 'CHATBOT' | 'THEMEEXTRACTOR' | 'PULSEAGENT' | 'RECOMMENDATION'

// Session configuration
export const SESSION_CONFIG = {
  timeoutMinutes: 1440,      // 24 hours
  autoRenew: true,
  maxDurationMinutes: 10080  // 7 days
} as const

// --- Buffer and Timing Constants ---
export const MAX_BUFFER_SIZE = 5;
export const SEND_INTERVAL_MS = 5 * 60 * 1000;
export const MAX_MESSAGE_SIZE = 10 * 1024;
export const WRITE_DELAY_MS = 2000;
export const MAX_BEHAVIOR_AGE_MS = 15 * 60 * 1000;
export const BEHAVIOR_CACHE_TIMEOUT_MS = 10 * 60 * 1000;

// --- User Constants ---
export const USER_NAME = "User";
export const CHAT_SOURCE = "API";

// Consolidated sensitive patterns (used for filtering and security)
export const SENSITIVE_URL_PATTERNS = [
  'login', 'auth', 'signin', 'signup', 'register', 'password',
  'bank', 'payment', 'checkout', 'secure', 'private', 'admin',
  'oauth', 'token', 'session', 'CAPTCHA', 'reCAPTCHA',
  'privy.intuition.systems', 'embedded-wallets'  // Privy wallet interface
];

// Specific exclusion patterns (technical + sensitive)
export const EXCLUDED_URL_PATTERNS = [
  // Sites techniques
  'accounts.google.com', 'RotateCookiesPage', 'ogs.google.com',
  'widget', 'chrome-extension://', 'sandbox', 'about:blank', 'CookieSync Page',
  // Services de mail
  'mail.', 'gmail.', 'outlook.', 'yahoo.', 'hotmail.',
  // Captcha and verification services
  'hcaptcha.com', 'recaptcha.net', 'recaptcha.google.com',
  'challenges.cloudflare.com', 'turnstile.cloudflare.com',
  'captcha', 'challenge-platform', 'geo.captcha-delivery.com',
  'arkoselabs.com', 'funcaptcha.com',
  // Technical frames, CDNs and embeds
  'iframe', 'embed', 'player',
  'cdn.', 'static.', 'assets.', 'media.',
  'fonts.googleapis.com', 'fonts.gstatic.com',
  'googletagmanager.com', 'google-analytics.com', 'analytics.',
  'doubleclick.net', 'googlesyndication.com', 'adsense',
  'cloudflare.com/cdn-cgi', 'jsdelivr.net', 'unpkg.com',
  'polyfill.io', 'sentry.io', 'hotjar.com', 'intercom.io',
  'cookielaw.org', 'onetrust.com', 'trustarc.com',
  // Unknown and empty content
  'unknown', 'undefined', 'null', 'blank', 'empty',
  'about:blank', 'about:srcdoc', 'data:', 'javascript:',
  'chrome://', 'moz-extension://', 'edge://', 'brave://',
  // Sensitive patterns
  ...SENSITIVE_URL_PATTERNS
];

export const SENSITIVE_URL_PARAMS = [
  'token', 'session', 'auth', 'key', 'password', 'secret', 'api_key'
];
