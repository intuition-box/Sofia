export const SOFIA_IDS = {
  CHANNEL_ID: "8662b344-f045-4f8e-ad38-aabae151bccd",
  SERVER_ID: "00000000-0000-0000-0000-000000000000",
  ROOM_ID : "8662b344-f045-4f8e-ad38-aabae151bccd",
  AUTHOR_ID: "6cc290c3-862d-4bba-8353-879ffe6232ab",// user
  AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",//agent
  AGENT_NAME: "SofIA1"
};

export const CHATBOT_IDS = {
  AGENT_ID: "79c0c83b-2bd2-042f-a534-952c58a1024d", // l’agent chatbot
  AUTHOR_ID: "6cc290c3-862d-4bba-8353-879ffe6232ab", // user
  CHANNEL_ID: "e04d96d2-9750-434e-b2d9-d833c7e34881",
  ROOM_ID: "e04d96d2-9750-434e-b2d9-d833c7e34881", // même valeur si DM
  SERVER_ID: "00000000-0000-0000-0000-000000000000"
}

export const BOOKMARKAGENT_IDS = {
  AGENT_ID: "e7bc819e-9e9c-06ab-bf87-b7d9e5f54dcd", // l’agent chatbot
  AUTHOR_ID: "6cc290c3-862d-4bba-8353-879ffe6232ab", // user
  CHANNEL_ID: "866c15b7-075e-4ff0-be34-fb967b4d4554",
  ROOM_ID: "866c15b7-075e-4ff0-be34-fb967b4d4554", // même valeur si DM
  SERVER_ID: "00000000-0000-0000-0000-000000000000"
}



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