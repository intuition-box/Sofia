import { SELECTED_CHAIN } from './chainConfig'

export const PRIVY_APP_ID = 'cmj05tjsj03thjs0c3mgxrixm'

export const privyConfig = {
  appId: PRIVY_APP_ID,
  config: {
    appearance: {
      theme: 'dark' as const,
      accentColor: '#ecc48fff',
    },
    loginMethods: ['wallet'] as const,
    defaultChain: SELECTED_CHAIN,
    supportedChains: [SELECTED_CHAIN],
    embeddedWallets: {
      createOnLogin: 'off' as const,
    },
  },
}
