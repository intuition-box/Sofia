import { createConfig } from 'wagmi'
import { injected } from '@wagmi/connectors'
import type { Config } from 'wagmi'
import { http } from 'viem'
import { http } from 'viem'

import { intuitionTestnet } from '../config'
import { intuitionTestnet } from '../config'

export const wagmiConfig: Config = createConfig({
  chains: [intuitionTestnet],
  chains: [intuitionTestnet],
  connectors: [
    injected()
  ],
  transports: {
    [intuitionTestnet.id]: http('https://testnet.rpc.intuition.systems')
  },
})