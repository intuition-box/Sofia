// ⚠️ TEMPORARY: Using default server for all agents until Bootstrap is fixed
const DEFAULT_SERVER_ID = "00000000-0000-0000-0000-000000000000"

// Agent configuration - Simplified structure
export type AgentType = 'SOFIA' | 'CHATBOT' | 'THEMEEXTRACTOR' | 'PULSEAGENT' | 'RECOMMENDATION'

export const AGENT_CONFIGS = {
  SOFIA: {
    AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",
    AGENT_NAME: "SofIA1",
    SERVER_ID: DEFAULT_SERVER_ID
  },
  CHATBOT: {
    AGENT_ID: "79c0c83b-2bd2-042f-a534-952c58a1024d",
    AGENT_NAME: "ChatBot",
    SERVER_ID: DEFAULT_SERVER_ID
  },
  THEMEEXTRACTOR: {
    AGENT_ID: "7dad3d3a-db1a-08a2-9dda-182d98b6cf2b",
    AGENT_NAME: "ThemeExtractor",
    SERVER_ID: DEFAULT_SERVER_ID
  },
  PULSEAGENT: {
    AGENT_ID: "8afb486a-3c96-0569-b112-4a7f465862b2",
    AGENT_NAME: "PulseAgent",
    SERVER_ID: DEFAULT_SERVER_ID
  },
  RECOMMENDATION: {
    AGENT_ID: "92a956b2-ec82-0d31-8fc1-31c9e13836a3",
    AGENT_NAME: "RecommendationAgent",
    SERVER_ID: DEFAULT_SERVER_ID
  }
} as const

// Backward compatibility (to be removed gradually)
export const SOFIA_BASE_IDS = AGENT_CONFIGS.SOFIA
export const CHATBOT_BASE_IDS = AGENT_CONFIGS.CHATBOT
export const THEMEEXTRACTOR_BASE_IDS = AGENT_CONFIGS.THEMEEXTRACTOR
export const PULSEAGENT_BASE_IDS = AGENT_CONFIGS.PULSEAGENT
export const RECOMMENDATION_BASE_IDS = AGENT_CONFIGS.RECOMMENDATION

// --- WebSocket Configuration ---
export const WEBSOCKET_CONFIG = {
  transports: ["websocket"],
  path: "/socket.io",
  reconnection: true,
  reconnectionDelay: 5000,
  reconnectionDelayMax: 30000,
  reconnectionAttempts: Infinity,
  timeout: 20000
}

export const SESSION_CONFIG = {
  timeoutMinutes: 1440,      // 24 hours
  autoRenew: true,
  maxDurationMinutes: 10080  // 7 days
} as const

// ElizaOS SocketIO message types
export const MESSAGE_TYPES = {
  ROOM_JOINING: 1,
  SEND_MESSAGE: 2,
  MESSAGE: 3,
  ACK: 4,
  THINKING: 5,
  CONTROL: 6
} as const

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
  // Sensitive patterns (reference to sensitive patterns)
  ...SENSITIVE_URL_PATTERNS
];

export const SENSITIVE_URL_PARAMS = [
  'token', 'session', 'auth', 'key', 'password', 'secret', 'api_key'
];