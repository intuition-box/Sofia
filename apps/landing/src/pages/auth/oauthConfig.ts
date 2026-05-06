export type OAuthPlatform = 'discord' | 'spotify' | 'twitch' | 'twitter' | 'youtube';

const BASE_URL = 'https://sofia.intuition.box';
const SOFIA_API_URL = 'https://sofia-api.maxime-moodz.workers.dev';

export const OAUTH_CONFIG: Record<OAuthPlatform, {
  clientId: string;
  redirectUri: string;
  scopes: string[];
  authorizeUrl: string;
  label: string;
  usePKCE?: boolean;
}> = {
  discord: {
    clientId: '1450535332360753317',
    redirectUri: `${BASE_URL}/auth/discord/callback`,
    scopes: ['identify', 'email', 'guilds'],
    authorizeUrl: 'https://discord.com/api/oauth2/authorize',
    label: 'Discord',
  },
  spotify: {
    clientId: 'a60a4664664f44cc94ef402b3253cbc9',
    redirectUri: `${BASE_URL}/auth/spotify/callback`,
    scopes: ['user-read-private', 'user-follow-read', 'user-top-read'],
    authorizeUrl: 'https://accounts.spotify.com/authorize',
    label: 'Spotify',
  },
  twitch: {
    clientId: 'pyz5o7ahuj5kt4gttextfafkzmn9cs',
    redirectUri: `${BASE_URL}/auth/twitch/callback`,
    scopes: ['user:read:follows', 'user:read:subscriptions'],
    authorizeUrl: 'https://id.twitch.tv/oauth2/authorize',
    label: 'Twitch',
  },
  twitter: {
    clientId: 'by1mQy1ocE1kTVFvYXJPSWlSMlg6MTpjaQ',
    redirectUri: `${BASE_URL}/auth/twitter/callback`,
    scopes: ['users.read', 'tweet.read'],
    authorizeUrl: 'https://twitter.com/i/oauth2/authorize',
    label: 'Twitter/X',
    usePKCE: true,
  },
  youtube: {
    clientId: '301365654069-u5qmofalvpte890u4detr99pij8m8da3.apps.googleusercontent.com',
    redirectUri: `${BASE_URL}/auth/youtube/callback`,
    scopes: ['https://www.googleapis.com/auth/youtube.readonly'],
    authorizeUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    label: 'YouTube',
  },
};

export const getApiTokenUrl = (platform: OAuthPlatform) =>
  `${SOFIA_API_URL}/auth/${platform}/token`;

export const generateRandomString = (length: number): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => byte.toString(16).padStart(2, '0')).join('');
};

export const generateCodeChallenge = async (verifier: string): Promise<string> => {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest('SHA-256', data);
  const base64 = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

export const DEFAULT_EXTENSION_ID = 'YOUR_EXTENSION_ID_HERE';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace chrome {
    namespace runtime {
      function sendMessage(extensionId: string, message: unknown, callback?: (response: unknown) => void): void;
    }
  }
}

export function sendToExtension(message: Record<string, unknown>, extensionId?: string) {
  if (extensionId && extensionId !== DEFAULT_EXTENSION_ID) {
    try {
      chrome.runtime.sendMessage(extensionId, message, (response) => {
        console.log('[Sofia Auth] Extension response:', response);
      });
    } catch { /* extension not available */ }
  }

  if (window.opener) {
    window.opener.postMessage(message, '*');
  }
}
