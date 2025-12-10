export const PRIVY_APP_ID = 'cmj05tjsj03thjs0c3mgxrixm'
export const PRIVY_CLIENT_ID = 'client-WY6U3b3LFEgbveR2FVgiyTTbRWKCZhy6vEVFzQt9NvZYS'

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
