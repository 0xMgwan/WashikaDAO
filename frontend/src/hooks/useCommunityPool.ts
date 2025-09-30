import { useState, useEffect } from 'react';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const CONTRACT_ADDRESS = 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28';
const CONTRACT_NAME = 'community-pool';

export const useCommunityPool = (userAddress?: string) => {
  const [poolData, setPoolData] = useState({
    totalMembers: 0,
    currentCycle: 0,
    poolBalance: 0,
    cycleStartHeight: 0,
    isMember: false,
    yourContribution: 0,
    yourTotalContributions: 0,
    canDistribute: false,
    loading: true,
  });

  useEffect(() => {
    const fetchPoolData = async () => {
      try {
        const network = new StacksTestnet();

        // Fetch total members
        const totalMembersResult = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-total-members',
          functionArgs: [],
          network,
          senderAddress: CONTRACT_ADDRESS,
        });

        // Fetch current cycle
        const currentCycleResult = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-current-cycle',
          functionArgs: [],
          network,
          senderAddress: CONTRACT_ADDRESS,
        });

        // Fetch pool balance
        const poolBalanceResult = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-pool-balance',
          functionArgs: [],
          network,
          senderAddress: CONTRACT_ADDRESS,
        });

        // Fetch can distribute
        const canDistributeResult = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'can-distribute',
          functionArgs: [],
          network,
          senderAddress: CONTRACT_ADDRESS,
        });

        // Parse results
        const totalMembers = Number(cvToJSON(totalMembersResult).value);
        const currentCycle = Number(cvToJSON(currentCycleResult).value);
        const poolBalance = Number(cvToJSON(poolBalanceResult).value);
        const canDistribute = cvToJSON(canDistributeResult).value === true;

        let isMember = false;
        let yourTotalContributions = 0;

        // Check if user is a member
        if (userAddress) {
          const isMemberResult = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'is-member',
            functionArgs: [],
            network,
            senderAddress: userAddress,
          });
          isMember = cvToJSON(isMemberResult).value === true;

          // Get user's total contributions
          const totalContribResult = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-member-total',
            functionArgs: [],
            network,
            senderAddress: userAddress,
          });
          yourTotalContributions = Number(cvToJSON(totalContribResult).value);
        }

        setPoolData({
          totalMembers,
          currentCycle,
          poolBalance,
          cycleStartHeight: 0,
          isMember,
          yourContribution: 0,
          yourTotalContributions,
          canDistribute,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching pool data:', error);
        setPoolData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPoolData();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPoolData, 30000);
    return () => clearInterval(interval);
  }, [userAddress]);

  return poolData;
};

export default useCommunityPool;
