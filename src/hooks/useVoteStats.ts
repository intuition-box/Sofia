import { useState, useEffect, useCallback } from 'react';
import { createPublicClient, http, formatEther } from 'viem';
import { BlockchainService } from '@site/src/lib/services/blockchainService';
import { intuitionMainnet } from '@site/src/lib/config/chainConfig';
import { CURVE_ID } from '@site/src/lib/config/constants';

export interface VoteStats {
  forAssets: bigint;
  againstAssets: bigint;
  forDisplay: string;
  againstDisplay: string;
  isLoading: boolean;
  error: string | null;
}

const defaultStats: VoteStats = {
  forAssets: 0n,
  againstAssets: 0n,
  forDisplay: '0',
  againstDisplay: '0',
  isLoading: true,
  error: null,
};

export function useVoteStats(tripleId: `0x${string}`) {
  const [stats, setStats] = useState<VoteStats>(defaultStats);

  const fetchStats = useCallback(async () => {
    try {
      const publicClient = createPublicClient({
        chain: intuitionMainnet,
        transport: http(intuitionMainnet.rpcUrls.default.http[0]),
      });

      const { forAssets, againstAssets } = await BlockchainService.getTripleVoteStats(
        publicClient,
        tripleId,
        CURVE_ID
      );

      // Format to readable TRUST amount (round to 2 decimals)
      const forNum = parseFloat(formatEther(forAssets));
      const againstNum = parseFloat(formatEther(againstAssets));

      setStats({
        forAssets,
        againstAssets,
        forDisplay: forNum.toFixed(1),
        againstDisplay: againstNum.toFixed(1),
        isLoading: false,
        error: null,
      });
    } catch (error) {
      console.error('Error fetching vote stats:', error);
      setStats(prev => ({
        ...prev,
        isLoading: false,
        error: 'Failed to load stats',
      }));
    }
  }, [tripleId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return { ...stats, refetch: fetchStats };
}
