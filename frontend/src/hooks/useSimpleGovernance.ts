// Unused hook - can be removed or implemented later
import { useReadOnlyContract, useContractCall } from './useContract';
import { useStacks } from './useStacks';

export interface SimpleProposal {
  id: number;
  proposer: string;
  title: string;
  description: string;
  proposalType: string;
  amount: number;
  recipient?: string;
  startBlock: number;
  endBlock: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  status: number;
}

export const useSimpleGovernance = () => {
  const { userData } = useStacks();
  
  // Get proposal count
  const proposalCount = useReadOnlyContract(
    'simple-governance',
    'get-proposal-count',
    []
  );

  // Get voting period
  const votingPeriod = useReadOnlyContract(
    'simple-governance',
    'get-voting-period',
    []
  );

  // Check if user is pool member
  const isPoolMember = useReadOnlyContract(
    'simple-governance',
    'is-member',
    userData.address ? [{ type: 'principal', value: userData.address }] : [],
    { enabled: !!userData.address }
  );

  // Get user voting power
  const votingPower = useReadOnlyContract(
    'simple-governance',
    'get-user-voting-power',
    userData.address ? [{ type: 'principal', value: userData.address }] : [],
    { enabled: !!userData.address }
  );

  return {
    proposalCount: proposalCount.data,
    votingPeriod: votingPeriod.data,
    isPoolMember: isPoolMember.data,
    votingPower: votingPower.data,
    loading: proposalCount.isLoading || votingPeriod.isLoading || isPoolMember.isLoading
  };
};

export const useSimpleProposal = (proposalId: number) => {
  const { userData } = useStacks();
  
  // Get proposal details
  const proposal = useReadOnlyContract(
    'simple-governance',
    'get-proposal',
    [{ type: 'uint', value: proposalId }],
    { enabled: proposalId > 0 }
  );

  // Check if user has voted
  const hasVoted = useReadOnlyContract(
    'simple-governance',
    'has-voted',
    userData.address ? [
      { type: 'uint', value: proposalId },
      { type: 'principal', value: userData.address }
    ] : [],
    { enabled: proposalId > 0 && !!userData.address }
  );

  // Get user's vote
  const userVote = useReadOnlyContract(
    'simple-governance',
    'get-vote',
    userData.address ? [
      { type: 'uint', value: proposalId },
      { type: 'principal', value: userData.address }
    ] : [],
    { enabled: proposalId > 0 && !!userData.address }
  );

  return {
    proposal: proposal.data,
    hasVoted: hasVoted.data,
    userVote: userVote.data,
    loading: proposal.isLoading || hasVoted.isLoading
  };
};

export const useCreateSimpleProposal = () => {
  const { mutate: createProposal, isLoading } = useContractCall();

  const createSimpleProposal = async (proposalData: {
    title: string;
    description: string;
    type: string;
    amount?: string;
    recipient?: string;
  }) => {
    const amount = proposalData.amount ? 
      Math.floor(Number(proposalData.amount) * 1000000).toString() : '0';

    return createProposal({
      contractName: 'simple-governance',
      functionName: 'create-proposal',
      functionArgs: [
        { type: 'string-utf8', value: proposalData.title },
        { type: 'string-utf8', value: proposalData.description },
        { type: 'string-ascii', value: proposalData.type },
        { type: 'uint', value: amount },
        proposalData.recipient ? 
          { type: 'some', value: { type: 'principal', value: proposalData.recipient } } :
          { type: 'none' }
      ]
    });
  };

  return {
    createSimpleProposal,
    isLoading
  };
};

export const useCastSimpleVote = () => {
  const { mutate: castVote, isLoading } = useContractCall();

  const castSimpleVote = async (proposalId: number, support: number) => {
    return castVote({
      contractName: 'simple-governance',
      functionName: 'cast-vote',
      functionArgs: [
        { type: 'uint', value: proposalId.toString() },
        { type: 'uint', value: support.toString() }
      ]
    });
  };

  return {
    castSimpleVote,
    isLoading
  };
};
