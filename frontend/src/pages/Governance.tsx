import React, { useState } from 'react';
import {
  Vote, 
  Plus, 
  RefreshCw
} from 'lucide-react';
import { useReadOnlyContract } from '../hooks/useContract';
import { extractClarityValue } from '../utils/stacks';
import { uintCV } from '@stacks/transactions';
import CreateProposalModal from '../components/CreateProposalModal';
import toast from 'react-hot-toast';
import { useQueryClient } from 'react-query';

const SimpleProposalCard: React.FC<{ proposalId: number }> = ({ proposalId }) => {
  // Get proposal data from blockchain
  const proposalData = useReadOnlyContract(
    'simple-governance',
    'get-proposal',
    [uintCV(proposalId)]
  );

  // Debug logging (can be removed later)
  if (proposalData.data) {
    console.log(`Proposal ${proposalId} loaded:`, proposalData.data);
  }

  // Extract proposal details
  let proposal = null;
  if (proposalData.data && !proposalData.isLoading && !proposalData.isError) {
    try {
      console.log(`Proposal ${proposalId} clarity value:`, proposalData.data);
      proposal = extractClarityValue(proposalData.data);
      console.log(`Proposal ${proposalId} extracted:`, proposal);
      
      // Log the structure to understand the data better
      if (proposal) {
        console.log(`Proposal ${proposalId} keys:`, Object.keys(proposal));
        console.log(`Proposal ${proposalId} title:`, proposal.title);
        console.log(`Proposal ${proposalId} description:`, proposal.description);
      }
    } catch (error) {
      console.error(`Error extracting proposal ${proposalId}:`, error);
    }
  }

  // Show error state if there's an error
  if (proposalData.isError) {
    console.error(`Proposal ${proposalId} error:`, proposalData.error);
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="text-center py-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Proposal #{proposalId}</h3>
          <p className="text-red-600 text-sm">
            Error loading proposal data: {(proposalData.error as any)?.message || 'Unknown error'}
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Check console for details
          </p>
        </div>
      </div>
    );
  }

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

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            {proposal?.title || `Proposal #${proposalId}`}
          </h3>
          <p className="text-gray-600 text-sm mb-2">
            {proposal?.description || 'Loading proposal details...'}
          </p>
          <div className="text-xs text-gray-500">
            <span>Status: {proposal?.status === 1 ? 'Active' : 'Pending'}</span>
            <span className="ml-4">Type: {proposal?.['proposal-type'] || proposal?.type || 'General'}</span>
            {proposal?.amount && proposal.amount > 0 && (
              <span className="ml-4">Amount: {(proposal.amount / 1000000).toFixed(2)} STX</span>
            )}
          </div>
        </div>
      </div>

      {/* Voting Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-success-600">
            {proposal?.['for-votes'] || proposal?.forVotes || 0}
          </div>
          <div className="text-sm text-gray-600">For</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-error-600">
            {proposal?.['against-votes'] || proposal?.againstVotes || 0}
          </div>
          <div className="text-sm text-gray-600">Against</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {proposal?.['abstain-votes'] || proposal?.abstainVotes || 0}
          </div>
          <div className="text-sm text-gray-600">Abstain</div>
        </div>
      </div>

      {/* Voting Actions */}
      <div className="border-t border-gray-200 pt-4">
        <div className="text-center text-gray-500">
          <p className="text-sm">
            {proposal ? 'Proposal loaded successfully! Voting will be enabled soon.' : 'Loading proposal data...'}
          </p>
        </div>
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
  
  const rawCount = simpleGovernanceProposalCount.data ? extractClarityValue(simpleGovernanceProposalCount.data) : 0;
  const proposalCount = typeof rawCount === 'bigint' ? Number(rawCount) : Number(rawCount) || 0;
  
  console.log('Proposal count raw:', simpleGovernanceProposalCount.data);
  console.log('Proposal count extracted:', proposalCount);

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
        <p className="text-2xl font-bold text-gray-900">
          {Number(proposalCount) || 0}
        </p>
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
        
        {proposalCount && proposalCount > 0 ? (
          <div className="space-y-4">
            {/* Use 1-based indexing since that's what works */}
            {Array.from({ length: Math.min(Number(proposalCount), 10) }, (_, i) => (
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
