import { createConfig } from 'wagmi'
import { injected } from '@wagmi/connectors'
import type { Config } from 'wagmi'
import { http } from 'viem'

import { SELECTED_CHAIN } from './chainConfig'

export const wagmiConfig: Config = createConfig({
  chains: [SELECTED_CHAIN],
  connectors: [
    injected()
  ],
  transports: {
    [SELECTED_CHAIN.id]: http(SELECTED_CHAIN.rpcUrls.default.http[0])
  },
})