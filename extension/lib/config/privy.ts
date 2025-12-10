import { SELECTED_CHAIN } from './chainConfig'

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
    loginMethods: ['wallet'] as ('wallet')[],
    defaultChain: SELECTED_CHAIN,
    supportedChains: [SELECTED_CHAIN],
    // Disable embedded wallets entirely for Chrome extension (non-HTTPS context)
    embeddedWallets: {
      createOnLogin: 'off' as const,
      showWalletUIs: false,
      noPromptOnSignature: true,
    },
    // External wallets config for Chrome extension
    externalWallets: {
      coinbaseWallet: {
        connectionOptions: 'eoaOnly' as const,
      },
    },
  },
}
