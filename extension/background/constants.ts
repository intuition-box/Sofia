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
  'accounts.google.com', 'RotateCookiesPage', 'ogs.google.com',"usercentrics.eu",
  'widget', 'chrome-extension://', 'sandbox', 'about:blank', 'CookieSync Page',
  // Sofia/Intuition system pages
  'intuition.box/auth',
  // OAuth challenge pages
  'challenge.spotify.com', 'id.twitch.tv',
  // Services de mail
  'mail.', 'gmail.', 'outlook.', 'yahoo.', 'hotmail.',
  // Captcha and verification services
  'hcaptcha.com', 'recaptcha.net', 'recaptcha.google.com',
  'challenges.cloudflare.com', 'turnstile.cloudflare.com',
  'captcha', 'challenge-platform', 'geo.captcha-delivery.com',
  'arkoselabs.com', 'funcaptcha.com',
  // Technical frames, CDNs and embeds
  'iframe', 'embed', 'player',"insight.adsrvr.org","match.adsrvr.org","sync.creativedot2.net","google-bidout-d.openx.net", 
  'cdn.', 'static.', 'assets.', 'media.', "googleadservices.com",
  'fonts.googleapis.com', 'fonts.gstatic.com',"nolan.wetransfer.net","tagging.wetransfer.com",
  'googletagmanager.com', 'google-analytics.com', 'analytics.',"us-u.openx.net",
  'doubleclick.net', 'googlesyndication.com', 'adsense',"s.ntv.io","cti.w55c.net",
  'cloudflare.com/cdn-cgi', 'jsdelivr.net', 'unpkg.com',
  'polyfill.io', 'sentry.io', 'hotjar.com', 'intercom.io',"tags.crwdcntrl.net",
  'cookielaw.org', 'onetrust.com', 'trustarc.com','adswizz.com', "s0.2mdn.net","apps.rokt.com","backgrounds.wetransfer.net",
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

// Protocoles où les content scripts ne peuvent pas s'exécuter (wallet indisponible)
export const RESTRICTED_PROTOCOLS = [
  'chrome:', 'chrome-extension:', 'chrome-search:', 'chrome-devtools:',
  'devtools:', 'edge:', 'about:', 'brave:', 'opera:', 'vivaldi:', 'file:',
]

// Domaines restreints (stores d'extensions + ads/tracking)
export const RESTRICTED_DOMAINS = [
  // Browser extension stores
  'chrome.google.com', 'chromewebstore.google.com',
  'microsoftedge.microsoft.com', 'addons.mozilla.org',
  // Ad/tracking domains (not certifiable)
  's0.2mdn.net', 'ssp.disqus.com', 'ad5.ad-srv.net',
  'ads.servenobid.com', 'cs.ns1p.net', '2mdn.net',
  'doubleclick.net', 'googlesyndication.com', 'googleadservices.com',
  'adsrvr.org', 'adnxs.com', 'criteo.com', 'taboola.com',
  'outbrain.com', 'pubmatic.com', 'rubiconproject.com',
]

// Messages user-friendly pour l'UI
export const RESTRICTION_MESSAGES: Record<string, string> = {
  'chrome:': 'Page interne Chrome',
  'chrome-extension:': 'Page d\'extension',
  'about:': 'Page système',
  'file:': 'Fichier local',
  'ad': 'Page publicitaire',
  'default': 'Page système du navigateur',
}
