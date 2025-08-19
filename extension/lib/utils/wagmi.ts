import { createConfig } from 'wagmi'
import { base, baseSepolia } from 'viem/chains'
import { injected } from '@wagmi/connectors'
import type { Config } from 'wagmi'

import { transportsMap } from './chain'

export const wagmiConfig: Config = createConfig({
  chains: [base, baseSepolia],
  connectors: [
    injected()
  ],
  transports: {
    [base.id]: transportsMap(base.id),
    [baseSepolia.id]: transportsMap(baseSepolia.id),
  },
})