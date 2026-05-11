import { createPublicClient, http } from 'viem'
import { RpcQueue } from './rpcQueue'
import { intuitionChain } from '../lib/contracts/chainConfig'

// Re-export for callers that want the canonical chain definition.
// Includes Multicall3 contract address so viem batches reads automatically.
export { intuitionChain as intuitionMainnet }

const rpcQueue = new RpcQueue()

export const rpcClient = createPublicClient({
  chain: intuitionChain,
  transport: http(undefined, {
    retryCount: 0,
    fetchFn: rpcQueue.createFetchFn(),
  }),
})
