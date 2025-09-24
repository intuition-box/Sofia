import { createConfig } from 'wagmi'
import { injected } from '@wagmi/connectors'
import type { Config } from 'wagmi'
import { http } from 'viem'


import { intuitionTestnet } from './chainConfig'


export const wagmiConfig: Config = createConfig({
  chains: [intuitionTestnet],
  connectors: [
    injected()
  ],
  transports: {
    [intuitionTestnet.id]: http('https://testnet.rpc.intuition.systems')
  },
})