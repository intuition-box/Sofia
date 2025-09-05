import { http, type Chain, type Transport } from 'viem'
import { intuitionTestnet } from '../config'

const originUrl = process.env.ORIGIN_URL || ''

export const orderedChains = [
  13579, // intuitionTestnet
]

const chainsList: { [key: number]: Chain } = {
  13579: intuitionTestnet,
}

const multivaultContractsList: { [key: number]: `0x${string}` } = {
  13579: '0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d' as `0x${string}`,
}

const attestorContractsList: { [key: number]: `0x${string}` } = {
  13579: '0x2b0241B559d78ECF360b7a3aC4F04E6E8eA2450d' as `0x${string}`,
}

const rpcUrlList: { [key: number]: string } = {
  13579: 'https://testnet.rpc.intuition.systems',
}

const transportsList: { [key: number]: Transport } = {
  13579: http(rpcUrlList[13579], {
    fetchOptions: {
      headers: {
        Origin: originUrl,
      },
    },
  }),
}

export const chainsMap = (chainId: number) => chainsList[chainId]
export const transportsMap = (chainId: number) => transportsList[chainId]
export const multivaultContractsMap = (chainId: number) =>
  multivaultContractsList[chainId]
export const rpcUrlMap = (chainId: number) => rpcUrlList[chainId]
export const attestorContractsMap = (chainId: number) =>
  attestorContractsList[chainId]
export const getExplorerUrl = (chainId: number) =>
  chainsMap(chainId)?.blockExplorers?.etherscan?.url ||
  chainsMap(chainId)?.blockExplorers?.default?.url