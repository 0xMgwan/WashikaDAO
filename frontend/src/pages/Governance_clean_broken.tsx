import React, { useState } from 'react';
import {
  Vote, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  Calendar,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useContractCall, useReadOnlyContract } from '@/hooks/useContract';
import { useStacks } from '@/hooks/useStacks';
import { formatSTX, extractClarityValue } from '@/utils/stacks';
import CreateProposalModal from '@/components/CreateProposalModal';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';

interface BlockchainProposalCardProps {
  proposalId: number;
  onVote: (proposalId: number, support: number) => void;
  currentUser: string;
  isVoting?: boolean;
}

const BlockchainProposalCard: React.FC<BlockchainProposalCardProps> = ({ proposalId, onVote, currentUser, isVoting = false }) => {
  const [selectedVote, setSelectedVote] = useState<number | null>(null);

  // Get proposal data from blockchain
  const proposalData = useReadOnlyContract(
    'simple-governance',
    'get-proposal',
    [{ type: 'uint', value: proposalId }]
  );
  
  // Check if user has voted
  const userVoteData = useReadOnlyContract(
    'simple-governance',
    'has-voted',
    currentUser ? [
      { type: 'uint', value: proposalId },
      { type: 'principal', value: currentUser }
    ] : [],
    { enabled: !!currentUser }
  );
  
  // Debug logging
  console.log('Raw proposal data for ID', proposalId, ':', proposalData);
  
  // Handle the optional return from get-proposal safely
  let proposal = null;
  if (proposalData.data) {
    try {
      const rawData = extractClarityValue(proposalData.data);
      console.log('Extracted proposal data:', rawData);
      proposal = rawData;
    } catch (error) {
      console.error('Error extracting proposal data:', error);
    }
  }
  
  const hasVoted = userVoteData.data ? Boolean(extractClarityValue(userVoteData.data)) : false;
  
  // Show loading state while fetching
  if (proposalData.isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  // Show error state if failed to load
  if (proposalData.error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-red-600">
          <p>Error loading proposal {proposalId}</p>
          <p className="text-sm">{String(proposalData.error)}</p>
        </div>
      </div>
    );
  }
  
  // Show message if proposal doesn't exist
  if (!proposal) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-gray-500 text-center">
          <p>Proposal #{proposalId} not found</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: number) => {
    switch (status) {
      case 1: return 'bg-primary-100 text-primary-800'; // Active
      case 4: return 'bg-success-100 text-success-800'; // Succeeded
      case 3: return 'bg-error-100 text-error-800'; // Defeated
      default: return 'bg-gray-100 text-gray-800';
    }
  };
  
  const getStatusText = (status: number) => {
    switch (status) {
      case 1: return 'Active';
      case 4: return 'Passed';
      case 3: return 'Failed';
      default: return 'Pending';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {(proposal as any)?.title || `Proposal #${proposalId}`}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor((proposal as any)?.status || 1)}`}>
              {getStatusText((proposal as any)?.status || 1)}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-2">
            {(proposal as any)?.description || 'No description provided'}
          </p>
          <div className="text-xs text-gray-500">
            <span>Type: {(proposal as any)?.['proposal-type'] || 'General'}</span>
            {(proposal as any)?.amount && (proposal as any)?.amount > 0 && (
              <span className="ml-4">Amount: {((proposal as any)?.amount / 1000000).toFixed(2)} STX</span>
            )}
            {(proposal as any)?.recipient && (
              <span className="ml-4">Recipient: {(proposal as any)?.recipient}</span>
            )}
          </div>
        </div>
      </div>

      {/* Voting Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">
            {(proposal as any)?.['for-votes'] || 0}
          </div>
          <div className="text-sm text-gray-600">For</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-error-600">
            {(proposal as any)?.['against-votes'] || 0}
          </div>
          <div className="text-sm text-gray-600">Against</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {(proposal as any)?.['abstain-votes'] || 0}
          </div>
          <div className="text-sm text-gray-600">Abstain</div>
        </div>
      </div>

      {/* Voting Actions */}
      {(proposal as any)?.status === 1 && currentUser && !hasVoted && (
        <div className="border-t border-gray-200 pt-4">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setSelectedVote(1)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedVote === 1
                  ? 'bg-success-600 text-white'
                  : 'bg-success-100 text-success-700 hover:bg-success-200'
              }`}
            >
              For
            </button>
            <button
              onClick={() => setSelectedVote(0)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedVote === 0
                  ? 'bg-error-600 text-white'
                  : 'bg-error-100 text-error-700 hover:bg-error-200'
              }`}
            >
              Against
            </button>
            <button
              onClick={() => setSelectedVote(2)}
              className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors ${
                selectedVote === 2
                  ? 'bg-gray-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Abstain
            </button>
          </div>
          {selectedVote !== null && (
            <button
              onClick={() => onVote(proposalId, selectedVote)}
              className="w-full mt-3 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
              disabled={isVoting}
            >
              {isVoting ? 'Casting Vote...' : 'Cast Vote'}
            </button>
          )}
        </div>
      )}
      
      {hasVoted && (
        <div className="border-t border-gray-200 pt-4">
          <p className="text-sm text-gray-600 text-center">You have already voted on this proposal</p>
        </div>
      )}
    </div>
  );
};

const Governance: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { userData } = useStacks();
  const [showCreateProposal, setShowCreateProposal] = useState(false);

  // Get proposal count from simple-governance contract
  const simpleGovernanceProposalCount = useReadOnlyContract(
    'simple-governance',
    'get-proposal-count',
    []
  );
  
  const proposalCount = simpleGovernanceProposalCount.data ? extractClarityValue(simpleGovernanceProposalCount.data) : '0';
  
  // Temporarily hardcode some values to avoid CORS issues
  const userSTXBalance = null;
  const votingPeriod = null;
  const isCommunityPoolMember = true; // Assume user is a member for now
  const memberPools = [{ name: 'Community Pool' }];
  const membershipLoading = false;

  const { mutate: castVote, isLoading: isVoting } = useContractCall();

  const handleVote = async (proposalId: number, support: number) => {
    if (!userData.address) {
      toast.error('Please connect your wallet to vote');
      return;
    }

    try {
      await castVote({
        contractName: 'simple-governance',
        functionName: 'cast-vote',
        functionArgs: [
          { type: 'uint', value: proposalId.toString() },
          { type: 'uint', value: support.toString() }
        ]
      });
      
      toast.success('Vote cast successfully!');
    } catch (error) {
      console.error('Voting failed:', error);
      toast.error('Failed to cast vote. Please try again.');
    }
  };

  const handleProposalCreated = () => {
    // Invalidate and refetch proposal data from blockchain
    queryClient.invalidateQueries(['simple-governance', 'get-proposal-count']);
    queryClient.invalidateQueries(['simple-governance']);
    queryClient.refetchQueries(['simple-governance']);
    toast.success('Proposals refreshed!');
  };

  // Check if user is a pool member
  const isSavingsPoolMember = false; // Temporarily disabled
  const isPoolMember = isSavingsPoolMember || isCommunityPoolMember;
  const canCreateProposal = isPoolMember;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Governance</h1>
          <p className="text-gray-600 mt-2">
            Participate in WashikaDAO governance by creating and voting on proposals
          </p>
        </div>
        {canCreateProposal && (
          <button
            onClick={() => setShowCreateProposal(true)}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Plus size={20} />
            <span>Create Proposal</span>
          </button>
        )}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Total Proposals</h3>
            <Vote className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {proposalCount || '0'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Your STX Balance</h3>
            <Users className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {userSTXBalance ? formatSTX(parseInt(extractClarityValue(userSTXBalance) || '0')) : '0'} STX
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Voting Period</h3>
            <Clock className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {votingPeriod ? `${votingPeriod}` : '0'} blocks
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Pool Membership</h3>
            <Calendar className="text-primary-600" size={24} />
          </div>
          <div>
            <p className="text-lg font-semibold text-gray-900">
              {membershipLoading ? 'Checking...' : isPoolMember ? 'Active Member' : 'Not a Member'}
            </p>
            <p className="text-sm text-gray-600">
              {isPoolMember ? `Member of ${memberPools.length} community pool${memberPools.length !== 1 ? 's' : ''}` : 'Join a pool to participate'}
            </p>
          </div>
        </div>
      </div>

      {/* Pool Membership Status */}
      {!canCreateProposal && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-4">
            <div className="flex-shrink-0">
              <UserPlus className="text-gray-400" size={48} />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900 mb-2">Join a Pool to Participate</h3>
              <p className="text-gray-600 mb-4">
                You need to be a member of a community pool to create and vote on governance proposals.
              </p>
              <div className="flex space-x-3">
                <button
                  onClick={() => navigate('/pools')}
                  className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <Users size={16} />
                  <span>Join a Pool</span>
                </button>
                <button
                  onClick={() => navigate('/pools?action=create')}
                  className="flex items-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
                >
                  <UserPlus size={16} />
                  <span>Create Pool</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Active Proposals */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Active Proposals</h2>
          <button
            onClick={handleProposalCreated}
            className="flex items-center space-x-2 text-primary-600 hover:text-primary-700 transition-colors"
          >
            <RefreshCw size={16} />
            <span>Refresh</span>
          </button>
        </div>
        
        {proposalCount && parseInt(proposalCount) > 0 ? (
          <div className="space-y-4">
            {Array.from({ length: Math.min(parseInt(proposalCount), 10) }, (_, i) => (
              <BlockchainProposalCard
                key={i + 1}
                proposalId={i + 1}
                onVote={handleVote}
                currentUser={userData.address || ''}
                isVoting={isVoting}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Vote size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals Yet</h3>
            <p className="text-gray-600 mb-6">
              {isPoolMember 
                ? 'Be the first to create a proposal and shape the future of your pool' 
                : 'Join a pool to participate in governance and create proposals'
              }
            </p>
            {canCreateProposal && (
              <button
                onClick={() => setShowCreateProposal(true)}
                className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors mx-auto"
              >
                <Plus size={20} />
                <span>Create First Proposal</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* How Governance Works */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-6">How Governance Works</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-600 font-bold">1</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Create Proposal</h3>
            <p className="text-gray-600 text-sm">
              Be a pool member to create proposals for fund allocation, pool parameters, or general governance
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-600 font-bold">2</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Community Vote</h3>
            <p className="text-gray-600 text-sm">
              Pool members vote using their STX balance. Proposals have a 3-day voting period
            </p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-primary-600 font-bold">3</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-2">Execute</h3>
            <p className="text-gray-600 text-sm">
              Successful proposals are queued in the timelock and executed after the delay period
            </p>
          </div>
        </div>
      </div>

      {/* Create Proposal Modal */}
      <CreateProposalModal
        isOpen={showCreateProposal}
        onClose={() => setShowCreateProposal(false)}
        onSuccess={handleProposalCreated}
      />
    </div>
  );
};

export default Governance;
