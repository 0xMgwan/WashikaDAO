import React, { useState } from 'react';
import { 
  Vote, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  Calendar,
  UserPlus
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useDAO, useProposal, useContractCall, useSavingsSTX } from '@/hooks/useContract';
import { useCommunityPoolMembership } from '@/hooks/useCommunityPoolMembership';
import { useStacks } from '@/hooks/useStacks';
import { formatSTX, extractClarityValue } from '@/utils/stacks';
import CreateProposalModal from '@/components/CreateProposalModal';
import toast from 'react-hot-toast';

interface ProposalCardProps {
  proposalId: number;
  onVote: (proposalId: number, support: number) => void;
  isVoting?: boolean;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposalId, onVote, isVoting = false }) => {
  const { proposal, state, isLoading } = useProposal(proposalId);
  const [selectedVote, setSelectedVote] = useState<number | null>(null);

  const getStateLabel = (stateValue: number) => {
    const states = [
      'Pending', 'Active', 'Canceled', 'Defeated', 
      'Succeeded', 'Queued', 'Expired', 'Executed'
    ];
    return states[stateValue] || 'Unknown';
  };

  const getStateColor = (stateValue: number) => {
    const colors = {
      0: 'bg-gray-100 text-gray-800', // Pending
      1: 'bg-primary-100 text-primary-800', // Active
      2: 'bg-gray-100 text-gray-800', // Canceled
      3: 'bg-error-100 text-error-800', // Defeated
      4: 'bg-success-100 text-success-800', // Succeeded
      5: 'bg-warning-100 text-warning-800', // Queued
      6: 'bg-gray-100 text-gray-800', // Expired
      7: 'bg-success-100 text-success-800', // Executed
    };
    return colors[stateValue as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-300 rounded w-3/4"></div>
          <div className="h-3 bg-gray-300 rounded w-1/2"></div>
          <div className="h-20 bg-gray-300 rounded"></div>
        </div>
      </div>
    );
  }

  if (!proposal || !state) return null;

  const proposalData = (proposal as any)?.value || {};
  const stateValue = parseInt(extractClarityValue(state) || '0');
  const isActive = stateValue === 1; // Active state

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow duration-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Proposal #{proposalId}
            </h3>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStateColor(stateValue)}`}>
              {getStateLabel(stateValue)}
            </span>
          </div>
          <p className="text-gray-600 text-sm mb-4">
            {proposalData.description || 'No description available'}
          </p>
        </div>
      </div>

      {/* Voting Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">
            {formatSTX(parseInt(proposalData?.['for-votes'] || '0'))}
          </div>
          <div className="text-sm text-gray-600">For</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-error-600">
            {formatSTX(parseInt(proposalData?.['against-votes'] || '0'))}
          </div>
          <div className="text-sm text-gray-600">Against</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {formatSTX(parseInt(proposalData?.['abstain-votes'] || '0'))}
          </div>
          <div className="text-sm text-gray-600">Abstain</div>
        </div>
      </div>

      {/* Voting Actions */}
      {isActive && (
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
              <CheckCircle size={16} className="inline mr-2" />
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
              <XCircle size={16} className="inline mr-2" />
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
              disabled={isVoting}
              className="w-full mt-3 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              {isVoting ? 'Casting Vote...' : 'Cast Vote'}
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Governance: React.FC = () => {
  const navigate = useNavigate();
  const { userData } = useStacks();
  const { proposalCount, votingPeriod } = useDAO();
  const { userSTXBalance, userShares } = useSavingsSTX();
  const { isMember: isCommunityPoolMember, memberPools, loading: membershipLoading } = useCommunityPoolMembership();
  const [showCreateProposal, setShowCreateProposal] = useState(false);

  const { mutate: castVote, isLoading: isVoting } = useContractCall();

  const handleVote = async (proposalId: number, support: number) => {
    try {
      await castVote({
        contractName: 'washika-dao',
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
    // Refresh proposal data after creation
    window.location.reload();
  };

  // Check if user is a pool member (either savings pool or community pool)
  const isSavingsPoolMember = userData.isSignedIn && userShares && parseInt(extractClarityValue(userShares) || '0') > 0;
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
            {proposalCount ? extractClarityValue(proposalCount) : '0'}
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
            {votingPeriod ? `${extractClarityValue(votingPeriod)} blocks` : '0 blocks'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Pool Membership</h3>
            <Calendar className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {membershipLoading ? 'Checking...' : (isPoolMember ? 'Active Member' : 'Not a Member')}
          </p>
          <p className="text-sm text-gray-600 mt-1">
            {isSavingsPoolMember && userShares ? `${formatSTX(parseInt(extractClarityValue(userShares) || '0'))} savings shares` : 
             isCommunityPoolMember ? `Member of ${memberPools.length} community pool${memberPools.length !== 1 ? 's' : ''}` : '0 shares'}
          </p>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Active Proposals</h2>
        
        {proposalCount && parseInt(extractClarityValue(proposalCount) || '0') > 0 ? (
          <div className="space-y-4">
            {Array.from({ length: Math.min(parseInt(extractClarityValue(proposalCount) || '0'), 10) }, (_, i) => (
              <ProposalCard
                key={i + 1}
                proposalId={i + 1}
                onVote={handleVote}
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
            {isPoolMember ? (
              <button
                onClick={() => setShowCreateProposal(true)}
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                <span>Create First Proposal</span>
              </button>
            ) : (
              <div className="text-center">
                <p className="text-sm text-gray-500 mb-4">You need to be a pool member to create proposals</p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <button
                    onClick={() => navigate('/pools')}
                    className="inline-flex items-center space-x-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors"
                  >
                    <Users size={20} />
                    <span>Join a Pool</span>
                  </button>
                  <button
                    onClick={() => navigate('/pools?action=create')}
                    className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <UserPlus size={20} />
                    <span>Create Pool</span>
                  </button>
                </div>
                <p className="text-xs text-gray-400 mt-2">Join an existing pool or create your own community pool</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Governance Info */}
      <div className="bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How Governance Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              1
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Create Proposal</h4>
              <p className="text-sm text-gray-600 mt-1">
                Be a pool member to create proposals
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              2
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Community Vote</h4>
              <p className="text-sm text-gray-600 mt-1">
                Pool members vote using their STX balance during the {votingPeriod ? extractClarityValue(votingPeriod) : '17280'} block voting period
              </p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
              3
            </div>
            <div>
              <h4 className="font-medium text-gray-900">Execute</h4>
              <p className="text-sm text-gray-600 mt-1">
                Successful proposals are queued in timelock and then executed
              </p>
            </div>
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
