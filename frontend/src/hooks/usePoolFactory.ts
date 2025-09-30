import { useState, useEffect } from 'react';
import { callReadOnlyFunction, cvToJSON } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const CONTRACT_ADDRESS = 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28';
const CONTRACT_NAME = 'pool-factory-v3';

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
        const { uintCV } = await import('@stacks/transactions');
        const poolPromises = [];
        for (let i = 0; i < count; i++) {
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
        
        const fetchedPools: Pool[] = [];
        
        for (let i = 0; i < poolResults.length; i++) {
          try {
            const data = cvToJSON(poolResults[i]);
            console.log('Pool data:', i, data);
            
            if (data && data.value && data.value.value) {
              const poolValue = data.value.value;
              fetchedPools.push({
                id: i.toString(),
                name: poolValue.name.value,
                creator: poolValue.creator.value,
                contributionAmount: Number(poolValue['contribution-amount'].value),
                cycleBlocks: Number(poolValue['cycle-blocks'].value),
                maxMembers: Number(poolValue['max-members'].value),
                createdAt: Number(poolValue['created-at'].value),
                contractId: poolValue['contract-id'].value,
              });
            }
          } catch (error) {
            console.error('Error parsing pool', i, error);
          }
        }

        console.log('Fetched pools:', fetchedPools);
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
