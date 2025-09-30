import { useState, useEffect } from 'react';
import { callReadOnlyFunction, cvToJSON, principalCV } from '@stacks/transactions';
import { StacksTestnet } from '@stacks/network';

const CONTRACT_ADDRESS = 'STKV0VGBVWGZMGRCQR3SY6R11FED3FW4WRYMWF28';
const CONTRACT_NAME = 'rosca-pool';

export const useRoscaPool = (userAddress?: string) => {
  const [poolData, setPoolData] = useState({
    totalMembers: 0,
    currentRound: 0,
    contributionAmount: 0,
    poolBalance: 0,
    isMember: false,
    hasContributedThisRound: false,
    hasReceivedPayout: false,
    currentRecipient: null as string | null,
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

        // Fetch current round
        const currentRoundResult = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-current-round',
          functionArgs: [],
          network,
          senderAddress: CONTRACT_ADDRESS,
        });

        // Fetch contribution amount
        const contributionAmountResult = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-contribution-amount',
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

        // Fetch current recipient
        const currentRecipientResult = await callReadOnlyFunction({
          contractAddress: CONTRACT_ADDRESS,
          contractName: CONTRACT_NAME,
          functionName: 'get-current-recipient',
          functionArgs: [],
          network,
          senderAddress: CONTRACT_ADDRESS,
        });

        // Parse results
        const totalMembers = Number(cvToJSON(totalMembersResult).value);
        const currentRound = Number(cvToJSON(currentRoundResult).value);
        const contributionAmount = Number(cvToJSON(contributionAmountResult).value);
        const poolBalance = Number(cvToJSON(poolBalanceResult).value);
        const canDistribute = cvToJSON(canDistributeResult).value === true;
        
        const recipientData = cvToJSON(currentRecipientResult);
        const currentRecipient = recipientData.value ? recipientData.value.value : null;

        let isMember = false;
        let hasContributedThisRound = false;
        let hasReceivedPayout = false;

        // Check if user is a member
        if (userAddress) {
          try {
            const isMemberResult = await callReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'is-member',
              functionArgs: [principalCV(userAddress)],
              network,
              senderAddress: userAddress,
            });
            isMember = cvToJSON(isMemberResult).value === true;

            // Check if contributed this round
            const hasContributedResult = await callReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'has-contributed-this-round',
              functionArgs: [principalCV(userAddress)],
              network,
              senderAddress: userAddress,
            });
            hasContributedThisRound = cvToJSON(hasContributedResult).value === true;

            // Check if received payout
            const hasReceivedResult = await callReadOnlyFunction({
              contractAddress: CONTRACT_ADDRESS,
              contractName: CONTRACT_NAME,
              functionName: 'has-received-payout',
              functionArgs: [principalCV(userAddress)],
              network,
              senderAddress: userAddress,
            });
            hasReceivedPayout = cvToJSON(hasReceivedResult).value === true;
          } catch (error) {
            console.error('Error fetching user data:', error);
          }
        }

        setPoolData({
          totalMembers,
          currentRound,
          contributionAmount,
          poolBalance,
          isMember,
          hasContributedThisRound,
          hasReceivedPayout,
          currentRecipient,
          canDistribute,
          loading: false,
        });
      } catch (error) {
        console.error('Error fetching ROSCA pool data:', error);
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

export default useRoscaPool;
