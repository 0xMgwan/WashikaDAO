import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { callReadOnly, makeContractCall, waitForTransaction } from '@/utils/stacks';
import { useStacks } from './useStacks';

export const useReadOnlyContract = (
  contractName: string,
  functionName: string,
  functionArgs: any[] = [],
  options: {
    enabled?: boolean;
    refetchInterval?: number;
    staleTime?: number;
  } = {}
) => {
  const { userData } = useStacks();
  
  return useQuery(
    [contractName, functionName, functionArgs, userData.address],
    () => callReadOnly(contractName, functionName, functionArgs, userData.address || undefined),
    {
      enabled: options.enabled !== false,
      refetchInterval: options.refetchInterval || 30000, // 30 seconds
      staleTime: options.staleTime || 10000, // 10 seconds
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    }
  );
};

export const useContractCall = () => {
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const mutate = useMutation(
    async ({
      contractName,
      functionName,
      functionArgs,
      postConditions,
      postConditionMode,
    }: {
      contractName: string;
      functionName: string;
      functionArgs?: any[];
      postConditions?: any[];
      postConditionMode?: any;
    }) => {
      setIsLoading(true);
      setError(null);
      
      try {
        const result = await makeContractCall(
          contractName,
          functionName,
          functionArgs,
          postConditions,
          postConditionMode
        );
        
        // Wait for transaction confirmation
        if (result && typeof result === 'object' && 'txId' in result) {
          await waitForTransaction(result.txId as string);
        }
        
        return result;
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Transaction failed';
        setError(errorMessage);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    {
      onSuccess: () => {
        // Invalidate relevant queries to refetch data
        queryClient.invalidateQueries();
      },
    }
  );

  return {
    ...mutate,
    isLoading: isLoading || mutate.isLoading,
    error: error || mutate.error,
  };
};

// Specific hooks for common contract interactions
export const useGovernanceToken = (address?: string) => {
  const { userData } = useStacks();
  const userAddress = address || userData.address;

  const balance = useReadOnlyContract(
    'governance-token',
    'get-balance',
    userAddress ? [{ type: 'principal', value: userAddress }] : [],
    { enabled: !!userAddress }
  );

  const currentVotes = useReadOnlyContract(
    'governance-token',
    'get-current-votes',
    userAddress ? [{ type: 'principal', value: userAddress }] : [],
    { enabled: !!userAddress }
  );

  const totalSupply = useReadOnlyContract('governance-token', 'get-total-supply');

  return {
    balance: balance.data,
    currentVotes: currentVotes.data,
    totalSupply: totalSupply.data,
    isLoading: balance.isLoading || currentVotes.isLoading || totalSupply.isLoading,
    error: balance.error || currentVotes.error || totalSupply.error,
  };
};

export const useDAO = () => {
  const proposalCount = useReadOnlyContract('washika-dao', 'get-proposal-count');
  
  const votingDelay = useReadOnlyContract('washika-dao', 'get-voting-delay');
  const votingPeriod = useReadOnlyContract('washika-dao', 'get-voting-period');
  const proposalThreshold = useReadOnlyContract('washika-dao', 'get-proposal-threshold');
  const quorumVotes = useReadOnlyContract('washika-dao', 'get-quorum-votes');

  return {
    proposalCount: proposalCount.data,
    votingDelay: votingDelay.data,
    votingPeriod: votingPeriod.data,
    proposalThreshold: proposalThreshold.data,
    quorumVotes: quorumVotes.data,
    isLoading: proposalCount.isLoading || votingDelay.isLoading || votingPeriod.isLoading,
    error: proposalCount.error || votingDelay.error || votingPeriod.error,
  };
};

export const useProposal = (proposalId: number) => {
  const proposal = useReadOnlyContract(
    'washika-dao',
    'get-proposal',
    [{ type: 'uint', value: proposalId }],
    { enabled: proposalId > 0 }
  );

  const proposalState = useReadOnlyContract(
    'washika-dao',
    'get-proposal-state',
    [{ type: 'uint', value: proposalId }],
    { enabled: proposalId > 0 }
  );

  return {
    proposal: proposal.data,
    state: proposalState.data,
    isLoading: proposal.isLoading || proposalState.isLoading,
    error: proposal.error || proposalState.error,
  };
};

export const useSavingsSTX = (address?: string) => {
  const { userData } = useStacks();
  const userAddress = address || userData.address;

  const poolInfo = useReadOnlyContract('savings-stx', 'get-pool-info');
  
  const userShares = useReadOnlyContract(
    'savings-stx',
    'get-user-shares',
    userAddress ? [{ type: 'principal', value: userAddress }] : [],
    { enabled: !!userAddress }
  );

  const userSTXBalance = useReadOnlyContract(
    'savings-stx',
    'get-user-stx-balance',
    userAddress ? [{ type: 'principal', value: userAddress }] : [],
    { enabled: !!userAddress }
  );

  const userPendingBTC = useReadOnlyContract(
    'savings-stx',
    'get-user-pending-btc',
    userAddress ? [{ type: 'principal', value: userAddress }] : [],
    { enabled: !!userAddress }
  );

  const exchangeRate = useReadOnlyContract('savings-stx', 'get-exchange-rate');

  return {
    poolInfo: poolInfo.data,
    userShares: userShares.data,
    userSTXBalance: userSTXBalance.data,
    userPendingBTC: userPendingBTC.data,
    exchangeRate: exchangeRate.data,
    isLoading: poolInfo.isLoading || userShares.isLoading || userSTXBalance.isLoading,
    error: poolInfo.error || userShares.error || userSTXBalance.error,
  };
};

export const useLendingCore = (address?: string) => {
  const { userData } = useStacks();
  const userAddress = address || userData.address;

  const accountLiquidity = useReadOnlyContract(
    'lending-core',
    'get-account-liquidity',
    userAddress ? [{ type: 'principal', value: userAddress }] : [],
    { enabled: !!userAddress }
  );

  const supplyBalance = useReadOnlyContract(
    'lending-core',
    'get-supply-balance',
    userAddress ? [{ type: 'principal', value: userAddress }] : [],
    { enabled: !!userAddress }
  );

  const borrowBalance = useReadOnlyContract(
    'lending-core',
    'get-borrow-balance',
    userAddress ? [{ type: 'principal', value: userAddress }] : [],
    { enabled: !!userAddress }
  );

  const supplyRate = useReadOnlyContract('lending-core', 'get-supply-rate');
  const borrowRate = useReadOnlyContract('lending-core', 'get-borrow-rate');
  const utilizationRate = useReadOnlyContract('lending-core', 'get-utilization-rate');
  const totalSupply = useReadOnlyContract('lending-core', 'get-total-supply');
  const totalBorrows = useReadOnlyContract('lending-core', 'get-total-borrows');

  return {
    accountLiquidity: accountLiquidity.data,
    supplyBalance: supplyBalance.data,
    borrowBalance: borrowBalance.data,
    supplyRate: supplyRate.data,
    borrowRate: borrowRate.data,
    utilizationRate: utilizationRate.data,
    totalSupply: totalSupply.data,
    totalBorrows: totalBorrows.data,
    isLoading: accountLiquidity.isLoading || supplyBalance.isLoading || borrowBalance.isLoading,
    error: accountLiquidity.error || supplyBalance.error || borrowBalance.error,
  };
};

export const useOracle = (pair: string) => {
  const price = useReadOnlyContract(
    'oracle-aggregator',
    'get-price',
    [{ type: 'string-ascii', value: pair }],
    { enabled: !!pair, refetchInterval: 10000 } // Refetch every 10 seconds for prices
  );

  const updatedAt = useReadOnlyContract(
    'oracle-aggregator',
    'get-updated-at',
    [{ type: 'string-ascii', value: pair }],
    { enabled: !!pair }
  );

  const isStale = useReadOnlyContract(
    'oracle-aggregator',
    'is-price-stale',
    [{ type: 'string-ascii', value: pair }, { type: 'uint', value: 144 }], // 24 hours
    { enabled: !!pair }
  );

  return {
    price: price.data,
    updatedAt: updatedAt.data,
    isStale: isStale.data,
    isLoading: price.isLoading || updatedAt.isLoading || isStale.isLoading,
    error: price.error || updatedAt.error || isStale.error,
  };
};
