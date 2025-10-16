import React, { useState } from 'react';
import {
  Vote, 
  Plus, 
  RefreshCw,
  AlertCircle,
  ThumbsUp,
  ThumbsDown,
  Minus,
  User,
  Clock
} from 'lucide-react';
import { useReadOnlyContract, useContractCall } from '../hooks/useContract';
import { extractClarityValue } from '../utils/stacks';
import { uintCV } from '@stacks/transactions';
import CreateProposalModal from '../components/CreateProposalModal';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';
import { useStacks } from '../hooks/useStacks';

const SimpleProposalCard: React.FC<{ proposalId: number }> = ({ proposalId }) => {
  const { userData } = useStacks();
  const queryClient = useQueryClient();
  const contractCall = useContractCall();
  const [isVoting, setIsVoting] = useState(false);

  // Get proposal data from blockchain
  const proposalData = useReadOnlyContract(
    'simple-governance',
    'get-proposal',
    [uintCV(proposalId)]
  );

  // Check if user has voted
  const userVoteData = useReadOnlyContract(
    'simple-governance',
    'has-voted',
    userData.address ? [uintCV(proposalId), { type: 'principal', value: userData.address }] : [],
    { enabled: !!userData.address }
  );

  // Show loading state
  if (proposalData.isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="grid grid-cols-3 gap-4">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  // Show error state if there's an error
  if (proposalData.isError) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-red-200 p-6">
        <div className="flex items-center space-x-3 text-red-600 mb-4">
          <AlertCircle size={20} />
          <h3 className="text-lg font-semibold">Proposal #{proposalId}</h3>
        </div>
        <p className="text-red-600 text-sm mb-2">
          Failed to load proposal data
        </p>
        <p className="text-gray-500 text-xs">
          Error: {(proposalData.error as any)?.message || 'Unknown error'}
        </p>
      </div>
    );
  }

  // Extract proposal details safely
  let proposal = null;
  try {
    if (proposalData.data) {
      const rawProposal = extractClarityValue(proposalData.data);
      console.log(`Proposal ${proposalId} raw data:`, rawProposal);
      // The contract returns an optional, so we need to check if it exists
      if (rawProposal && typeof rawProposal === 'object') {
        proposal = rawProposal;
        console.log(`Proposal ${proposalId} extracted:`, proposal);
      }
    }
  } catch (error) {
    console.error(`Error extracting proposal ${proposalId}:`, error);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-yellow-200 p-6">
        <div className="flex items-center space-x-3 text-yellow-600 mb-4">
          <AlertCircle size={20} />
          <h3 className="text-lg font-semibold">Proposal #{proposalId}</h3>
        </div>
        <p className="text-yellow-600 text-sm">
          Error parsing proposal data
        </p>
      </div>
    );
  }

  // Handle case where proposal doesn't exist
  if (!proposal) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Proposal #{proposalId}</h3>
          <p className="text-gray-500 text-sm">
            Proposal not found or not yet created
          </p>
        </div>
      </div>
    );
  }

  // Safely extract proposal fields with correct field names from contract
  const title = proposal?.title || `Proposal #${proposalId}`;
  const description = proposal?.description || 'No description available';
  const status = proposal?.status === 1 ? 'Active' : 'Pending';
  const proposalType = proposal?.['proposal-type'] || 'General';
  const amount = proposal?.amount || 0;
  const forVotes = proposal?.['for-votes'] || 0;
  const againstVotes = proposal?.['against-votes'] || 0;
  const abstainVotes = proposal?.['abstain-votes'] || 0;
  const proposer = proposal?.proposer || '';
  const endBlock = proposal?.['end-block'] || 0;

  // Handle voting
  const handleVote = async (support: number) => {
    if (!userData.isSignedIn) {
      toast.error('Please connect your wallet to vote');
      return;
    }

    setIsVoting(true);
    try {
      await contractCall.mutateAsync({
        contractName: 'simple-governance',
        functionName: 'cast-vote',
        functionArgs: [uintCV(proposalId), uintCV(support)],
      });

      toast.success('Vote cast successfully!');
      
      // Refresh proposal data
      queryClient.invalidateQueries(['simple-governance']);
    } catch (error) {
      console.error('Voting error:', error);
      toast.error('Failed to cast vote. Please try again.');
    } finally {
      setIsVoting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            {description}
          </p>
          <div className="text-xs text-gray-500">
            <span>Status: {status}</span>
            <span className="ml-4">Type: {proposalType}</span>
            {amount > 0 && (
              <span className="ml-4">Amount: {(amount / 1000000).toFixed(2)} STX</span>
            )}
          </div>
        </div>
      </div>

      {/* Voting Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {forVotes}
          </div>
          <div className="text-sm text-gray-600">For</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {againstVotes}
          </div>
          <div className="text-sm text-gray-600">Against</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {abstainVotes}
          </div>
          <div className="text-sm text-gray-600">Abstain</div>
        </div>
      </div>

      {/* Proposal Info */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
        <div className="flex items-center space-x-2">
          <User size={14} />
          <span>By: {proposer ? `${proposer.slice(0, 8)}...${proposer.slice(-4)}` : 'Unknown'}</span>
        </div>
        <div className="flex items-center space-x-2">
          <Clock size={14} />
          <span>Ends at block: {endBlock}</span>
        </div>
      </div>

      {/* Voting Actions */}
      <div className="border-t border-gray-200 pt-4">
        {!userData.isSignedIn ? (
          <div className="text-center text-gray-500">
            <p className="text-sm mb-2">Connect your wallet to vote</p>
          </div>
        ) : extractClarityValue(userVoteData.data) ? (
          <div className="text-center text-gray-500">
            <p className="text-sm">✓ You have already voted on this proposal</p>
          </div>
        ) : status === 'Active' ? (
          <div className="flex space-x-2">
            <button
              onClick={() => handleVote(1)}
              disabled={isVoting}
              className="flex-1 flex items-center justify-center space-x-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ThumbsUp size={16} />
              <span>{isVoting ? 'Voting...' : 'Vote For'}</span>
            </button>
            <button
              onClick={() => handleVote(0)}
              disabled={isVoting}
              className="flex-1 flex items-center justify-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <ThumbsDown size={16} />
              <span>{isVoting ? 'Voting...' : 'Vote Against'}</span>
            </button>
            <button
              onClick={() => handleVote(2)}
              disabled={isVoting}
              className="flex-1 flex items-center justify-center space-x-2 bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Minus size={16} />
              <span>{isVoting ? 'Voting...' : 'Abstain'}</span>
            </button>
          </div>
        ) : (
          <div className="text-center text-gray-500">
            <p className="text-sm">Voting period has ended</p>
          </div>
        )}
      </div>
    </div>
  );
};

const GovernanceSimple: React.FC = () => {
  const queryClient = useQueryClient();
  const [showCreateProposal, setShowCreateProposal] = useState(false);

  // Get proposal count from simple-governance contract
  const simpleGovernanceProposalCount = useReadOnlyContract(
    'simple-governance',
    'get-proposal-count',
    []
  );
  
  // Safely extract proposal count
  let proposalCount = 0;
  try {
    if (simpleGovernanceProposalCount.data && !simpleGovernanceProposalCount.isError) {
      const rawCount = extractClarityValue(simpleGovernanceProposalCount.data);
      proposalCount = typeof rawCount === 'bigint' ? Number(rawCount) : Number(rawCount) || 0;
    }
  } catch (error) {
    console.error('Error extracting proposal count:', error);
    proposalCount = 0;
  }

  const handleProposalCreated = () => {
    queryClient.invalidateQueries(['simple-governance']);
    toast.success('Proposals refreshed!');
  };

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
        <button
          onClick={() => setShowCreateProposal(true)}
          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Plus size={20} />
          <span>Create Proposal</span>
        </button>
      </div>

      {/* Stats */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-gray-600">Total Proposals</h3>
          <Vote className="text-primary-600" size={24} />
        </div>
        {simpleGovernanceProposalCount.isLoading ? (
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        ) : simpleGovernanceProposalCount.isError ? (
          <div className="flex items-center space-x-2 text-red-600">
            <AlertCircle size={20} />
            <span className="text-sm">Error loading count</span>
          </div>
        ) : (
          <p className="text-2xl font-bold text-gray-900">
            {proposalCount}
          </p>
        )}
      </div>

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
        
        {simpleGovernanceProposalCount.isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                    <div className="h-8 bg-gray-200 rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : simpleGovernanceProposalCount.isError ? (
          <div className="text-center py-12">
            <AlertCircle size={48} className="text-red-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Proposals</h3>
            <p className="text-gray-600 mb-6">
              Failed to connect to the governance contract. Please try refreshing.
            </p>
            <button
              onClick={handleProposalCreated}
              className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors mx-auto"
            >
              <RefreshCw size={20} />
              <span>Try Again</span>
            </button>
          </div>
        ) : proposalCount > 0 ? (
          <div className="space-y-4">
            {Array.from({ length: Math.min(proposalCount, 10) }, (_, i) => (
              <SimpleProposalCard key={i + 1} proposalId={i + 1} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Vote size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals Yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a proposal and shape the future of your pool
            </p>
            <button
              onClick={() => setShowCreateProposal(true)}
              className="flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors mx-auto"
            >
              <Plus size={20} />
              <span>Create First Proposal</span>
            </button>
          </div>
        )}
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

export default GovernanceSimple;
