export const SOFIA_IDS = {
  CHANNEL_ID: "8662b344-f045-4f8e-ad38-aabae151bccd",
  SERVER_ID: "00000000-0000-0000-0000-000000000000",
  ROOM_ID : "8662b344-f045-4f8e-ad38-aabae151bccd",
  AUTHOR_ID: "6cc290c3-862d-4bba-8353-879ffe6232ab",
  AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",
  AGENT_NAME: "SofIA1"
};

export const CHATBOT_IDS = {
  AGENT_ID: "79c0c83b-2bd2-042f-a534-952c58a1024d", 
  AUTHOR_ID: "6cc290c3-862d-4bba-8353-879ffe6232ab", 
  CHANNEL_ID: "e04d96d2-9750-434e-b2d9-d833c7e34881",
  ROOM_ID: "e04d96d2-9750-434e-b2d9-d833c7e34881",
  SERVER_ID: "00000000-0000-0000-0000-000000000000"
}

export const BOOKMARKAGENT_IDS = {
  AGENT_ID: "e7bc819e-9e9c-06ab-bf87-b7d9e5f54dcd", 
  AUTHOR_ID: "e7bc819e-9e9c-06ab-bf87-b7d9e5f54dcd", 
  CHANNEL_ID: "866c15b7-075e-4ff0-be34-fb967b4d4554",
  ROOM_ID: "866c15b7-075e-4ff0-be34-fb967b4d4554", 
  SERVER_ID: "00000000-0000-0000-0000-000000000000"
}

export const THEMEEXTRACTOR_IDS = {
  CHANNEL_ID: "bf386eac-c8e5-4731-818c-ca6f9167445f",
  ROOM_ID: "bf386eac-c8e5-4731-818c-ca6f9167445f",
  SERVER_ID: "00000000-0000-0000-0000-000000000000",
  AGENT_ID: "7dad3d3a-db1a-08a2-9dda-182d98b6cf2b",
  AUTHOR_ID: "613461d9-c0bb-439f-a628-bae1e7b7950c"
}

export const PULSEAGENT_IDS = {
  CHANNEL_ID: "pulse-channel-id", // TODO: Add real PulseAgent channel ID
  ROOM_ID: "pulse-room-id", // TODO: Add real PulseAgent room ID  
  SERVER_ID: "00000000-0000-0000-0000-000000000000",
  AGENT_ID: "pulse-agent-id", // TODO: Add real PulseAgent ID
  AUTHOR_ID: "6cc290c3-862d-4bba-8353-879ffe6232ab"
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