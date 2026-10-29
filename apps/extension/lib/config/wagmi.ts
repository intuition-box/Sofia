import { createConfig, http } from 'wagmi'

import { RPC_HTTP_URLS, SELECTED_CHAIN } from './chainConfig'

export const wagmiConfig = createConfig({
  chains: [SELECTED_CHAIN],
  transports: {
    [SELECTED_CHAIN.id]: http(RPC_HTTP_URLS[0])
  },
})