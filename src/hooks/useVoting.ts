import { useCallback } from 'react';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { BlockchainService } from '@site/src/lib/services/blockchainService';
import { SofiaFeeProxyAbi } from '@site/src/lib/ABI/SofiaFeeProxy';
import { intuitionMainnet, SOFIA_PROXY_ADDRESS, BLOCKCHAIN_CONFIG } from '@site/src/lib/config/chainConfig';
import { STAKE_AMOUNT, CURVE_ID } from '@site/src/lib/config/constants';
import { parseContractError } from '@site/src/lib/web3/utils';
import { useWalletConnection } from './useWalletConnection';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Ensure wallet is on the Intuition chain, switch if needed
 */
async function ensureChain() {
  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No wallet provider found');

  const currentChainId = await ethereum.request({ method: 'eth_chainId' }) as string;
  const targetChainId = `0x${intuitionMainnet.id.toString(16)}`;

  if (currentChainId === targetChainId) return;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: targetChainId }],
    });
  } catch (err: unknown) {
    const switchError = err as { code?: number };
    if (switchError.code === 4902) {
      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [{
          chainId: targetChainId,
          chainName: intuitionMainnet.name,
          nativeCurrency: intuitionMainnet.nativeCurrency,
          rpcUrls: [intuitionMainnet.rpcUrls.default.http[0]],
          blockExplorerUrls: [intuitionMainnet.blockExplorers.default.url],
        }],
      });
    } else {
      throw new Error('Please switch to Intuition network');
    }
  }
}

export function useVoting() {
  const { address, isConnected, connect } = useWalletConnection();

  const getClients = useCallback(async () => {
    if (!isConnected || !address) {
      connect();
      throw new Error('Please connect your wallet first');
    }
    const ethereum = (window as any).ethereum;
    if (!ethereum) {
      throw new Error('No wallet provider found');
    }

    await ensureChain();

    const account = address as `0x${string}`;

    const walletClient = createWalletClient({
      chain: intuitionMainnet,
      transport: custom(ethereum),
    });

    const publicClient = createPublicClient({
      chain: intuitionMainnet,
      transport: http(intuitionMainnet.rpcUrls.default.http[0]),
    });

    return { walletClient, publicClient, account };
  }, [address, isConnected, connect]);

  const ensureProxyApproval = useCallback(async (
    walletClient: ReturnType<typeof createWalletClient>,
    publicClient: ReturnType<typeof createPublicClient>,
    account: `0x${string}`
  ): Promise<void> => {
    const isApproved = await BlockchainService.checkProxyApproval(publicClient, account);
    if (!isApproved) {
      const approvalHash = await BlockchainService.requestProxyApproval(walletClient, account);
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });
    }
  }, []);

  const depositFor = useCallback(async (tripleId: `0x${string}`): Promise<string> => {
    try {
      const { walletClient, publicClient, account } = await getClients();
      await ensureProxyApproval(walletClient, publicClient, account);

      const totalCost = await BlockchainService.getTotalDepositCost(publicClient, STAKE_AMOUNT);

      const hash = await walletClient.writeContract({
        address: SOFIA_PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'deposit',
        args: [account, tripleId, CURVE_ID, 0n],
        value: totalCost,
        account,
        chain: intuitionMainnet,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
      });

      return hash;
    } catch (error) {
      throw new Error(parseContractError(error));
    }
  }, [getClients, ensureProxyApproval]);

  const depositAgainst = useCallback(async (tripleId: `0x${string}`): Promise<string> => {
    try {
      const { walletClient, publicClient, account } = await getClients();
      await ensureProxyApproval(walletClient, publicClient, account);

      const counterTripleId = await BlockchainService.getCounterTripleId(publicClient, tripleId);
      const totalCost = await BlockchainService.getTotalDepositCost(publicClient, STAKE_AMOUNT);

      const hash = await walletClient.writeContract({
        address: SOFIA_PROXY_ADDRESS,
        abi: SofiaFeeProxyAbi,
        functionName: 'deposit',
        args: [account, counterTripleId, CURVE_ID, 0n],
        value: totalCost,
        account,
        chain: intuitionMainnet,
        gas: BLOCKCHAIN_CONFIG.DEFAULT_GAS,
        maxFeePerGas: BLOCKCHAIN_CONFIG.MAX_FEE_PER_GAS,
        maxPriorityFeePerGas: BLOCKCHAIN_CONFIG.MAX_PRIORITY_FEE_PER_GAS,
      });

      return hash;
    } catch (error) {
      throw new Error(parseContractError(error));
    }
  }, [getClients, ensureProxyApproval]);

  return {
    depositFor,
    depositAgainst,
    stakeAmount: STAKE_AMOUNT,
    isConnected,
  };
}
