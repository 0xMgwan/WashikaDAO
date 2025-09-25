import React, { useState } from 'react';
import { 
  Vote, 
  Plus, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Users,
  Calendar,
  ArrowRight
} from 'lucide-react';
import { useDAO, useProposal, useGovernanceToken } from '@/hooks/useContract';
import { useStacks } from '@/hooks/useStacks';
import { formatWASHA } from '@/utils/stacks';

interface ProposalCardProps {
  proposalId: number;
  onVote: (proposalId: number, support: number) => void;
}

const ProposalCard: React.FC<ProposalCardProps> = ({ proposalId, onVote }) => {
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

  const proposalData = proposal.value;
  const stateValue = parseInt(state.value);
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
            {formatWASHA(parseInt(proposalData['for-votes']))}
          </div>
          <div className="text-sm text-gray-600">For</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-error-600">
            {formatWASHA(parseInt(proposalData['against-votes']))}
          </div>
          <div className="text-sm text-gray-600">Against</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {formatWASHA(parseInt(proposalData['abstain-votes'] || '0'))}
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
              className="w-full mt-3 bg-primary-600 text-white py-2 px-4 rounded-lg hover:bg-primary-700 transition-colors font-medium"
            >
              Cast Vote
            </button>
          )}
        </div>
      )}
    </div>
  );
};

const Governance: React.FC = () => {
  const { userData } = useStacks();
  const { proposalCount, votingDelay, votingPeriod, proposalThreshold, quorumVotes } = useDAO();
  const { balance, currentVotes } = useGovernanceToken();
  const [showCreateProposal, setShowCreateProposal] = useState(false);

  const handleVote = async (proposalId: number, support: number) => {
    try {
      // This would call the contract
      console.log(`Voting ${support} on proposal ${proposalId}`);
      // await castVote(proposalId, support);
    } catch (error) {
      console.error('Voting failed:', error);
    }
  };

  const canCreateProposal = userData.isSignedIn && 
    currentVotes && 
    proposalThreshold && 
    parseInt(currentVotes.value) >= parseInt(proposalThreshold.value);

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
            {proposalCount ? proposalCount.value : '0'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Your Voting Power</h3>
            <Users className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {currentVotes ? formatWASHA(parseInt(currentVotes.value)) : '0'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Voting Period</h3>
            <Clock className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {votingPeriod ? `${votingPeriod.value} blocks` : '0 blocks'}
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-gray-600">Quorum Required</h3>
            <Calendar className="text-primary-600" size={24} />
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {quorumVotes ? formatWASHA(parseInt(quorumVotes.value)) : '0'}
          </p>
        </div>
      </div>

      {/* Proposals List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-gray-900">Active Proposals</h2>
        
        {proposalCount && parseInt(proposalCount.value) > 0 ? (
          <div className="space-y-4">
            {Array.from({ length: Math.min(parseInt(proposalCount.value), 10) }, (_, i) => (
              <ProposalCard
                key={i + 1}
                proposalId={i + 1}
                onVote={handleVote}
              />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <Vote size={48} className="text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Proposals Yet</h3>
            <p className="text-gray-600 mb-6">
              Be the first to create a proposal and shape the future of WashikaDAO
            </p>
            {userData.isSignedIn && (
              <button
                onClick={() => setShowCreateProposal(true)}
                className="inline-flex items-center space-x-2 bg-primary-600 text-white px-6 py-3 rounded-lg hover:bg-primary-700 transition-colors"
              >
                <Plus size={20} />
                <span>Create First Proposal</span>
              </button>
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
                Hold {proposalThreshold ? formatWASHA(parseInt(proposalThreshold.value)) : '100'} WASHA to create proposals
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
                Token holders vote during the {votingPeriod ? votingPeriod.value : '17280'} block voting period
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
    </div>
  );
};

export default Governance;
