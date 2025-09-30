import { useState, useEffect } from 'react';
import { callReadOnlyFunction, cvToJSON, principalCV, uintCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const CONTRACT_ADDRESS = 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28';
const CONTRACT_NAME = 'pool-factory-v2';

export const usePoolData = (poolId: string | null, userAddress?: string) => {
  const [poolData, setPoolData] = useState({
    totalMembers: 0,
    poolBalance: 0,
    isMember: false,
    hasContributed: false,
    loading: true,
  });

  useEffect(() => {
    if (!poolId) {
      setPoolData(prev => ({ ...prev, loading: false }));
      return;
    }

    const fetchPoolData = async () => {
      try {
        const network = new StacksTestnet();
        const poolIdNum = parseInt(poolId);

        // Get pool info
        const poolInfo = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-pool',
          functionArgs: [uintCV(poolIdNum)],
          network,
          senderAddress: CONTRACT_ADDRESS,
        });

        const poolInfoData = cvToJSON(poolInfo);
        console.log('Pool info:', poolInfoData);

        // Get pool balance (if function exists)
        let poolBalance = 0;
        try {
          const balanceResult = await callReadOnlyFunction({
            contractAddress: CONTRACT_ADDRESS,
            contractName: CONTRACT_NAME,
            functionName: 'get-pool-balance',
            functionArgs: [uintCV(poolIdNum)],
            network,
            senderAddress: CONTRACT_ADDRESS,
          });
          poolBalance = Number(cvToJSON(balanceResult).value || 0);
        } catch (e) {
          console.log('Pool balance not available yet');
        }

        // Count members (we'll need to add this to the contract later)
        let totalMembers = 0;
        let isMember = false;

        if (userAddress) {
          try {
            const memberResult = await callReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'is-pool-member',
              functionArgs: [uintCV(poolIdNum), principalCV(userAddress)],
              network,
              senderAddress: userAddress,
            });
            isMember = cvToJSON(memberResult).value === true;
          } catch (e) {
            console.log('Member check failed:', e);
          }
        }

        setPoolData({
          totalMembers,
          poolBalance,
          isMember,
          hasContributed: false,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching pool data:', error);
        setPoolData(prev => ({ ...prev, loading: false }));
      }
    };

    fetchPoolData();
    
    // Refresh every 10 seconds
    const interval = setInterval(fetchPoolData, 10000);
    return () => clearInterval(interval);
  }, [poolId, userAddress]);

  return poolData;
};

export default usePoolData;
