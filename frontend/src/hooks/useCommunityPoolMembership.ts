import { useState, useEffect } from 'react';
import { callReadOnlyFunction, cvToJSON, principalCV, uintCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';
import { usePoolFactory } from './usePoolFactory';
import { useStacks } from './useStacks';

const CONTRACT_ADDRESS = 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28';
const CONTRACT_NAME = 'pool-factory-v3';

export const useCommunityPoolMembership = () => {
  const { userData } = useStacks();
  const { pools } = usePoolFactory();
  const [membershipData, setMembershipData] = useState({
    isMember: false,
    memberPools: [] as any[],
    totalContributions: 0,
    loading: true,
  });

  useEffect(() => {
    if (!userData.isSignedIn || !userData.address || pools.length === 0) {
      setMembershipData(prev => ({ ...prev, loading: false }));
      return;
    }

    const checkMembership = async () => {
      try {
        const network = new StacksTestnet();
        const memberPools = [];
        let totalContributions = 0;

        // Check membership in each pool
        for (const pool of pools) {
          try {
            // Check if user is a member of this pool
            const membershipResult = await callReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'is-pool-member',
              functionArgs: [uintCV(parseInt(pool.id)), principalCV(userData.address!)],
              network,
              senderAddress: CONTRACT_ADDRESS,
            });

            const isMemberOfPool = cvToJSON(membershipResult);
            
            if (isMemberOfPool && isMemberOfPool.value) {
              memberPools.push(pool);
              
              // Try to get user's contribution to this pool
              try {
                const contributionResult = await callReadOnlyFunction({
                  contractAddress: CONTRACT_ADDRESS,
                  contractName: CONTRACT_NAME,
                  functionName: 'get-user-contribution',
                  functionArgs: [uintCV(parseInt(pool.id)), principalCV(userData.address!)],
                  network,
                  senderAddress: CONTRACT_ADDRESS,
                });

                const contribution = cvToJSON(contributionResult);
                if (contribution && contribution.value) {
                  totalContributions += parseInt(contribution.value);
                }
              } catch (error) {
                console.log('Could not get contribution for pool', pool.id);
              }
            }
          } catch (error) {
            console.log('Could not check membership for pool', pool.id);
          }
        }

        setMembershipData({
          isMember: memberPools.length > 0,
          memberPools,
          totalContributions,
          loading: false,
        });
      } catch (error) {
        console.error('Error checking community pool membership:', error);
        setMembershipData(prev => ({ ...prev, loading: false }));
      }
    };

    checkMembership();
  }, [userData.address, userData.isSignedIn, pools]);

  return membershipData;
};
