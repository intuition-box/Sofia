// Base agent IDs (UNCHANGED - these are the original agent UUIDs)
// CHANNEL_ID, ROOM_ID, AUTHOR_ID are now generated dynamically per user
// via UserSessionManager.getUserAgentIds()

export const SOFIA_BASE_IDS = {
  AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",  // ✅ UNCHANGED
  AGENT_NAME: "SofIA1"
}

export const CHATBOT_BASE_IDS = {
  AGENT_ID: "79c0c83b-2bd2-042f-a534-952c58a1024d",  // ✅ UNCHANGED
  AGENT_NAME: "ChatBot"
}

export const THEMEEXTRACTOR_BASE_IDS = {
  AGENT_ID: "7dad3d3a-db1a-08a2-9dda-182d98b6cf2b",  // ✅ UNCHANGED
  AGENT_NAME: "ThemeExtractor"
}

export const PULSEAGENT_BASE_IDS = {
  AGENT_ID: "8afb486a-3c96-0569-b112-4a7f465862b2",  // ✅ UNCHANGED
  AGENT_NAME: "PulseAgent"
}

export const RECOMMENDATION_BASE_IDS = {
  AGENT_ID: "92a956b2-ec82-0d31-8fc1-31c9e13836a3",  // ✅ UNCHANGED
  AGENT_NAME: "RecommendationAgent"
}

// --- Constants ---
export const USER_NAME = "User";


export const CHAT_SOURCE = "API";


export const MAX_BUFFER_SIZE = 5;
export const SEND_INTERVAL_MS = 5 * 60 * 1000;
export const MAX_MESSAGE_SIZE = 10 * 1024;
export const WRITE_DELAY_MS = 2000;
export const MAX_BEHAVIOR_AGE_MS = 15 * 60 * 1000;
export const BEHAVIOR_CACHE_TIMEOUT_MS = 10 * 60 * 1000;

// Consolidated sensitive patterns (used for filtering and security)
export const SENSITIVE_URL_PATTERNS = [
  'login', 'auth', 'signin', 'signup', 'register', 'password',
  'bank', 'payment', 'checkout', 'secure', 'private', 'admin', 
  'oauth', 'token', 'session', 'CAPTCHA', 'reCAPTCHA'
];

// Specific exclusion patterns (technical + sensitive)
export const EXCLUDED_URL_PATTERNS = [
  // Sites techniques
  'accounts.google.com', 'RotateCookiesPage', 'ogs.google.com',
  'widget', 'chrome-extension://', 'sandbox', 'about:blank', 'CookieSync Page',
  // Services de mail
  'mail.', 'gmail.', 'outlook.', 'yahoo.', 'hotmail.',
  // Sensitive patterns (reference to sensitive patterns)
  ...SENSITIVE_URL_PATTERNS
];

export const SENSITIVE_URL_PARAMS = [
  'token', 'session', 'auth', 'key', 'password', 'secret', 'api_key'
];