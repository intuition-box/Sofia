export const SOFIA_IDS = {
  CHANNEL_ID: "6fbab17e-4ea1-4e4d-a3b5-116411b56b4c",
  SERVER_ID: "00000000-0000-0000-0000-000000000000",
  AUTHOR_ID: "2914780f-8ccc-436a-b857-794d5d1b9aa7",
  AGENT_ID: "582f4e58-1285-004d-8ef6-1e6301f3d646",
  AGENT_NAME: "SofIA1"
};

export const MAX_BUFFER_SIZE = 2;
export const SEND_INTERVAL_MS = 5 * 60 * 1000;
export const MAX_MESSAGE_SIZE = 10 * 1024;
export const WRITE_DELAY_MS = 200;
export const MAX_BEHAVIOR_AGE_MS = 15 * 60 * 1000;
export const BEHAVIOR_CACHE_TIMEOUT_MS = 10 * 60 * 1000;

export const EXCLUDED_URL_PATTERNS = [
  'accounts.google.com', 'RotateCookiesPage', 'ogs.google.com',
  'oauth', 'widget', 'chrome-extension://', 'sandbox', 'about:blank',
  'mail.', 'gmail.', 'outlook.', 'yahoo.', 'hotmail.',
  'bank', 'secure', 'login', 'auth', 'signin', 'signup', "CAPTCHA"
];

export const SENSITIVE_URL_PATTERNS = [
  'login', 'auth', 'signin', 'signup', 'register', 'password',
  'bank', 'payment', 'checkout', 'secure', 'private', 'admin', "reCAPTCHA"
];

export const SENSITIVE_URL_PARAMS = [
  'token', 'session', 'auth', 'key', 'password', 'secret', 'api_key'
];