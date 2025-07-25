export const SOFIA_IDS = {
  CHANNEL_ID: "6cc290c3-862d-4bba-8353-879ffe6232ab",
  SERVER_ID: "00000000-0000-0000-0000-000000000000",
  ROOM_ID : "6cc290c3-862d-4bba-8353-879ffe6232ab",
  AUTHOR_ID: "ffbe5bee-a32c-4615-be7e-6a18cfd5703d",
  AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",
  AGENT_NAME: "SofIA1"
};

// --- Constants ---
export const USER_NAME = "User";

// Source identifier for this Next.js application
export const CHAT_SOURCE = "API";


export const MAX_BUFFER_SIZE = 5;
export const SEND_INTERVAL_MS = 5 * 60 * 1000;
export const MAX_MESSAGE_SIZE = 10 * 1024;
export const WRITE_DELAY_MS = 2000;
export const MAX_BEHAVIOR_AGE_MS = 15 * 60 * 1000;
export const BEHAVIOR_CACHE_TIMEOUT_MS = 10 * 60 * 1000;

// Patterns sensibles consolidés (utilisés pour filtrage et sécurité)
export const SENSITIVE_URL_PATTERNS = [
  'login', 'auth', 'signin', 'signup', 'register', 'password',
  'bank', 'payment', 'checkout', 'secure', 'private', 'admin', 
  'oauth', 'token', 'session', 'CAPTCHA', 'reCAPTCHA'
];

// Patterns d'exclusion spécifiques (technique + sensible)
export const EXCLUDED_URL_PATTERNS = [
  // Sites techniques
  'accounts.google.com', 'RotateCookiesPage', 'ogs.google.com',
  'widget', 'chrome-extension://', 'sandbox', 'about:blank', 'CookieSync Page',
  // Services de mail
  'mail.', 'gmail.', 'outlook.', 'yahoo.', 'hotmail.',
  // Patterns sensibles (référence aux patterns sensibles)
  ...SENSITIVE_URL_PATTERNS
];

export const SENSITIVE_URL_PARAMS = [
  'token', 'session', 'auth', 'key', 'password', 'secret', 'api_key'
];