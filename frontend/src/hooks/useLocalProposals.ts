import { useState, useEffect } from 'react';

export interface LocalProposal {
  id: number;
  title: string;
  description: string;
  type: string;
  amount?: string;
  recipient?: string;
  proposer: string;
  createdAt: number;
  forVotes: number;
  againstVotes: number;
  abstainVotes: number;
  status: 'active' | 'passed' | 'failed';
  voters: string[];
}

const STORAGE_KEY = 'washika-dao-proposals';

export const useLocalProposals = () => {
  const [proposals, setProposals] = useState<LocalProposal[]>([]);

  // Load proposals from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsedProposals = JSON.parse(stored);
        setProposals(parsedProposals);
      } catch (error) {
        console.error('Error loading proposals from localStorage:', error);
      }
    }
  }, []);

  // Save proposals to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(proposals));
  }, [proposals]);

  const createProposal = (proposalData: {
    title: string;
    description: string;
    type: string;
    amount?: string;
    recipient?: string;
    proposer: string;
  }) => {
    const newProposal: LocalProposal = {
      id: Date.now(), // Simple ID generation
      ...proposalData,
      createdAt: Date.now(),
      forVotes: 0,
      againstVotes: 0,
      abstainVotes: 0,
      status: 'active',
      voters: [],
    };

    setProposals(prev => [newProposal, ...prev]);
    return newProposal;
  };

  const voteOnProposal = (proposalId: number, vote: 'for' | 'against' | 'abstain', voter: string) => {
    setProposals(prev => prev.map(proposal => {
      if (proposal.id === proposalId && !proposal.voters.includes(voter)) {
        const updatedProposal = {
          ...proposal,
          voters: [...proposal.voters, voter],
        };

        if (vote === 'for') {
          updatedProposal.forVotes += 1;
        } else if (vote === 'against') {
          updatedProposal.againstVotes += 1;
        } else {
          updatedProposal.abstainVotes += 1;
        }

        // Simple logic to determine if proposal passed (more than 50% for votes)
        const totalVotes = updatedProposal.forVotes + updatedProposal.againstVotes + updatedProposal.abstainVotes;
        if (totalVotes >= 3) { // Minimum 3 votes to decide
          if (updatedProposal.forVotes > updatedProposal.againstVotes) {
            updatedProposal.status = 'passed';
          } else {
            updatedProposal.status = 'failed';
          }
        }

        return updatedProposal;
      }
      return proposal;
    }));
  };

  const hasVoted = (proposalId: number, voter: string): boolean => {
    const proposal = proposals.find(p => p.id === proposalId);
    return proposal ? proposal.voters.includes(voter) : false;
  };

  return {
    proposals,
    createProposal,
    voteOnProposal,
    hasVoted,
    proposalCount: proposals.length,
  };
};
