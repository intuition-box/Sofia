import { useCallback } from 'react';
import { createWalletClient, createPublicClient, custom, http } from 'viem';
import { BlockchainService } from '@site/src/lib/services/blockchainService';
import { SofiaFeeProxyAbi } from '@site/src/lib/ABI/SofiaFeeProxy';
import { intuitionMainnet, SOFIA_PROXY_ADDRESS, BLOCKCHAIN_CONFIG } from '@site/src/lib/config/chainConfig';
import { STAKE_AMOUNT, CURVE_ID } from '@site/src/lib/config/constants';
import { parseContractError } from '@site/src/lib/web3/utils';

declare global {
  interface Window {
    ethereum?: any;
  }
}

export function useVoting() {
  /**
   * Get wallet and public clients using window.ethereum (MetaMask)
   */
  const getClients = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('Please install MetaMask to vote');
    }

    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts'
    });

    if (!accounts || accounts.length === 0) {
      throw new Error('Please connect your wallet');
    }

    const account = accounts[0] as `0x${string}`;

    // Get current chain ID
    const currentChainId = await window.ethereum.request({ method: 'eth_chainId' });
    const targetChainId = `0x${intuitionMainnet.id.toString(16)}`;

    console.log('Current chain:', currentChainId, 'Target chain:', targetChainId);

    // Switch to Intuition chain if needed
    if (currentChainId !== targetChainId) {
      try {
        console.log('Switching to Intuition chain...');
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: targetChainId }],
        });
        console.log('Chain switch successful');
      } catch (switchError: any) {
        // Chain not added, add it
        if (switchError.code === 4902) {
          console.log('Chain not found, adding Intuition chain...');
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: targetChainId,
              chainName: intuitionMainnet.name,
              nativeCurrency: intuitionMainnet.nativeCurrency,
              rpcUrls: [intuitionMainnet.rpcUrls.default.http[0]],
              blockExplorerUrls: [intuitionMainnet.blockExplorers.default.url],
            }],
          });
          console.log('Chain added successfully');
        } else {
          console.error('Chain switch error:', switchError);
          throw new Error('Please switch to Intuition network in MetaMask');
        }
      }

      // Verify chain switch completed
      const newChainId = await window.ethereum.request({ method: 'eth_chainId' });
      console.log('Chain after switch:', newChainId);
      if (newChainId !== targetChainId) {
        throw new Error('Please switch to Intuition network to vote');
      }
    }

    const walletClient = createWalletClient({
      chain: intuitionMainnet,
      transport: custom(window.ethereum),
    });

    // Use direct RPC for public client (not MetaMask) to ensure correct chain
    const publicClient = createPublicClient({
      chain: intuitionMainnet,
      transport: http(intuitionMainnet.rpcUrls.default.http[0]),
    });

    return { walletClient, publicClient, account };
  }, []);

  /**
   * Ensure proxy approval before deposit
   */
  const ensureProxyApproval = useCallback(async (
    walletClient: any,
    publicClient: any,
    account: `0x${string}`
  ): Promise<void> => {
    const isApproved = await BlockchainService.checkProxyApproval(publicClient, account);

    if (!isApproved) {
      console.log('Requesting proxy approval...');
      const approvalHash = await BlockchainService.requestProxyApproval(walletClient, account);
      console.log('Approval tx:', approvalHash);
      await publicClient.waitForTransactionReceipt({ hash: approvalHash });
      console.log('Approval confirmed');
    }
  }, []);

  /**
   * Deposit FOR a triple (Support/Vote)
   */
  const depositFor = useCallback(async (tripleId: `0x${string}`): Promise<string> => {
    try {
      const { walletClient, publicClient, account } = await getClients();

      console.log('Voting FOR with account:', account);

      // Ensure proxy is approved
      await ensureProxyApproval(walletClient, publicClient, account);

      // Calculate total cost with Sofia fees
      const totalCost = await BlockchainService.getTotalDepositCost(publicClient, STAKE_AMOUNT);
      console.log('Total cost:', totalCost.toString());

      // Execute deposit via proxy
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

      console.log('Deposit tx:', hash);
      return hash;
    } catch (error) {
      console.error('depositFor error:', error);
      throw new Error(parseContractError(error));
    }
  }, [getClients, ensureProxyApproval]);

  /**
   * Deposit AGAINST a triple (Oppose/Downvote)
   */
  const depositAgainst = useCallback(async (tripleId: `0x${string}`): Promise<string> => {
    try {
      const { walletClient, publicClient, account } = await getClients();

      console.log('Voting AGAINST with account:', account);

      // Ensure proxy is approved
      await ensureProxyApproval(walletClient, publicClient, account);

      // Get counter triple ID from contract
      const counterTripleId = await BlockchainService.getCounterTripleId(publicClient, tripleId);
      console.log('Counter triple ID:', counterTripleId);

      // Calculate total cost with Sofia fees
      const totalCost = await BlockchainService.getTotalDepositCost(publicClient, STAKE_AMOUNT);
      console.log('Total cost:', totalCost.toString());

      // Execute deposit on the counter triple via proxy
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

      console.log('Deposit tx:', hash);
      return hash;
    } catch (error) {
      console.error('depositAgainst error:', error);
      throw new Error(parseContractError(error));
    }
  }, [getClients, ensureProxyApproval]);

  return {
    depositFor,
    depositAgainst,
    stakeAmount: STAKE_AMOUNT,
  };
}
