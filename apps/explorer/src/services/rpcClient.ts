import { createPublicClient, defineChain, http } from 'viem'
import { RpcQueue } from './rpcQueue'
import { RPC_URL } from '../config'

export const intuitionMainnet = defineChain({
  id: 1155,
  name: 'Intuition Mainnet',
  nativeCurrency: { decimals: 18, name: 'Trust', symbol: 'TRUST' },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: 'Explorer', url: 'https://explorer.intuition.systems' },
  },
})

const rpcQueue = new RpcQueue()

export const rpcClient = createPublicClient({
  chain: intuitionMainnet,
  transport: http(undefined, {
    retryCount: 0,
    fetchFn: rpcQueue.createFetchFn(),
  }),
})
