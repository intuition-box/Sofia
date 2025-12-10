import { createConfig } from '@privy-io/wagmi'
import { http } from 'wagmi'

import { SELECTED_CHAIN } from './chainConfig'

export const wagmiConfig = createConfig({
  chains: [SELECTED_CHAIN],
  transports: {
    [SELECTED_CHAIN.id]: http(SELECTED_CHAIN.rpcUrls.default.http[0])
  },
})