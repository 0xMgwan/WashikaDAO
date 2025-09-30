import { useState, useEffect } from 'react';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const CONTRACT_ADDRESS = 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28';
const CONTRACT_NAME = 'pool-factory';

interface Pool {
  id: string;
  name: string;
  creator: string;
  contributionAmount: number;
  cycleBlocks: number;
  maxMembers: number;
  createdAt: number;
  contractId: string;
}

export const usePoolFactory = () => {
  const [pools, setPools] = useState<Pool[]>([]);
  const [poolCount, setPoolCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPools = async () => {
      try {
        const network = new StacksTestnet();

        // Get pool count
        const poolCountResult = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-pool-count',
          functionArgs: [],
          network,
          senderAddress: CONTRACT_ADDRESS,
        });

        const count = Number(cvToJSON(poolCountResult).value);
        setPoolCount(count);

        // Fetch all pools
        const poolPromises = [];
        for (let i = 0; i < count; i++) {
          const { uintCV } = await import('@stacks/transactions');
          poolPromises.push(
            callReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'get-pool',
              functionArgs: [uintCV(i)],
              network,
              senderAddress: CONTRACT_ADDRESS,
            })
          );
        }

        const poolResults = await Promise.all(poolPromises);
        
        const fetchedPools: Pool[] = poolResults
          .map((result, index) => {
            const data = cvToJSON(result);
            if (data.value) {
              return {
                id: index.toString(),
                name: data.value.name.value,
                creator: data.value.creator.value,
                contributionAmount: Number(data.value['contribution-amount'].value),
                cycleBlocks: Number(data.value['cycle-blocks'].value),
                maxMembers: Number(data.value['max-members'].value),
                createdAt: Number(data.value['created-at'].value),
                contractId: data.value['contract-id'].value,
              };
            }
            return null;
          })
          .filter((pool): pool is Pool => pool !== null);

        setPools(fetchedPools);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pools:', error);
        setLoading(false);
      }
    };

    fetchPools();
    
    // Refresh every 30 seconds
    const interval = setInterval(fetchPools, 30000);
    return () => clearInterval(interval);
  }, []);

  return { pools, poolCount, loading };
};

export default usePoolFactory;
