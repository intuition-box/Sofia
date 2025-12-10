// Read from environment variables (set in .env.development / .env.production)
export const PRIVY_APP_ID = process.env.PLASMO_PUBLIC_PRIVY_APP_ID || ''
export const PRIVY_CLIENT_ID = process.env.PLASMO_PUBLIC_PRIVY_CLIENT_ID || ''

if (!PRIVY_APP_ID || !PRIVY_CLIENT_ID) {
  console.warn('⚠️ [privy.ts] Missing PLASMO_PUBLIC_PRIVY_APP_ID or PLASMO_PUBLIC_PRIVY_CLIENT_ID in environment')
}

export const privyConfig = {
  appId: PRIVY_APP_ID,
  clientId: PRIVY_CLIENT_ID,
  config: {
    appearance: {
      theme: 'dark' as const,
      accentColor: '#ecc48f' as `#${string}`,
    },
    // Only allow external wallet login (no email, no social)
    loginMethods: ['wallet'] as const,
    // NO embeddedWallets config = Privy won't initialize embedded wallet system at all
    // This avoids the HTTPS check entirely
  },
}
